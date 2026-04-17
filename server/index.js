const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const GRAPH_API = 'https://graph.facebook.com/v19.0';

function extractPageIdentifier(url) {
  try {
    const u = new URL(url.trim());
    const parts = u.pathname.split('/').filter(Boolean);
    if (!parts.length) return url.trim();
    // Handle /pages/page-name/numeric-id
    if (parts[0] === 'pages' && parts.length >= 3) return parts[2];
    // Handle /profile.php?id=NNNN
    if (parts[0] === 'profile.php') {
      const id = u.searchParams.get('id');
      if (id) return id;
    }
    return parts[0];
  } catch {
    return url.trim();
  }
}

function sinceTimestamp(filter) {
  const now = Date.now();
  const day = 86400000;
  const map = {
    week: 7,
    month: 30,
    '3months': 90,
    '6months': 180,
    year: 365,
  };
  if (!map[filter]) return null;
  return Math.floor((now - map[filter] * day) / 1000);
}

app.post('/api/analyze', async (req, res) => {
  const { pageUrl, dateFilter, accessToken } = req.body;

  if (!pageUrl || !accessToken) {
    return res.status(400).json({ error: 'pageUrl and accessToken are required' });
  }

  try {
    const identifier = extractPageIdentifier(pageUrl);

    // Resolve page info
    const pageRes = await axios.get(`${GRAPH_API}/${identifier}`, {
      params: {
        fields: 'id,name,picture.type(large),fan_count',
        access_token: accessToken,
      },
    });
    const pageInfo = pageRes.data;

    // Build post fetch params
    const postParams = {
      fields: [
        'id',
        'message',
        'story',
        'created_time',
        'full_picture',
        'permalink_url',
        'reactions.type(LIKE).limit(0).summary(true)',
      ].join(','),
      limit: 100,
      access_token: accessToken,
    };

    const since = sinceTimestamp(dateFilter);
    if (since) postParams.since = since;

    let allPosts = [];
    let nextUrl = `${GRAPH_API}/${pageInfo.id}/posts`;
    let nextParams = postParams;

    while (nextUrl) {
      const resp = await axios.get(nextUrl, { params: nextParams });
      const { data: posts, paging } = resp.data;

      if (posts && posts.length) allPosts = allPosts.concat(posts);

      // Facebook encodes all params into paging.next so clear params after first call
      nextUrl = paging?.next || null;
      nextParams = {};

      if (allPosts.length >= 2000) break;
    }

    const transformed = allPosts.map((p) => ({
      id: p.id,
      message: p.message || p.story || '',
      createdTime: p.created_time,
      picture: p.full_picture || null,
      permalink: p.permalink_url || null,
      likes: p.reactions?.summary?.total_count ?? 0,
    }));

    transformed.sort((a, b) => b.likes - a.likes);

    res.json({
      page: {
        id: pageInfo.id,
        name: pageInfo.name,
        picture: pageInfo.picture?.data?.url || null,
        fanCount: pageInfo.fan_count || 0,
      },
      posts: transformed,
      totalPosts: transformed.length,
    });
  } catch (err) {
    const fbErr = err.response?.data?.error;
    if (fbErr) {
      return res.status(400).json({
        error: fbErr.message,
        code: fbErr.code,
        type: fbErr.type,
      });
    }
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
