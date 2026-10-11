import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/lab/GameShell';
import Panel from '@/components/lab/Panel';
import QuizHUD from '@/components/lab/QuizHUD';
import OptionButton from '@/components/lab/OptionButton';
import ResultPanel from '@/components/lab/ResultPanel';
import { gameByKey } from '@/lib/games';
import { estimateQuestion } from '@/lib/generators';
import { useCountdown } from '@/hooks/useCountdown';
import { useGameSave } from '@/hooks/useGameSave';
import DifficultySelector from '@/components/lab/DifficultySelector';
import { useDailyMode } from '@/hooks/useDailyMode';
import { todayKey } from '@/lib/daily';
import { applyMultiplier, DIFFICULTIES, levelForDifficulty } from '@/lib/difficulty';

const game = gameByKey('estimate');
const TOTAL = 12;
const PER_QUESTION = 8;

export default function EstimateIt() {
  const { isDaily, difficulty: dailyDiff } = useDailyMode();
  const [difficulty, setDifficulty] = useState(dailyDiff || 'medium');
  const [phase, setPhase] = useState('idle');
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState(null);
  const [picked, setPicked] = useState(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  const { save, state: saveState, reset: resetSave } = useGameSave();
  const stats = useRef({ score: 0, correct: 0 });
  const pending = useRef(null);

  const active = phase === 'playing' && !locked;
  const left = useCountdown(PER_QUESTION, active, () => resolve(null), index);

  useEffect(() => () => window.clearTimeout(pending.current), []);

  const advance = () => {
    if (index + 1 >= TOTAL) {
      setPhase('done');
      save(game, {
        score: applyMultiplier(stats.current.score, difficulty),
        summary: `${stats.current.correct}/${TOTAL} estimates on target`,
        playToken: `estimate-${Date.now()}`,
        isDaily,
        challengeDate: isDaily ? todayKey() : undefined,
      });
      return;
    }
    const next = index + 1;
    setIndex(next);
    setQuestion(estimateQuestion(levelForDifficulty(difficulty, next, 4)));
    setPicked(null);
    setLocked(false);
    setTimedOut(false);
  };

  const resolve = (value) => {
    if (locked) return;
    setLocked(true);
    setPicked(value);
    const right = value != null && value === question.answer;
    if (right) {
      stats.current.score += 10 + Math.round(4 * (left / PER_QUESTION));
      stats.current.correct += 1;
    }
    setScore(stats.current.score);
    setCorrect(stats.current.correct);
    setTimedOut(value == null);
    pending.current = window.setTimeout(advance, 1150);
  };

  const start = () => {
    stats.current = { score: 0, correct: 0 };
    window.clearTimeout(pending.current);
    setScore(0);
    setCorrect(0);
    setIndex(0);
    setQuestion(estimateQuestion(DIFFICULTIES[difficulty].level));
    setPicked(null);
    setLocked(false);
    setTimedOut(false);
    resetSave();
    setPhase('playing');
  };

  return (
    <GameShell game={game}>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <QuizHUD
          items={[
            { label: 'Score', value: `${score}` },
            { label: 'On target', value: `${correct}/${TOTAL}` },
            { label: 'Estimate', value: `${Math.min(index + 1, TOTAL)} of ${TOTAL}` },
            { label: 'Seconds left', value: `${Math.ceil(left)}s` },
          ]}
          meterValue={left}
          meterMax={PER_QUESTION}
        />

        {phase === 'done' && (
          <ResultPanel
            score={applyMultiplier(score, difficulty)}
            stats={[
              { label: 'On target', value: `${correct}/${TOTAL}` },
              { label: 'Accuracy', value: `${Math.round((correct / TOTAL) * 100)}%` },
              { label: 'Speed bonus', value: `${score - correct * 10 > 0 ? score - correct * 10 : 0} pts` },
            ]}
            saveState={saveState}
            onReplay={start}
            replayLabel="Another round"
          />
        )}

        {phase === 'idle' && (
          <Panel className="text-center">
            <h2 className="font-display text-2xl tracking-tight">Close is good enough.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Twelve questions, eight seconds each. You are not computing — you are rounding, halving and
              nudging toward the nearest sensible number, then answering fast for a speed bonus.
            </p>
            <div className="mt-6 flex flex-col items-center gap-4">
              <DifficultySelector value={difficulty} onChange={setDifficulty} tone="math" disabled={isDaily} />
              <Button onClick={start}>
                <Play className="mr-2 h-4 w-4" />
                Start estimating
              </Button>
            </div>
          </Panel>
        )}

        {phase === 'playing' && question && (
          <Panel>
            <p className="text-center text-xs sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              About how much?
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
                    onClick={() => resolve(option)}
                  />
                );
              })}
            </div>
            <p className="mt-5 min-h-[18px] text-center text-xs text-muted-foreground">
              {picked == null
                ? ''
                : timedOut
                  ? `Out of time — the closest answer was ${question.answer}. ${question.explanation}`
                  : `${picked === question.answer ? 'On target.' : `The closest answer was ${question.answer}.`} ${question.explanation}`}
            </p>
          </Panel>
        )}
      </div>
    </GameShell>
  );
}