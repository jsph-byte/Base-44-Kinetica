import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import Panel from '@/components/lab/Panel';
import AchievementGrid from '@/components/lab/AchievementGrid';
import { CATEGORY_META, GAMES } from '@/lib/games';
import { useProgress } from '@/hooks/useProgress';
import PullToRefresh from '@/components/PullToRefresh';

export default function Progress() {
  const { best, counts, plays, dailyCount, recent, loading, refresh } = useProgress();

  const tried = GAMES.filter((game) => best[game.key] != null).length;

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-12 sm:px-8">
      <span className="eyebrow">Your progress</span>
      <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
        A running record of everything you have tried.
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Experiments tried', value: `${tried}/${GAMES.length}` },
          { label: 'Runs logged', value: `${plays}` },
          { label: 'Daily challenges', value: `${dailyCount || 0}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card/60 p-5">
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className="mt-2 font-mono text-2xl">{stat.value}</div>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <AchievementGrid progress={{ best, counts, plays, dailyCount, recent }} />
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-sm font-semibold tracking-tight">Best score per experiment</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {GAMES.map((game) => {
            const meta = CATEGORY_META[game.category];
            const Icon = game.icon;
            const bestScore = best[game.key];
            return (
              <Link
                key={game.key}
                to={game.path}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card/50 p-4 transition hover:border-foreground/25 hover:bg-card"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.line} ${meta.soft} ${meta.ink}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{game.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {bestScore != null
                      ? `${counts[game.key] || 0} ${(counts[game.key] || 0) === 1 ? 'run' : 'runs'}`
                      : 'Not played yet'}
                  </span>
                </span>
                <span className="font-mono text-lg">
                  {bestScore != null ? bestScore : '—'}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-sm font-semibold tracking-tight">Recent sessions</h2>
        <Panel className="mt-5">
          {loading && <p className="text-sm text-muted-foreground">Loading your history…</p>}

          {!loading && recent.length === 0 && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Nothing logged yet. Play any experiment and your score lands here automatically.
            </p>
          )}

          <ul className="divide-y divide-border/60">
            {recent.map((run) => (
              <li key={run.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{run.game_title || run.game_key}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {run.summary || 'Session complete'} ·{' '}
                    {run.created_date
                      ? formatDistanceToNow(new Date(run.created_date), { addSuffix: true })
                      : ''}
                  </p>
                </div>
                <span className="font-mono text-base">{run.score}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </div>
    </PullToRefresh>
  );
}