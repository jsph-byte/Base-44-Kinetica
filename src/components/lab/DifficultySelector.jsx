import { DIFFICULTIES, DIFFICULTY_ORDER } from '@/lib/difficulty';

export default function DifficultySelector({
  value,
  onChange,
  tone = 'math',
  disabled = false,
}) {
  const activeClass =
    tone === 'brain'
      ? 'ink-brain bg-brain-soft'
      : tone === 'physics'
        ? 'ink-physics bg-physics-soft'
        : 'ink-math bg-math-soft';

  return (
    <div className={disabled ? 'opacity-60' : ''}>
      <div className="mb-2 text-xs sm:text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Difficulty
      </div>
      <div
        className={`inline-flex rounded-xl border border-border bg-card/50 p-1 ${
          disabled ? 'pointer-events-none' : ''
        }`}
      >
        {DIFFICULTY_ORDER.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              value === d ? activeClass : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {DIFFICULTIES[d].label}
          </button>
        ))}
      </div>
    </div>
  );
}