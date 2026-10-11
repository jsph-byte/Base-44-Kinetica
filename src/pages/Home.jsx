import { useState } from 'react';
import GameCard from '@/components/lab/GameCard';
import DailyChallengeCard from '@/components/lab/DailyChallengeCard';
import { CATEGORY_META, gamesByCategory } from '@/lib/games';
import { useProgress } from '@/hooks/useProgress';
import PullToRefresh from '@/components/PullToRefresh';

const TABS = [
  { key: 'physics', label: 'Physics', blurb: 'Real physics, running live in your browser. Change one number and watch how the whole system responds.' },
  { key: 'math', label: 'Math', blurb: 'Short, scored sessions that train the arithmetic, patterns and estimation you actually use.' },
  { key: 'brain', label: 'Brain', blurb: 'Board and puzzle games that keep a mind sharp — memory, logic and patience, all scored.' },
];

export default function Home() {
  const { best, plays, refresh } = useProgress();
  const [activeTab, setActiveTab] = useState('physics');
  const physics = gamesByCategory('physics');
  const maths = gamesByCategory('math');
  const brain = gamesByCategory('brain');
  const gamesForTab = { physics, math: maths, brain };
  const activeGames = gamesForTab[activeTab];

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-14 sm:px-8">
      <section>
        <span className="eyebrow">Physics &amp; math playground</span>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
          Explore the rules that move the world.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Sixteen hands-on experiments for curious minds. Drag a slider and the equations answer back:
          shape an orbit, time a pendulum, hand off momentum — or sit back and sharpen a mind with a puzzle.
        </p>

        <div className="mt-9 flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <div className="font-mono text-2xl ink-physics">{physics.length}</div>
            <div className="text-xs text-muted-foreground">physics simulations</div>
          </div>
          <div>
            <div className="font-mono text-2xl ink-math">{maths.length}</div>
            <div className="text-xs text-muted-foreground">math challenges</div>
          </div>
          <div>
            <div className="font-mono text-2xl ink-brain">{brain.length}</div>
            <div className="text-xs text-muted-foreground">brain games</div>
          </div>
          <div>
            <div className="font-mono text-2xl">{plays}</div>
            <div className="text-xs text-muted-foreground">runs logged</div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <DailyChallengeCard />
      </section>

      <section className="mt-16">
        <div className="flex gap-1 rounded-xl border border-border bg-card/50 p-1">
          {TABS.map((tab) => {
            const meta = CATEGORY_META[tab.key];
            const count = gamesForTab[tab.key].length;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  active ? `${meta.soft} ${meta.ink}` : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${meta.fill}`} />
                {tab.label}
                <span className="font-mono text-xs opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {TABS.find((t) => t.key === activeTab).blurb}
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {activeGames.map((game) => (
            <GameCard key={game.key} game={game} best={best[game.key]} />
          ))}
        </div>
      </section>
    </div>
    </PullToRefresh>
  );
}