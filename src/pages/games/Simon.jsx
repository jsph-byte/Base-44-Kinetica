import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/lab/GameShell';
import Panel from '@/components/lab/Panel';
import ResultPanel from '@/components/lab/ResultPanel';
import DifficultySelector from '@/components/lab/DifficultySelector';
import { gameByKey } from '@/lib/games';
import { useGameSave } from '@/hooks/useGameSave';
import { useDailyMode } from '@/hooks/useDailyMode';
import { todayKey } from '@/lib/daily';
import { applyMultiplier } from '@/lib/difficulty';

const game = gameByKey('simon');

const PADS = [
  { id: 0, hex: '#dc2626', lit: '#fca5a5' },
  { id: 1, hex: '#2563eb', lit: '#93c5fd' },
  { id: 2, hex: '#16a34a', lit: '#86efac' },
  { id: 3, hex: '#ea580c', lit: '#fdba74' },
  { id: 4, hex: '#9333ea', lit: '#d8b4fe' },
];

const DIFF_CONFIG = {
  easy: { pads: 3, speed: 700 },
  medium: { pads: 4, speed: 550 },
  hard: { pads: 5, speed: 400 },
};

export default function Simon() {
  const { isDaily, difficulty: dailyDiff } = useDailyMode();
  const [difficulty, setDifficulty] = useState(dailyDiff || 'medium');
  const [phase, setPhase] = useState('idle');
  const [activePad, setActivePad] = useState(null);
  const [round, setRound] = useState(0);
  const [inputIndex, setInputIndex] = useState(0);
  const [sequence, setSequence] = useState([]);

  const { save, state: saveState, reset: resetSave } = useGameSave();
  const seqRef = useRef([]);
  const timers = useRef([]);
  const config = DIFF_CONFIG[difficulty];

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const playSequence = (seq) => {
    setPhase('showing');
    setActivePad(null);
    seq.forEach((pad, i) => {
      const on = i * config.speed + 500;
      const off = on + Math.round(config.speed * 0.6);
      timers.current.push(setTimeout(() => setActivePad(pad), on));
      timers.current.push(setTimeout(() => setActivePad(null), off));
    });
    timers.current.push(
      setTimeout(() => {
        setPhase('input');
        setInputIndex(0);
      }, seq.length * config.speed + 600),
    );
  };

  const nextRound = () => {
    const next = [...seqRef.current, Math.floor(Math.random() * config.pads)];
    seqRef.current = next;
    setSequence(next);
    setRound(next.length);
    playSequence(next);
  };

  const start = () => {
    clearTimers();
    resetSave();
    seqRef.current = [];
    setSequence([]);
    setRound(0);
    setInputIndex(0);
    setActivePad(null);
    setTimeout(nextRound, 300);
  };

  const tap = (pad) => {
    if (phase !== 'input') return;
    setActivePad(pad);
    setTimeout(() => setActivePad(null), 200);

    if (pad === seqRef.current[inputIndex]) {
      const nextIdx = inputIndex + 1;
      if (nextIdx >= seqRef.current.length) {
        setInputIndex(0);
        setTimeout(nextRound, 650);
      } else {
        setInputIndex(nextIdx);
      }
    } else {
      clearTimers();
      setPhase('done');
      const completed = seqRef.current.length - 1;
      save(game, {
        score: applyMultiplier(completed * 100, difficulty),
        summary: `Reached round ${completed}`,
        playToken: `simon-${Date.now()}`,
        isDaily,
        challengeDate: isDaily ? todayKey() : undefined,
      });
    }
  };

  const completed = sequence.length > 0 ? sequence.length - 1 : 0;

  return (
    <GameShell game={game}>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {phase === 'done' && (
          <ResultPanel
            score={applyMultiplier(completed * 100, difficulty)}
            stats={[
              { label: 'Rounds', value: `${completed}` },
              { label: 'Sequence', value: `${sequence.length} steps` },
            ]}
            saveState={saveState}
            onReplay={start}
            replayLabel="Try again"
          />
        )}

        {phase === 'idle' && (
          <Panel className="text-center">
            <h2 className="font-display text-2xl tracking-tight">Watch, then repeat.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              The pads light up in a growing pattern. Repeat it back exactly. One more step every round —
              how long a chain can you hold?
            </p>
            <div className="mt-6 flex flex-col items-center gap-4">
              <DifficultySelector
                value={difficulty}
                onChange={setDifficulty}
                tone="brain"
                disabled={isDaily}
              />
              <Button onClick={start}>
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            </div>
          </Panel>
        )}

        {(phase === 'showing' || phase === 'input') && (
          <Panel>
            <div className="mb-5 text-center text-xs sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {phase === 'showing'
                ? 'Watch carefully…'
                : `Round ${round} — your turn (${inputIndex}/${sequence.length})`}
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {PADS.slice(0, config.pads).map((pad) => {
                const lit = activePad === pad.id;
                return (
                  <button
                    key={pad.id}
                    type="button"
                    onClick={() => tap(pad.id)}
                    disabled={phase !== 'input'}
                    className="h-24 w-24 rounded-2xl border-2 border-border transition-all duration-150 sm:h-28 sm:w-28"
                    style={{
                      backgroundColor: lit ? pad.lit : pad.hex,
                      transform: lit ? 'scale(1.06)' : 'scale(1)',
                      opacity: phase === 'input' ? 1 : 0.85,
                    }}
                    aria-label={`pad ${pad.id + 1}`}
                  />
                );
              })}
            </div>
          </Panel>
        )}
      </div>
    </GameShell>
  );
}