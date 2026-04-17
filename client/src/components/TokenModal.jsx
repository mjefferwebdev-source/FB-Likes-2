import { useState } from 'react';

export default function TokenModal({ token, onSave, onClose }) {
  const [value, setValue] = useState(token);
  const [showToken, setShowToken] = useState(false);

  function handleSave() {
    onSave(value.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Facebook Access Token</h2>
            <p className="text-sm text-gray-500 mt-0.5">Required to fetch posts via the Graph API</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Paste your access token here"
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]/30 focus:border-[#1877F2] font-mono"
              autoFocus
            />
            <button
              onClick={() => setShowToken((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-700"
            >
              {showToken ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-2">
            <p className="font-semibold">How to get your access token:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>
                Go to{' '}
                <span className="font-mono text-xs bg-blue-100 px-1 py-0.5 rounded">
                  developers.facebook.com
                </span>{' '}
                and create an app (or use an existing one)
              </li>
              <li>
                Open{' '}
                <span className="font-mono text-xs bg-blue-100 px-1 py-0.5 rounded">
                  Tools &rarr; Graph API Explorer
                </span>
              </li>
              <li>
                Select your app, click{' '}
                <strong>Generate Access Token</strong> and grant{' '}
                <span className="font-mono text-xs bg-blue-100 px-1 py-0.5 rounded">
                  pages_read_engagement
                </span>{' '}
                permission
              </li>
              <li>Copy the token and paste it above</li>
            </ol>
            <p className="text-xs text-blue-600 mt-1">
              Your token is stored locally in your browser only.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          {token && (
            <button
              onClick={() => onSave('')}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear token
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!value.trim()}
            className="px-5 py-2 bg-[#1877F2] text-white text-sm font-semibold rounded-xl hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Token
          </button>
        </div>
      </div>
    </div>
  );
}
