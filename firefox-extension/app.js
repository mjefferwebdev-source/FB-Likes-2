'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

const DATE_FILTERS = [
  { value: 'week',    label: 'Last Week' },
  { value: 'month',   label: 'Last Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
  { value: 'year',    label: 'Last Year' },
  { value: 'alltime', label: 'All Time' },
];

// ── State ─────────────────────────────────────────────────────────────────────

let state = {
  pageHistory: [],
  currentPage: null,
  posts: [],
  dateFilter: 'alltime',
  loading: false,
  error: null,
  scrapeCount: 0,
  scrapeTabId: null,
};

function setState(patch) {
  Object.assign(state, patch);
  render();
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

const el = id => document.getElementById(id);

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function show(id) { el(id).classList.remove('hidden'); }
function hide(id) { el(id).classList.add('hidden'); }
function toggle(id, visible) { visible ? show(id) : hide(id); }

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  renderSidebar();
  renderFilters();
  renderInputBar();
  renderContent();
}

function renderSidebar() {
  const { pageHistory, currentPage } = state;
  toggle('histEmpty', pageHistory.length === 0);

  el('histList').innerHTML = pageHistory.map(p => `
    <li>
      <div class="h-item ${currentPage?.url === p.url ? 'active' : ''}"
           onclick="onSelectPage(${JSON.stringify(p.url)})">
        ${p.picture
          ? `<img class="h-avatar" src="${esc(p.picture)}" alt="" onerror="this.style.display='none'">`
          : `<div class="h-avatar-ph">${svgFb(15)}</div>`}
        <div class="h-text">
          <div class="h-name">${esc(p.name)}</div>
          <div class="h-url">${esc(p.url.replace('https://www.facebook.com/', 'fb.com/'))}</div>
        </div>
        <button class="h-rm" onclick="event.stopPropagation(); onRemovePage(${JSON.stringify(p.url)})" title="Remove">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </li>`).join('');
}

function renderFilters() {
  el('filterRow').innerHTML = DATE_FILTERS.map(f => `
    <button class="f-btn ${state.dateFilter === f.value ? 'active' : ''}"
            ${state.loading ? 'disabled' : ''}
            onclick="onFilterChange(${JSON.stringify(f.value)})">${f.label}</button>`).join('');
}

function renderInputBar() {
  const btn = el('analyzeBtn');
  const input = el('urlInput');
  const loading = state.loading;
  const hasUrl = input.value.trim().length > 0;

  btn.textContent = '';
  if (loading) {
    btn.innerHTML = `
      <svg class="spinning" width="14" height="14" fill="none" viewBox="0 0 24 24">
        <circle opacity=".25" cx="12" cy="12" r="10" stroke="white" stroke-width="4"/>
        <path opacity=".75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>Stop`;
    btn.className = 'btn-analyze stop';
    btn.disabled = false;
  } else {
    btn.textContent = 'Analyze';
    btn.className = 'btn-analyze';
    btn.disabled = !hasUrl;
  }
  input.disabled = loading;
}

function renderContent() {
  const { currentPage, posts, loading, error, scrapeCount } = state;

  // Error
  if (error) {
    el('errorBox').innerHTML = `<strong>Error:</strong> ${esc(error)}<div class="error-hint">Make sure you are logged into Facebook in Firefox, then try again.</div>`;
    show('errorBox');
  } else {
    hide('errorBox');
  }

  // Progress banner
  if (loading) {
    el('progressBox').innerHTML = `
      <svg class="spinning" width="20" height="20" fill="none" viewBox="0 0 24 24" style="flex-shrink:0">
        <circle opacity=".25" cx="12" cy="12" r="10" stroke="#1877F2" stroke-width="4"/>
        <path opacity=".75" fill="#1877F2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <div>
        <div class="progress-title">Opening Facebook in the background and scrolling through posts…</div>
        <div class="progress-sub" id="progressCount">${scrapeCount} posts collected so far. Large pages may take a minute.</div>
      </div>`;
    show('progressBox');
  } else {
    hide('progressBox');
  }

  // Page banner
  if (currentPage && !loading) {
    el('pageBox').innerHTML = `
      ${currentPage.picture
        ? `<img class="page-avatar" src="${esc(currentPage.picture)}" alt="" onerror="this.style.display='none'">`
        : `<div class="page-avatar-ph">${svgFb(26)}</div>`}
      <div>
        <div class="page-name">${esc(currentPage.name)}</div>
        <div class="page-meta">${posts.length} post${posts.length !== 1 ? 's' : ''} found · sorted by likes</div>
      </div>`;
    show('pageBox');
  } else {
    hide('pageBox');
  }

  // Welcome / empty states
  toggle('welcomeEl', !loading && !currentPage && !error);
  toggle('emptyEl',   !loading && !!currentPage && posts.length === 0);

  // Skeleton cards while loading
  if (loading) {
    el('skelGrid').innerHTML = Array(8).fill(0).map(() => `
      <div class="post-card pulsing">
        <div class="skel-img skel"></div>
        <div class="post-body" style="gap:12px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="skel" style="height:13px;width:80px"></div>
            <div class="skel" style="height:22px;width:58px;border-radius:999px"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <div class="skel" style="height:11px;width:100%"></div>
            <div class="skel" style="height:11px;width:85%"></div>
            <div class="skel" style="height:11px;width:70%"></div>
          </div>
        </div>
      </div>`).join('');
    show('skelGrid');
  } else {
    hide('skelGrid');
  }

  // Post grid
  if (!loading && posts.length > 0) {
    el('postsLabel').textContent = `${posts.length} posts · sorted by likes`;
    show('postsLabel');
    el('postGrid').innerHTML = posts.map((post, i) => `
      <div class="post-card">
        ${post.picture ? `<img class="post-img" src="${esc(post.picture)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
        <div class="post-body">
          <div class="post-row">
            <div class="post-left">
              <div class="rank ${rankClass(i + 1)}">${i + 1}</div>
              <div class="post-date">${formatDate(post.createdTime)}</div>
            </div>
            <div class="like-pill">
              <svg width="13" height="13" fill="#1877F2" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
              </svg>
              <span class="like-num">${formatLikes(post.likes)}</span>
            </div>
          </div>
          ${post.message ? `<p class="post-msg">${esc(post.message)}</p>` : ''}
          ${post.permalink ? `
            <a href="${esc(post.permalink)}" target="_blank" rel="noopener noreferrer" class="post-link">
              View on Facebook
              <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>` : ''}
        </div>
      </div>`).join('');
    show('postGrid');
  } else {
    hide('postsLabel');
    hide('postGrid');
  }
}

// ── Icon helpers ──────────────────────────────────────────────────────────────

function svgFb(size) {
  return `<svg width="${size}" height="${size}" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatLikes(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function rankClass(n) {
  return ['rank-1', 'rank-2', 'rank-3'][n - 1] || 'rank-n';
}

// ── Storage helpers ───────────────────────────────────────────────────────────

async function loadHistory() {
  const data = await browser.storage.local.get('page_history');
  state.pageHistory = data.page_history || [];
}

function saveHistory() {
  browser.storage.local.set({ page_history: state.pageHistory });
}

function upsertHistory(page) {
  const idx = state.pageHistory.findIndex(p => p.url === page.url);
  if (idx >= 0) state.pageHistory[idx] = { ...page };
  else state.pageHistory = [{ ...page }, ...state.pageHistory];
  saveHistory();
}

// ── Scraping orchestration ────────────────────────────────────────────────────

async function analyze(url, filter) {
  url    = url    || el('urlInput').value.trim();
  filter = filter || state.dateFilter;
  if (!url) return;

  setState({
    loading: true, error: null, posts: [], scrapeCount: 0,
    currentPage: { url, name: slugFromUrl(url), picture: null },
  });

  await browser.storage.local.set({ scrape_state: { status: 'running', count: 0, posts: [] } });

  try {
    const tab = await browser.tabs.create({ url, active: false });
    setState({ scrapeTabId: tab.id });

    await waitForLoad(tab.id);
    await sleep(1500);
    await sendWithRetry(tab.id, { action: 'start', dateFilter: filter });
  } catch (err) {
    setState({ loading: false, error: err.message, scrapeTabId: null });
    closeTab();
  }
}

async function stopScrape() {
  if (state.scrapeTabId) {
    try { await browser.tabs.sendMessage(state.scrapeTabId, { action: 'stop' }); } catch {}
  }
  setState({ loading: false });
  closeTab();
}

function onScrapeState(s) {
  if (!s) return;

  if (s.status === 'running') {
    setState({ loading: true, scrapeCount: s.count });
  } else if (s.status === 'done') {
    const page = { ...state.currentPage };
    if (s.pageInfo?.name)    page.name    = s.pageInfo.name;
    if (s.pageInfo?.picture) page.picture = s.pageInfo.picture;
    upsertHistory(page);
    setState({ loading: false, posts: s.posts, scrapeCount: s.count, currentPage: page });
    closeTab();
  } else if (s.status === 'error') {
    setState({ loading: false, error: s.error || 'Something went wrong.' });
    closeTab();
  }
}

async function closeTab() {
  const id = state.scrapeTabId;
  if (id) {
    state.scrapeTabId = null;
    try { await browser.tabs.remove(id); } catch {}
  }
}

// ── Event handlers (called from HTML onclick) ─────────────────────────────────

function onSelectPage(url) {
  el('urlInput').value = url;
  renderInputBar();
  analyze(url, state.dateFilter);
}

function onRemovePage(url) {
  state.pageHistory = state.pageHistory.filter(p => p.url !== url);
  saveHistory();
  if (state.currentPage?.url === url) setState({ currentPage: null, posts: [] });
  else render();
}

function onFilterChange(filter) {
  state.dateFilter = filter;
  if (state.currentPage && !state.loading) {
    analyze(state.currentPage.url, filter);
  } else {
    render();
  }
}

// ── Low-level helpers ─────────────────────────────────────────────────────────

function waitForLoad(tabId) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      browser.tabs.onUpdated.removeListener(fn);
      reject(new Error('Page took too long to load. Try again.'));
    }, 45_000);
    function fn(id, info) {
      if (id === tabId && info.status === 'complete') {
        clearTimeout(timer);
        browser.tabs.onUpdated.removeListener(fn);
        resolve();
      }
    }
    browser.tabs.onUpdated.addListener(fn);
  });
}

async function sendWithRetry(tabId, msg, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try { await browser.tabs.sendMessage(tabId, msg); return; }
    catch { if (i < tries - 1) await sleep(1000); }
  }
  throw new Error('Could not reach the Facebook page. Make sure you are logged into Facebook in Firefox.');
}

function slugFromUrl(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (parts[0] === 'pages' && parts[1]) return parts[1].replace(/-/g, ' ');
    return parts[0] || url;
  } catch { return url; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Boot ──────────────────────────────────────────────────────────────────────

(async () => {
  await loadHistory();
  await browser.storage.local.remove('scrape_state');

  // Wire up input + button
  el('urlInput').addEventListener('input', () => renderInputBar());
  el('urlInput').addEventListener('keydown', e => { if (e.key === 'Enter') analyze(); });
  el('analyzeBtn').addEventListener('click', () => {
    if (state.loading) stopScrape(); else analyze();
  });

  // Listen for scrape progress via storage changes
  browser.storage.onChanged.addListener(changes => {
    if (changes.scrape_state) onScrapeState(changes.scrape_state.newValue);
  });

  render();
})();
