import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/lab/GameShell';
import Panel from '@/components/lab/Panel';
import QuizHUD from '@/components/lab/QuizHUD';
import ResultPanel from '@/components/lab/ResultPanel';
import DifficultySelector from '@/components/lab/DifficultySelector';
import { gameByKey } from '@/lib/games';
import { primeQuestion } from '@/lib/generators';
import { useCountdown } from '@/hooks/useCountdown';
import { useGameSave } from '@/hooks/useGameSave';
import { useDailyMode } from '@/hooks/useDailyMode';
import { todayKey } from '@/lib/daily';
import { applyMultiplier, DIFFICULTIES } from '@/lib/difficulty';

const game = gameByKey('prime-hunter');
const ROUND = 60;

export default function PrimeHunter() {
  const { isDaily, difficulty: dailyDiff } = useDailyMode();
  const [difficulty, setDifficulty] = useState(dailyDiff || 'medium');
  const [phase, setPhase] = useState('idle');
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [asked, setAsked] = useState(0);
  const [flash, setFlash] = useState(null);

  const { save, state: saveState, reset: resetSave } = useGameSave();
  const stats = useRef({ score: 0, correct: 0, asked: 0, streak: 0 });
  const playing = useRef(false);
  const locked = useRef(false);
  const pending = useRef(null);

  const d = DIFFICULTIES[difficulty];
  const left = useCountdown(ROUND, phase === 'playing', () => setPhase('done'));

  useEffect(() => {
    playing.current = phase === 'playing';
    if (phase !== 'playing') window.clearTimeout(pending.current);
    return undefined;
  }, [phase]);

  useEffect(() => () => window.clearTimeout(pending.current), []);

  useEffect(() => {
    if (phase === 'done') {
      save(game, {
        score: applyMultiplier(stats.current.score, difficulty),
        summary: `${stats.current.correct}/${stats.current.asked} correct in ${ROUND}s`,
        playToken: `prime-${Date.now()}`,
        isDaily,
        challengeDate: isDaily ? todayKey() : undefined,
      });
    }
  }, [phase, save, isDaily, difficulty]);

  const nextQuestion = () => {
    locked.current = false;
    setQuestion(primeQuestion(d.level));
    setFlash(null);
  };

  const start = () => {
    stats.current = { score: 0, correct: 0, asked: 0, streak: 0 };
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setAsked(0);
    resetSave();
    nextQuestion();
    setPhase('playing');
  };

  const answer = (isPrimeGuess) => {
    if (!playing.current || locked.current) return;
    locked.current = true;
    stats.current.asked += 1;
    const right = isPrimeGuess === question.isPrime;
    if (right) {
      stats.current.streak += 1;
      stats.current.correct += 1;
      stats.current.score += 10 + Math.min(stats.current.streak - 1, 5) * 2;
    } else {
      stats.current.streak = 0;
    }
    setFlash(right ? 'right' : 'wrong');
    setScore(stats.current.score);
    setStreak(stats.current.streak);
    setCorrect(stats.current.correct);
    setAsked(stats.current.asked);
    pending.current = window.setTimeout(
      () => {
        if (playing.current) nextQuestion();
      },
      right ? 250 : 650,
    );
  };

  const accuracy = asked ? Math.round((correct / asked) * 100) : 0;

  return (
    <GameShell game={game}>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <QuizHUD
          items={[
            { label: 'Score', value: `${score}` },
            { label: 'Streak', value: `${streak}` },
            { label: 'Correct', value: `${correct}` },
            { label: 'Time left', value: `${Math.ceil(left)}s` },
          ]}
          meterValue={left}
          meterMax={ROUND}
          tone="math"
        />

        {phase === 'done' && (
          <ResultPanel
            score={applyMultiplier(score, difficulty)}
            stats={[
              { label: 'Correct', value: `${correct}/${asked}` },
              { label: 'Accuracy', value: `${accuracy}%` },
              { label: 'Best streak', value: `${streak}` },
            ]}
            saveState={saveState}
            onReplay={start}
            replayLabel="Hunt again"
          />
        )}

        {phase === 'idle' && (
          <Panel className="text-center">
            <h2 className="font-display text-2xl tracking-tight">Prime or not — decide fast.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Sixty seconds. A number appears — you decide: prime or composite. Right answers build a streak
              and the points stack up, but a wrong call resets it.
            </p>
            <div className="mt-6 flex flex-col items-center gap-4">
              <DifficultySelector
                value={difficulty}
                onChange={setDifficulty}
                tone="math"
                disabled={isDaily}
              />
              <Button onClick={start}>
                <Play className="mr-2 h-4 w-4" />
                Start hunting
              </Button>
            </div>
          </Panel>
        )}

        {phase === 'playing' && question && (
          <Panel>
            <p className="text-center text-xs sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Is this number prime?
            </p>
            <p className="mt-6 text-center font-mono text-5xl tracking-tight sm:text-6xl">
              {question.number}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => answer(true)}
                className="min-h-[62px] rounded-xl border border-border bg-card/70 px-4 py-3 text-center font-mono text-xl transition hover:border-foreground/30 hover:bg-card"
              >
                Prime
              </button>
              <button
                type="button"
                onClick={() => answer(false)}
                className="min-h-[62px] rounded-xl border border-border bg-card/70 px-4 py-3 text-center font-mono text-xl transition hover:border-foreground/30 hover:bg-card"
              >
                Not prime
              </button>
            </div>
            {flash && (
              <p className="mt-5 min-h-[18px] text-center text-xs text-muted-foreground">
                {flash === 'right'
                  ? 'Correct!'
                  : `Wrong — ${question.number} is ${question.isPrime ? 'prime' : 'composite'}.`}
              </p>
            )}
          </Panel>
        )}
      </div>
    </GameShell>
  );
}