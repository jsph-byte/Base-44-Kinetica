import { useRef, useState } from 'react';
import { Play, ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/lab/GameShell';
import Panel from '@/components/lab/Panel';
import QuizHUD from '@/components/lab/QuizHUD';
import OptionButton from '@/components/lab/OptionButton';
import ResultPanel from '@/components/lab/ResultPanel';
import { gameByKey } from '@/lib/games';
import { equationQuestion } from '@/lib/generators';
import { useGameSave } from '@/hooks/useGameSave';
import DifficultySelector from '@/components/lab/DifficultySelector';
import { useDailyMode } from '@/hooks/useDailyMode';
import { todayKey } from '@/lib/daily';
import { applyMultiplier, DIFFICULTIES, levelForDifficulty } from '@/lib/difficulty';

const game = gameByKey('equations');
const TOTAL = 8;

export default function EquationBalancer() {
  const { isDaily, difficulty: dailyDiff } = useDailyMode();
  const [difficulty, setDifficulty] = useState(dailyDiff || 'medium');
  const [phase, setPhase] = useState('idle');
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState(null);
  const [picked, setPicked] = useState(null);
  const [hint, setHint] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [duration, setDuration] = useState(0);

  const { save, state: saveState, reset: resetSave } = useGameSave();
  const startedAt = useRef(0);

  const levelFor = (position) => levelForDifficulty(difficulty, position, 2);

  const start = () => {
    startedAt.current = Date.now();
    setIndex(0);
    setQuestion(equationQuestion(DIFFICULTIES[difficulty].level));
    setPicked(null);
    setHint(false);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setDuration(0);
    resetSave();
    setPhase('playing');
  };

  const answer = (value) => {
    if (picked) return;
    const right = value === question.answer;
    setPicked(value);
    if (right) {
      setScore(score + (hint ? 6 : 12) + Math.min(streak, 4) * 2);
      setStreak(streak + 1);
      setCorrect(correct + 1);
    } else {
      setStreak(0);
    }
  };

  const advance = () => {
    if (index + 1 >= TOTAL) {
      setDuration(Math.round((Date.now() - startedAt.current) / 1000));
      setPhase('done');
      save(game, {
        score: applyMultiplier(score, difficulty),
        summary: `${correct}/${TOTAL} equations solved`,
        playToken: `equations-${Date.now()}`,
        isDaily,
        challengeDate: isDaily ? todayKey() : undefined,
      });
      return;
    }
    const next = index + 1;
    setIndex(next);
    setQuestion(equationQuestion(levelFor(next)));
    setPicked(null);
    setHint(false);
  };

  return (
    <GameShell game={game}>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <QuizHUD
          items={[
            { label: 'Score', value: `${score}` },
            { label: 'Streak', value: `${streak}` },
            { label: 'Solved', value: `${correct}/${TOTAL}` },
            { label: 'Equation', value: `${Math.min(index + 1, TOTAL)} of ${TOTAL}` },
          ]}
          meterValue={index + (picked ? 1 : 0)}
          meterMax={TOTAL}
        />

        {phase === 'done' && (
          <ResultPanel
            score={applyMultiplier(score, difficulty)}
            stats={[
              { label: 'Solved', value: `${correct}/${TOTAL}` },
              { label: 'Time taken', value: `${duration}s` },
              { label: 'Accuracy', value: `${Math.round((correct / TOTAL) * 100)}%` },
            ]}
            saveState={saveState}
            onReplay={start}
            replayLabel="Another set"
          />
        )}

        {phase === 'idle' && (
          <Panel className="text-center">
            <h2 className="font-display text-2xl tracking-tight">Balance it, and x gives itself up.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Eight equations from a one-step warm-up to x on both sides. Whatever you do to one side, do
              to the other — and if you slip, the whole worked solution appears.
            </p>
            <div className="mt-6 flex flex-col items-center gap-4">
              <DifficultySelector value={difficulty} onChange={setDifficulty} tone="math" disabled={isDaily} />
              <Button onClick={start}>
                <Play className="mr-2 h-4 w-4" />
                Start solving
              </Button>
            </div>
          </Panel>
        )}

        {phase === 'playing' && question && (
          <Panel>
            <p className="text-center text-xs sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Solve for x
            </p>
            <p className="mt-4 text-center font-mono text-2xl tracking-tight sm:text-4xl">
              {question.prompt}
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {question.options.map((option) => {
                const state =
                  picked == null
                    ? 'idle'
                    : option === question.answer
                      ? 'correct'
                      : option === picked
                        ? 'wrong'
                        : 'dim';
                return (
                  <OptionButton
                    key={option}
                    label={`x = ${option}`}
                    state={state}
                    onClick={() => answer(option)}
                  />
                );
              })}
            </div>

            {picked == null && (
              <div className="mt-6 text-center">
                {hint ? (
                  <p className="formula inline-block text-left">
                    {question.steps[0]}
                    <span className="ml-2 text-xs sm:text-[11px] text-muted-foreground">
                      (a hint costs you half the points)
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setHint(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Show me the first step
                  </button>
                )}
              </div>
            )}

            {picked != null && (
              <div className="mt-6 border-t border-border/60 pt-5">
                <p className="text-center text-sm">
                  {picked === question.answer ? (
                    <span className="ink-math">Correct — x = {question.answer}.</span>
                  ) : (
                    <span className="text-destructive">
                      Not quite. The answer is x = {question.answer}.
                    </span>
                  )}
                </p>
                <ol className="mx-auto mt-4 max-w-md space-y-2">
                  {question.steps.map((step, position) => (
                    <li key={step} className="flex gap-3 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-mono ink-math">{position + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-5 text-center">
                  <Button onClick={advance}>
                    {index + 1 >= TOTAL ? 'See results' : 'Next equation'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Panel>
        )}
      </div>
    </GameShell>
  );
}