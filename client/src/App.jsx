import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PageInput from './components/PageInput';
import DateFilter from './components/DateFilter';
import PostList from './components/PostList';
import TokenModal from './components/TokenModal';

const DATE_FILTERS = [
  { value: 'week', label: 'Last Week' },
  { value: 'month', label: 'Last Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
  { value: 'year', label: 'Last Year' },
  { value: 'alltime', label: 'All Time' },
];

export default function App() {
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem('fb_access_token') || ''
  );
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [pageHistory, setPageHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fb_page_history') || '[]');
    } catch {
      return [];
    }
  });
  const [currentPage, setCurrentPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [dateFilter, setDateFilter] = useState('alltime');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    localStorage.setItem('fb_page_history', JSON.stringify(pageHistory));
  }, [pageHistory]);

  useEffect(() => {
    localStorage.setItem('fb_access_token', accessToken);
  }, [accessToken]);

  async function analyzePage(url, filter) {
    const activeFilter = filter ?? dateFilter;
    const activeUrl = url ?? pageUrl;

    if (!activeUrl.trim()) return;

    if (!accessToken) {
      setShowTokenModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setPosts([]);
    setCurrentPage(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl: activeUrl,
          dateFilter: activeFilter,
          accessToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      setCurrentPage(data.page);
      setPosts(data.posts);

      setPageHistory((prev) => {
        const existing = prev.find((p) => p.id === data.page.id);
        if (existing) {
          return prev.map((p) =>
            p.id === data.page.id ? { ...p, ...data.page, url: activeUrl } : p
          );
        }
        return [{ ...data.page, url: activeUrl }, ...prev];
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(filter) {
    setDateFilter(filter);
    if (currentPage) {
      const activeUrl =
        pageUrl || pageHistory.find((p) => p.id === currentPage.id)?.url || '';
      analyzePage(activeUrl, filter);
    }
  }

  function handleSelectPage(page) {
    setPageUrl(page.url);
    analyzePage(page.url, dateFilter);
  }

  function handleRemovePage(pageId) {
    setPageHistory((prev) => prev.filter((p) => p.id !== pageId));
    if (currentPage?.id === pageId) {
      setCurrentPage(null);
      setPosts([]);
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        history={pageHistory}
        currentPageId={currentPage?.id}
        onSelectPage={handleSelectPage}
        onRemovePage={handleRemovePage}
      />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1877F2] rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">FB Post Analyzer</h1>
              <p className="text-xs text-gray-400 leading-tight">Rank posts by likes</p>
            </div>
          </div>
          <button
            onClick={() => setShowTokenModal(true)}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              accessToken
                ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                : 'text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100 animate-pulse'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${accessToken ? 'bg-green-500' : 'bg-orange-500'}`}
            />
            {accessToken ? 'Token set' : 'Set API token'}
          </button>
        </header>

        {/* Input bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
          <PageInput
            value={pageUrl}
            onChange={setPageUrl}
            onAnalyze={() => analyzePage()}
            loading={loading}
          />
          <div className="mt-3">
            <DateFilter options={DATE_FILTERS} active={dateFilter} onChange={handleFilterChange} />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {currentPage && !loading && (
            <div className="mb-5 flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              {currentPage.picture ? (
                <img
                  src={currentPage.picture}
                  alt={currentPage.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#1877F2]/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 text-lg truncate">{currentPage.name}</h2>
                <p className="text-gray-500 text-sm">
                  {currentPage.fanCount > 0 &&
                    `${currentPage.fanCount.toLocaleString()} followers · `}
                  {posts.length} post{posts.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          )}

          <PostList posts={posts} loading={loading} hasPage={!!currentPage || loading} />
        </div>
      </main>

      {showTokenModal && (
        <TokenModal
          token={accessToken}
          onSave={(t) => {
            setAccessToken(t);
            setShowTokenModal(false);
          }}
          onClose={() => setShowTokenModal(false)}
        />
      )}
    </div>
  );
}
