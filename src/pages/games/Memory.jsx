import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/lab/GameShell';
import Panel from '@/components/lab/Panel';
import ResultPanel from '@/components/lab/ResultPanel';
import { gameByKey } from '@/lib/games';
import { useGameSave } from '@/hooks/useGameSave';
import DifficultySelector from '@/components/lab/DifficultySelector';
import { useDailyMode } from '@/hooks/useDailyMode';
import { todayKey } from '@/lib/daily';
import { applyMultiplier } from '@/lib/difficulty';

const game = gameByKey('memory');
const PAIRS_FOR = { easy: 6, medium: 8, hard: 10 };
const POOL = ['π', '√', '∫', '∑', 'θ', 'ω', 'λ', 'Δ', '∞', '≈', '∂', '∇'];

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildDeck = (count) => {
  const chosen = shuffle(POOL).slice(0, count);
  return shuffle([...chosen, ...chosen]).map((symbol, i) => ({
    id: i,
    symbol,
    flipped: false,
    matched: false,
  }));
};

export default function Memory() {
  const { isDaily, difficulty: dailyDiff } = useDailyMode();
  const [difficulty, setDifficulty] = useState(dailyDiff || 'medium');
  const pairs = PAIRS_FOR[difficulty];
  const [deck, setDeck] = useState(() => buildDeck(PAIRS_FOR[dailyDiff || 'medium']));
  const [pending, setPending] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const locked = useRef(false);

  const { save, state: saveState, reset: resetSave } = useGameSave();
  const matchedCount = useMemo(() => deck.filter((c) => c.matched).length, [deck]);

  useEffect(() => {
    if (!running || done) return undefined;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running, done]);

  useEffect(() => {
    if (matchedCount === pairs && !done) {
      setDone(true);
      setRunning(false);
      const penalty = Math.max(0, moves - pairs) * 12 + seconds * 2;
      const score = Math.max(60, 1000 - penalty);
      save(game, {
        score: applyMultiplier(score, difficulty),
        summary: `${moves} moves in ${seconds}s`,
        playToken: `memory-${Date.now()}`,
        isDaily,
        challengeDate: isDaily ? todayKey() : undefined,
      });
    }
  }, [matchedCount, done, moves, seconds, save, pairs, difficulty, isDaily]);

  const flip = (id) => {
    if (locked.current || done) return;
    const card = deck.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (!running) setRunning(true);

    const next = deck.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setDeck(next);
    const newPending = [...pending, id];
    setPending(newPending);

    if (newPending.length === 2) {
      setMoves((m) => m + 1);
      locked.current = true;
      const [a, b] = newPending.map((pid) => next.find((c) => c.id === pid));
      if (a.symbol === b.symbol) {
        window.setTimeout(() => {
          setDeck((d) => d.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true } : c)));
          setPending([]);
          locked.current = false;
        }, 360);
      } else {
        window.setTimeout(() => {
          setDeck((d) => d.map((c) => (c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c)));
          setPending([]);
          locked.current = false;
        }, 820);
      }
    }
  };

  const reset = (count = pairs) => {
    setDeck(buildDeck(count));
    setPending([]);
    setMoves(0);
    setSeconds(0);
    setRunning(false);
    setDone(false);
    locked.current = false;
    resetSave();
  };

  const score = Math.max(60, 1000 - Math.max(0, moves - pairs) * 12 - seconds * 2);

  return (
    <GameShell game={game}>
      <div className="mx-auto max-w-2xl">
        <Panel
          title="Match the pairs"
          subtitle="Flip two cards at a time. Fewer moves and a quicker clock score higher."
          action={
            <div className="flex gap-5 font-mono text-sm">
              <span><span className="text-muted-foreground">moves </span>{moves}</span>
              <span><span className="text-muted-foreground">time </span>{seconds}s</span>
              <span><span className="text-muted-foreground">pairs </span>{matchedCount}/{pairs}</span>
            </div>
          }
        >
          <div className="grid grid-cols-4 gap-3" style={{ perspective: '1000px' }}>
            {deck.map((card) => {
              const shown = card.flipped || card.matched;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => flip(card.id)}
                  className="relative h-24 sm:h-28"
                  style={{ transformStyle: 'preserve-3d', transition: 'transform 0.4s', transform: shown ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                  aria-label={shown ? `card ${card.symbol}` : 'hidden card'}
                >
                  <span
                    className="absolute inset-0 flex items-center justify-center rounded-xl border border-border bg-secondary/60 text-muted-foreground"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <span className="font-display text-2xl">?</span>
                  </span>
                  <span
                    className={`absolute inset-0 flex items-center justify-center rounded-xl border text-3xl ${
                      card.matched
                        ? 'border-math/50 bg-math-soft ink-math'
                        : 'border-physics/40 bg-physics-soft ink-physics'
                    }`}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    {card.symbol}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <DifficultySelector
            value={difficulty}
            onChange={(d) => {
              setDifficulty(d);
              reset(PAIRS_FOR[d]);
            }}
            tone="brain"
            disabled={isDaily}
          />
          {!done && (
            <Button variant="outline" onClick={() => reset()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              New deck
            </Button>
          )}
        </div>

        {done && (
          <div className="mt-6">
            <ResultPanel
              score={applyMultiplier(score, difficulty)}
              saveState={saveState}
              onReplay={() => reset()}
              replayLabel="New deck"
            />
          </div>
        )}
      </div>
    </GameShell>
  );
}