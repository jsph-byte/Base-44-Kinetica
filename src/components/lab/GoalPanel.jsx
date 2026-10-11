import Panel from '@/components/lab/Panel';

export default function GoalPanel({ goal, status = 'active', message, score, children }) {
  const label = status === 'solved' ? 'Solved' : status === 'idle' ? 'Ready' : 'In progress';
  const pill =
    status === 'solved'
      ? 'line-math ink-math bg-math-soft'
      : status === 'active'
        ? 'line-physics ink-physics bg-physics-soft'
        : 'border-border bg-secondary/60 text-muted-foreground';

  return (
    <Panel title="Objective">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed text-foreground/90">{goal}</p>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs sm:text-[10px] uppercase tracking-[0.16em] ${pill}`}
        >
          {label}
        </span>
      </div>

      {message && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{message}</p>}

      {score != null && (
        <p className="mt-4 font-mono text-4xl leading-none">
          {score}
          <span className="ml-1.5 text-sm text-muted-foreground">pts</span>
        </p>
      )}

      {children && <div className="mt-5 flex flex-wrap gap-2">{children}</div>}
    </Panel>
  );
}