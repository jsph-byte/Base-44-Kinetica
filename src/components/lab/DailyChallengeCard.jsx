import { Link } from 'react-router-dom';
import { CheckCircle2, CalendarDays, ArrowUpRight } from 'lucide-react';
import { getDailyChallenge } from '@/lib/daily';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { DIFFICULTIES } from '@/lib/difficulty';
import { CATEGORY_META } from '@/lib/games';

export default function DailyChallengeCard() {
  const challenge = getDailyChallenge();
  const { loading, completed, bestScore } = useDailyChallenge();
  const meta = CATEGORY_META[challenge.game.category];
  const Icon = challenge.game.icon;
  const diff = DIFFICULTIES[challenge.difficulty];

  return (
    <Link
      to={`${challenge.game.path}?daily=1&difficulty=${challenge.difficulty}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-card sm:flex-row sm:items-center sm:justify-between"
    >
      <span className={`absolute inset-x-0 top-0 h-px ${meta.fill} opacity-80`} />
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${meta.line} ${meta.soft} ${meta.ink}`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="eyebrow">Today's challenge</span>
          </div>
          <h3 className="mt-1.5 font-heading text-lg tracking-tight">{challenge.game.title}</h3>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            {challenge.game.blurb}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs ${meta.line} ${meta.soft} ${meta.ink}`}
            >
              {meta.noun}
            </span>
            <span className="rounded-full bg-secondary/70 px-2.5 py-0.5 text-xs text-muted-foreground">
              {diff.label}
            </span>
            {!loading && completed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs ink-physics">
                <CheckCircle2 className="h-3 w-3" /> Completed
                {bestScore != null ? ` · ${bestScore} pts` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 sm:mt-0 sm:ml-4">
        <span className="text-sm font-medium text-foreground">
          {completed ? 'Play again' : 'Start challenge'}
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
      </div>
    </Link>
  );
}