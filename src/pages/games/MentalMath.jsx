import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/lab/GameShell';
import Panel from '@/components/lab/Panel';
import QuizHUD from '@/components/lab/QuizHUD';
import OptionButton from '@/components/lab/OptionButton';
import ResultPanel from '@/components/lab/ResultPanel';
import { gameByKey } from '@/lib/games';
import { arithmeticQuestion } from '@/lib/generators';
import { useCountdown } from '@/hooks/useCountdown';
import { useGameSave } from '@/hooks/useGameSave';
import DifficultySelector from '@/components/lab/DifficultySelector';
import { useDailyMode } from '@/hooks/useDailyMode';
import { todayKey } from '@/lib/daily';
import { applyMultiplier, levelForDifficulty } from '@/lib/difficulty';

const game = gameByKey('mental-math');
const ROUND = 60;

export default function MentalMath() {
  const { isDaily, difficulty: dailyDiff } = useDailyMode();
  const [difficulty, setDifficulty] = useState(dailyDiff || 'medium');
  const [phase, setPhase] = useState('idle');
  const [question, setQuestion] = useState(null);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [asked, setAsked] = useState(0);

  const { save, state: saveState, reset: resetSave } = useGameSave();
  const stats = useRef({ score: 0, correct: 0, asked: 0, streak: 0 });
  const playing = useRef(false);
  const locked = useRef(false);
  const pending = useRef(null);

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
        summary: `${stats.current.correct}/${stats.current.asked} correct in ${ROUND} seconds`,
        playToken: `mental-${Date.now()}`,
        isDaily,
        challengeDate: isDaily ? todayKey() : undefined,
      });
    }
  }, [phase, save, isDaily, difficulty]);

  const nextQuestion = (index) => {
    locked.current = false;
    setQuestion(arithmeticQuestion(levelForDifficulty(difficulty, index, 4)));
    setPicked(null);
  };

  const start = () => {
    stats.current = { score: 0, correct: 0, asked: 0, streak: 0 };
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setAsked(0);
    resetSave();
    nextQuestion(0);
    setPhase('playing');
  };

  const answer = (value) => {
    if (!playing.current || locked.current) return;
    locked.current = true;
    const right = value === question.answer;
    stats.current.asked += 1;

    if (right) {
      stats.current.streak += 1;
      stats.current.correct += 1;
      stats.current.score += 10 + Math.min(stats.current.streak - 1, 5) * 2;
    } else {
      stats.current.streak = 0;
    }

    setPicked(value);
    setScore(stats.current.score);
    setStreak(stats.current.streak);
    setCorrect(stats.current.correct);
    setAsked(stats.current.asked);

    const index = stats.current.asked;
    pending.current = window.setTimeout(
      () => {
        if (playing.current) nextQuestion(index);
      },
      right ? 320 : 900,
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
            replayLabel="Sprint again"
          />
        )}

        {phase === 'idle' && (
          <Panel className="text-center">
            <h2 className="font-display text-2xl tracking-tight">Sixty seconds. One rule.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Answer as many as you can before the clock runs out. Right answers are worth 10 points, and
              each extra answer in a row adds 2 more — the questions also get harder as you go.
            </p>
            <div className="mt-6 flex flex-col items-center gap-4">
              <DifficultySelector value={difficulty} onChange={setDifficulty} tone="math" disabled={isDaily} />
              <Button onClick={start}>
                <Play className="mr-2 h-4 w-4" />
                Start the sprint
              </Button>
            </div>
          </Panel>
        )}

        {phase === 'playing' && question && (
          <Panel>
            <p className="text-center text-xs sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Question {asked + 1}
            </p>
            <p className="mt-4 text-center font-mono text-3xl tracking-tight sm:text-4xl">
              {question.prompt}
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
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
            <p className="mt-5 min-h-[18px] text-center text-xs text-muted-foreground">
              {picked != null && picked !== question.answer ? question.explanation : ''}
            </p>
          </Panel>
        )}
      </div>
    </GameShell>
  );
}