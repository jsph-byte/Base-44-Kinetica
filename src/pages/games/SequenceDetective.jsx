import { useRef, useState } from 'react';
import { Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/lab/GameShell';
import Panel from '@/components/lab/Panel';
import QuizHUD from '@/components/lab/QuizHUD';
import OptionButton from '@/components/lab/OptionButton';
import ResultPanel from '@/components/lab/ResultPanel';
import { gameByKey } from '@/lib/games';
import { sequenceQuestion } from '@/lib/generators';
import { useGameSave } from '@/hooks/useGameSave';
import DifficultySelector from '@/components/lab/DifficultySelector';
import { useDailyMode } from '@/hooks/useDailyMode';
import { todayKey } from '@/lib/daily';
import { applyMultiplier, DIFFICULTIES, levelForDifficulty } from '@/lib/difficulty';

const game = gameByKey('sequences');
const TOTAL = 10;

export default function SequenceDetective() {
  const { isDaily, difficulty: dailyDiff } = useDailyMode();
  const [difficulty, setDifficulty] = useState(dailyDiff || 'medium');
  const [phase, setPhase] = useState('idle');
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState(null);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [duration, setDuration] = useState(0);

  const { save, state: saveState, reset: resetSave } = useGameSave();
  const startedAt = useRef(0);

  const levelFor = (position) => levelForDifficulty(difficulty, position, 3);

  const start = () => {
    startedAt.current = Date.now();
    setIndex(0);
    setQuestion(sequenceQuestion(DIFFICULTIES[difficulty].level));
    setPicked(null);
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
      setScore(score + 10 + Math.min(streak, 5) * 2);
      setStreak(streak + 1);
      setCorrect(correct + 1);
    } else {
      setStreak(0);
    }
  };

  const advance = () => {
    if (index + 1 >= TOTAL) {
      const seconds = Math.round((Date.now() - startedAt.current) / 1000);
      setDuration(seconds);
      setPhase('done');
      save(game, {
        score: applyMultiplier(score, difficulty),
        summary: `${correct}/${TOTAL} sequences solved`,
        playToken: `sequences-${Date.now()}`,
        isDaily,
        challengeDate: isDaily ? todayKey() : undefined,
      });
      return;
    }
    const next = index + 1;
    setIndex(next);
    setQuestion(sequenceQuestion(levelFor(next)));
    setPicked(null);
  };

  const secondsPerQuestion = duration ? Math.round(duration / TOTAL) : 0;

  return (
    <GameShell game={game}>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <QuizHUD
          items={[
            { label: 'Score', value: `${score}` },
            { label: 'Streak', value: `${streak}` },
            { label: 'Correct', value: `${correct}/${TOTAL}` },
            { label: 'Pattern', value: `${Math.min(index + 1, TOTAL)} of ${TOTAL}` },
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
              { label: 'Per pattern', value: `${secondsPerQuestion}s` },
            ]}
            saveState={saveState}
            onReplay={start}
            replayLabel="New set"
          />
        )}

        {phase === 'idle' && (
          <Panel className="text-center">
            <h2 className="font-display text-2xl tracking-tight">Find the rule, name the next term.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Ten patterns, no clock. Work out the gaps — constant, growing, multiplying, or alternating —
              and pick the number that continues the run.
            </p>
            <div className="mt-6 flex flex-col items-center gap-4">
              <DifficultySelector value={difficulty} onChange={setDifficulty} tone="math" disabled={isDaily} />
              <Button onClick={start}>
                <Play className="mr-2 h-4 w-4" />
                Start investigating
              </Button>
            </div>
          </Panel>
        )}

        {phase === 'playing' && question && (
          <Panel>
            <p className="text-center text-xs sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              What comes next?
            </p>
            <p className="mt-4 text-center font-mono text-2xl tracking-tight sm:text-3xl">
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
                    label={option}
                    state={state}
                    onClick={() => answer(option)}
                  />
                );
              })}
            </div>

            {picked != null && (
              <div className="mt-6 flex flex-col items-center gap-4 border-t border-border/60 pt-5">
                <p className="text-center text-sm text-muted-foreground">
                  <span className={picked === question.answer ? 'ink-math' : 'text-destructive'}>
                    {picked === question.answer ? 'Correct.' : `Not quite — it is ${question.answer}.`}
                  </span>{' '}
                  {question.explanation}
                </p>
                <Button onClick={advance}>
                  {index + 1 >= TOTAL ? 'See results' : 'Next pattern'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </Panel>
        )}
      </div>
    </GameShell>
  );
}