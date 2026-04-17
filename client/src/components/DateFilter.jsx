export default function DateFilter({ options, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            active === opt.value
              ? 'bg-[#1877F2] text-white border-[#1877F2]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#1877F2] hover:text-[#1877F2]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
