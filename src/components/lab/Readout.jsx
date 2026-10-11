export default function Readout({ items = [], className = '' }) {
  return (
    <dl className={`grid grid-cols-2 gap-x-4 gap-y-3.5 ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="truncate text-xs sm:text-[10px] uppercase tracking-[0.16em] text-muted-foreground/85">
            {item.label}
          </dt>
          <dd
            className={`font-mono text-base leading-tight ${
              item.tone === 'primary'
                ? 'ink-physics'
                : item.tone === 'math'
                  ? 'ink-math'
                  : 'text-foreground'
            }`}
          >
            {item.value}
            {item.unit && <span className="ml-1 text-xs text-muted-foreground">{item.unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}