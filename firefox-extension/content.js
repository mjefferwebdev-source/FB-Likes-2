'use strict';

let scraping = false;

// ─── Messaging ────────────────────────────────────────────────────────────────

browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'ping') return Promise.resolve({ ready: true });
  if (msg.action === 'stop') { scraping = false; return Promise.resolve(); }
  if (msg.action === 'start') {
    if (!scraping) scrapeAll(msg.dateFilter);
    return Promise.resolve({ started: true });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function parseCount(raw) {
  if (!raw) return 0;
  const t = raw.trim().replace(/,/g, '').replace(/\s/g, '');
  const k = t.match(/^([\d.]+)[Kk]$/);  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const m = t.match(/^([\d.]+)[Mm]$/);  if (m) return Math.round(parseFloat(m[1]) * 1_000_000);
  const n = parseInt(t);
  return isNaN(n) ? 0 : n;
}

function getSince(filter) {
  const days = { week: 7, month: 30, '3months': 90, '6months': 180, year: 365 };
  return days[filter] ? Date.now() - days[filter] * 86_400_000 : null;
}

// ─── Data extraction ──────────────────────────────────────────────────────────

function getLikes(article) {
  // Strategy 1 — aria-label containing "reaction" or "like" + a number
  for (const el of article.querySelectorAll('[aria-label]')) {
    const label = el.getAttribute('aria-label') || '';
    if (/reaction|reacted|like/i.test(label) && /\d/.test(label)) {
      const m = label.match(/([\d,]+|[\d.]+\s*[KkMm])/);
      if (m) { const n = parseCount(m[1]); if (n > 0) return n; }
    }
  }

  // Strategy 2 — standalone number spans (reaction count display)
  const candidates = [];
  for (const span of article.querySelectorAll('span')) {
    if (span.children.length) continue;           // only leaf nodes
    const t = span.textContent.trim();
    if (/^\d{1,3}(,\d{3})*$/.test(t)) candidates.push(parseInt(t.replace(/,/g, '')));
    else if (/^[\d.]+[KkMm]$/.test(t)) candidates.push(parseCount(t));
  }
  const valid = candidates.filter(n => n > 0 && n < 50_000_000);
  return valid.length ? Math.max(...valid) : 0;
}

function getTimestamp(article) {
  // Older Facebook: abbr[data-utime]
  const abbr = article.querySelector('abbr[data-utime]');
  if (abbr) {
    const t = parseInt(abbr.getAttribute('data-utime'));
    if (!isNaN(t)) return new Date(t * 1000).toISOString();
  }

  // Newer Facebook: a[aria-label] whose label looks like a date
  for (const a of article.querySelectorAll('a[aria-label]')) {
    const label = a.getAttribute('aria-label') || '';
    if (/\d{4}/.test(label)) {
      const d = new Date(label);
      if (!isNaN(d) && d.getFullYear() >= 2004 && d.getFullYear() <= 2040) return d.toISOString();
    }
  }

  // Fallback: title / data-tooltip-content attributes
  for (const el of article.querySelectorAll('[data-tooltip-content],[title]')) {
    const raw = el.getAttribute('data-tooltip-content') || el.getAttribute('title') || '';
    if (/\d{4}/.test(raw)) {
      const d = new Date(raw);
      if (!isNaN(d) && d.getFullYear() >= 2004) return d.toISOString();
    }
  }

  return null;
}

function getPermalink(article) {
  const patterns = ['/posts/', 'story_fbid', '/permalink/', '/photos/', '/videos/', '/reel/'];
  for (const a of article.querySelectorAll('a[href]')) {
    const href = a.href || '';
    if (patterns.some(p => href.includes(p))) {
      try { const u = new URL(href); return u.origin + u.pathname; } catch { return href; }
    }
  }
  return null;
}

function getMessage(article) {
  const sels = [
    '[data-ad-comet-preview="message"]',
    '[data-ad-preview="message"]',
    'div[dir="auto"] > span[dir="auto"]',
    'div[dir="auto"]',
  ];
  for (const sel of sels) {
    const el = article.querySelector(sel);
    if (el) { const t = el.textContent.trim(); if (t) return t.slice(0, 2000); }
  }
  return '';
}

function getImage(article) {
  for (const img of article.querySelectorAll('img[src]')) {
    if ((img.naturalWidth || img.width) < 200) continue;
    if (/scontent|fbcdn/.test(img.src)) return img.src;
  }
  return null;
}

function getPageInfo() {
  const h1 = document.querySelector('h1');
  const name = h1 ? h1.textContent.trim() : document.title.replace(' | Facebook', '').trim();
  const avatarImg = document.querySelector('image[preserveAspectRatio]') ||
                    document.querySelector('[data-imgperflogname] img') ||
                    document.querySelector('a[role="img"] img');
  return { name: name || null, picture: avatarImg?.src || null };
}

function extractPost(article) {
  const permalink = getPermalink(article);
  if (!permalink) return null;
  return {
    key: permalink,
    permalink,
    message: getMessage(article),
    createdTime: getTimestamp(article),
    picture: getImage(article),
    likes: getLikes(article),
  };
}

// ─── Main scrape loop ─────────────────────────────────────────────────────────

async function scrapeAll(dateFilter) {
  scraping = true;

  await browser.storage.local.set({
    scrape_state: { status: 'running', count: 0, posts: [] },
  });

  try {
    // Let the page settle before we start reading it
    await sleep(3000);

    const posts = new Map();
    const since = getSince(dateFilter);
    let noNewRounds = 0;
    let hitDateLimit = false;

    while (scraping && noNewRounds < 5 && !hitDateLimit && posts.size < 1000) {
      let newThisRound = 0;

      for (const article of document.querySelectorAll('[role="article"]')) {
        if (!scraping) break;
        const post = extractPost(article);
        if (!post || posts.has(post.key)) continue;

        if (since && post.createdTime && new Date(post.createdTime).getTime() < since) {
          hitDateLimit = true;
          continue;
        }

        posts.set(post.key, {
          id: post.key,
          message: post.message,
          createdTime: post.createdTime,
          picture: post.picture,
          permalink: post.permalink,
          likes: post.likes,
        });
        newThisRound++;
      }

      noNewRounds = newThisRound > 0 ? 0 : noNewRounds + 1;

      await browser.storage.local.set({
        scrape_state: { status: 'running', count: posts.size, posts: [] },
      });

      if (!hitDateLimit && scraping && noNewRounds < 5) {
        window.scrollTo(0, document.body.scrollHeight);
        await sleep(2500);
      }
    }

    const sorted = Array.from(posts.values()).sort((a, b) => b.likes - a.likes);

    await browser.storage.local.set({
      scrape_state: {
        status: 'done',
        count: sorted.length,
        posts: sorted,
        pageInfo: getPageInfo(),
      },
    });
  } catch (err) {
    await browser.storage.local.set({
      scrape_state: { status: 'error', error: err.message, count: 0, posts: [] },
    });
  } finally {
    scraping = false;
  }
}
