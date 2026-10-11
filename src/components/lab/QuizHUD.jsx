export default function QuizHUD({ items = [], meterValue, meterMax, tone = 'math' }) {
  const showMeter = meterMax != null && meterValue != null;
  const pct = showMeter ? Math.max(0, Math.min(100, (meterValue / meterMax) * 100)) : 0;
  const bar = tone === 'physics' ? 'fill-physics' : tone === 'brain' ? 'fill-brain' : 'fill-math';

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="text-xs sm:text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </div>
            <div className="font-mono text-lg leading-tight">{item.value}</div>
          </div>
        ))}
      </div>
      {showMeter && (
        <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full ${bar} transition-[width] duration-200 ease-out`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}