const STATES = {
  idle: 'border-border bg-card/70 text-foreground hover:border-foreground/30 hover:bg-card',
  correct: 'line-math ink-math bg-math-soft',
  wrong: 'border-destructive/60 bg-destructive/10 text-destructive',
  dim: 'border-border/50 bg-card/30 text-muted-foreground opacity-60',
};

export default function OptionButton({ label, state = 'idle', onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[62px] w-full rounded-xl border px-4 py-3 text-center font-mono text-xl transition duration-200 ${STATES[state]}`}
    >
      {label}
    </button>
  );
}