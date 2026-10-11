import { Link } from 'react-router-dom';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import Panel from '@/components/lab/Panel';
import { Button } from '@/components/ui/button';

const SAVE_COPY = {
  idle: '',
  saving: 'Saving to your progress…',
  saved: 'Saved to your progress',
  error: 'Progress could not be saved — sign in and try again',
};

export default function ResultPanel({
  title = 'Session complete',
  score,
  stats = [],
  saveState = 'idle',
  onReplay,
  replayLabel = 'Play again',
}) {
  return (
    <Panel className="text-center">
      <p className="eyebrow">{title}</p>
      <p className="mt-3 font-display text-5xl leading-none">{score}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">points</p>

      {stats.length > 0 && (
        <dl className="mx-auto mt-7 grid max-w-md grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs sm:text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="mt-1 font-mono text-lg">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {SAVE_COPY[saveState] && (
        <p className="mt-6 text-xs text-muted-foreground">{SAVE_COPY[saveState]}</p>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onReplay}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {replayLabel}
        </Button>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All experiments
          </Link>
        </Button>
      </div>
    </Panel>
  );
}