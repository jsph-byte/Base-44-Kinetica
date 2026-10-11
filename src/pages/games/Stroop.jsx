import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/lab/GameShell';
import Panel from '@/components/lab/Panel';
import QuizHUD from '@/components/lab/QuizHUD';
import ResultPanel from '@/components/lab/ResultPanel';
import DifficultySelector from '@/components/lab/DifficultySelector';
import { gameByKey } from '@/lib/games';
import { useCountdown } from '@/hooks/useCountdown';
import { useGameSave } from '@/hooks/useGameSave';
import { useDailyMode } from '@/hooks/useDailyMode';
import { todayKey } from '@/lib/daily';
import { applyMultiplier } from '@/lib/difficulty';

const game = gameByKey('stroop');
const ROUND = 45;

const COLORS = [
  { name: 'Red', hex: '#dc2626' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Orange', hex: '#ea580c' },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function makeQuestion(difficulty) {
  const colorCount = difficulty === 'easy' ? 4 : 6;
  const palette = COLORS.slice(0, colorCount);
  const congruentChance = difficulty === 'easy' ? 0.55 : difficulty === 'hard' ? 0.15 : 0.35;
  const word = pick(palette);
  let ink;
  if (Math.random() < congruentChance) {
    ink = word;
  } else {
    ink = pick(palette.filter((c) => c.name !== word.name)) || word;
  }
  return { word, ink, palette };
}

export default function Stroop() {
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
        playToken: `stroop-${Date.now()}`,
        isDaily,
        challengeDate: isDaily ? todayKey() : undefined,
      });
    }
  }, [phase, save, isDaily, difficulty]);

  const nextQuestion = () => {
    locked.current = false;
    setQuestion(makeQuestion(difficulty));
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

  const answer = (colorName) => {
    if (!playing.current || locked.current) return;
    locked.current = true;
    stats.current.asked += 1;
    const right = colorName === question.ink.name;
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
      right ? 280 : 700,
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
          tone="brain"
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
            replayLabel="Play again"
          />
        )}

        {phase === 'idle' && (
          <Panel className="text-center">
            <h2 className="font-display text-2xl tracking-tight">Name the colour, not the word.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              A colour word flashes up in a different ink. Tap the swatch that matches the ink — not what the
              word says. Forty-five seconds; the streak multiplier rewards a cool head.
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
                Start the test
              </Button>
            </div>
          </Panel>
        )}

        {phase === 'playing' && question && (
          <Panel>
            <p className="text-center text-xs sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Tap the ink colour
            </p>
            <div className="mt-8 flex h-28 items-center justify-center">
              <span
                className="font-display text-5xl font-bold tracking-tight sm:text-6xl"
                style={{ color: question.ink.hex }}
              >
                {question.word.name}
              </span>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
              {question.palette.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => answer(c.name)}
                  className="h-20 w-20 rounded-2xl border-2 border-border transition-all duration-150 hover:scale-105 sm:h-24 sm:w-24"
                  style={{ backgroundColor: c.hex }}
                  aria-label={c.name}
                />
              ))}
            </div>
            {flash && (
              <p className="mt-6 min-h-[18px] text-center text-xs text-muted-foreground">
                {flash === 'right'
                  ? 'Correct.'
                  : `The ink was ${question.ink.name}.`}
              </p>
            )}
          </Panel>
        )}
      </div>
    </GameShell>
  );
}