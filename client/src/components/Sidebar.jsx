export default function Sidebar({ history, currentPageId, onSelectPage, onRemovePage }) {
  return (
    <aside className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="px-4 py-4 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Page History
        </h2>
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">
            Pages you analyze will appear here for quick access.
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto py-2">
          {history.map((page) => {
            const isActive = page.id === currentPageId;
            return (
              <li key={page.id}>
                <button
                  onClick={() => onSelectPage(page)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group ${
                    isActive
                      ? 'bg-[#1877F2]/10 border-r-2 border-[#1877F2]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {page.picture ? (
                    <img
                      src={page.picture}
                      alt={page.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#1877F2]/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isActive ? 'text-[#1877F2]' : 'text-gray-800'
                      }`}
                    >
                      {page.name}
                    </p>
                    {page.fanCount > 0 && (
                      <p className="text-xs text-gray-400 truncate">
                        {page.fanCount.toLocaleString()} followers
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePage(page.id);
                    }}
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove from history"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
