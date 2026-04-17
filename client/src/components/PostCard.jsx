function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatLikes(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

const RANK_COLORS = [
  'bg-yellow-400 text-yellow-900',
  'bg-gray-300 text-gray-700',
  'bg-orange-400 text-orange-900',
];

export default function PostCard({ post, rank }) {
  const rankColor = RANK_COLORS[rank - 1] || 'bg-gray-100 text-gray-500';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {post.picture && (
        <div className="relative h-44 bg-gray-100 overflow-hidden">
          <img
            src={post.picture}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${rankColor}`}
            >
              {rank}
            </span>
            <span className="text-xs text-gray-400">{formatDate(post.createdTime)}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full">
            <svg
              className="w-3.5 h-3.5 text-[#1877F2]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className="text-sm font-bold text-[#1877F2]">{formatLikes(post.likes)}</span>
          </div>
        </div>

        {post.message && (
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-4 flex-1">
            {post.message}
          </p>
        )}

        {post.permalink && (
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#1877F2] hover:underline mt-auto"
          >
            View on Facebook
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
