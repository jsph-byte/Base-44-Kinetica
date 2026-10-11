export default function PresetButtons({ label, options, value, onChange, tone = 'physics' }) {
  const active =
    tone === 'math' ? 'line-math ink-math bg-math-soft' : 'line-physics ink-physics bg-physics-soft';

  return (
    <div>
      {label && <div className="text-xs font-medium text-muted-foreground">{label}</div>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                isActive
                  ? active
                  : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}