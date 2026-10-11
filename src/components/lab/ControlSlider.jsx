import { Slider } from '@/components/ui/slider';

export default function ControlSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  hint,
  tone = 'physics',
}) {
  const ink = tone === 'math' ? 'ink-math' : 'ink-physics';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={`font-mono text-sm ${ink}`}>
          {format ? format(value) : value}
        </span>
      </div>
      <Slider
        className="mt-2.5"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(next[0])}
      />
      {hint && <p className="mt-1.5 text-xs sm:text-[11px] leading-relaxed text-muted-foreground/80">{hint}</p>}
    </div>
  );
}