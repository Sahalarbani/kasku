export function SegmentedTabs({ options, value, onChange }: any) {
  return (
    <div className="segmented-tabs">
      {options.map((opt: any) => (
        <button
          key={opt.value}
          type="button"
          className={`segment ${value === opt.value ? 'is-active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
