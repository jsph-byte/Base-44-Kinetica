import { useEffect, useMemo, useRef, useState } from 'react';
import { Eraser, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/lab/GameShell';
import Panel from '@/components/lab/Panel';
import ResultPanel from '@/components/lab/ResultPanel';
import PresetButtons from '@/components/lab/PresetButtons';
import { gameByKey } from '@/lib/games';
import { useGameSave } from '@/hooks/useGameSave';
import { useDailyMode } from '@/hooks/useDailyMode';
import { todayKey } from '@/lib/daily';
import { DIFFICULTY, generateSudoku, findConflicts, isComplete } from '@/lib/sudoku';

const game = gameByKey('sudoku');
const LEVELS = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

export default function Sudoku() {
  const { isDaily, difficulty: dailyDiff } = useDailyMode();
  const startLevel = dailyDiff || 'easy';
  const [level, setLevel] = useState(startLevel);
  const [puzzle, setPuzzle] = useState(() => generateSudoku(startLevel).puzzle);
  const [solution, setSolution] = useState(() => generateSudoku(startLevel).solution);
  const [grid, setGrid] = useState(() => generateSudoku(startLevel).puzzle.map((r) => [...r]));
  const [selected, setSelected] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const { save, state: saveState, reset: resetSave } = useGameSave();
  const finishedRef = useRef(false);

  const conflicts = useMemo(() => findConflicts(grid), [grid]);

  useEffect(() => {
    if (!running || done) return undefined;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running, done]);

  const newGame = (next = level) => {
    const { puzzle: p, solution: s } = generateSudoku(next);
    setPuzzle(p);
    setSolution(s);
    setGrid(p.map((r) => [...r]));
    setSelected(null);
    setSeconds(0);
    setRunning(false);
    setDone(false);
    finishedRef.current = false;
    resetSave();
  };

  useEffect(() => {
    if (finishedRef.current) return;
    if (isComplete(grid)) {
      finishedRef.current = true;
      setDone(true);
      setRunning(false);
      const base = DIFFICULTY[level].base;
      const score = Math.max(100, base - seconds);
      save(game, {
        score,
        summary: `${level} solved in ${seconds}s`,
        playToken: `sudoku-${Date.now()}`,
        isDaily,
        challengeDate: isDaily ? todayKey() : undefined,
      });
    }
  }, [grid, level, seconds, save, isDaily]);

  const setCell = (r, c, n) => {
    if (done) return;
    if (puzzle[r][c] !== 0) return; // don't overwrite givens
    if (!running) setRunning(true);
    setGrid((g) => {
      const next = g.map((row) => [...row]);
      next[r][c] = n;
      return next;
    });
  };

  const onKey = (e) => {
    if (!selected) return;
    const [r, c] = selected;
    if (e.key >= '1' && e.key <= '9') setCell(r, c, Number(e.key));
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') setCell(r, c, 0);
    if (e.key === 'ArrowUp' && r > 0) setSelected([r - 1, c]);
    if (e.key === 'ArrowDown' && r < 8) setSelected([r + 1, c]);
    if (e.key === 'ArrowLeft' && c > 0) setSelected([r, c - 1]);
    if (e.key === 'ArrowRight' && c < 8) setSelected([r, c + 1]);
  };

  const score = Math.max(100, DIFFICULTY[level].base - seconds);

  return (
    <GameShell game={game}>
      <div className="mx-auto max-w-xl">
        <Panel
          title="Fill the grid"
          subtitle="Every row, column and 3×3 box needs the digits 1–9, once each."
          action={
            <div className="flex gap-5 font-mono text-sm">
              <span><span className="text-muted-foreground">time </span>{seconds}s</span>
            </div>
          }
        >
          <div
            className="mx-auto grid max-w-md grid-cols-9 gap-px overflow-hidden rounded-xl border border-border bg-border"
            tabIndex={0}
            onKeyDown={onKey}
          >
            {grid.map((row, r) =>
              row.map((value, c) => {
                const given = puzzle[r][c] !== 0;
                const isSel = selected && selected[0] === r && selected[1] === c;
                const bad = conflicts.has(r * 9 + c);
                const base = 'flex h-9 items-center justify-center text-lg select-none';
                const right = (c + 1) % 3 === 0 && c !== 8 ? 'mr-px' : '';
                const bottom = (r + 1) % 3 === 0 && r !== 8 ? 'mb-px' : '';
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => setSelected([r, c])}
                    className={`${base} ${right} ${bottom} ${
                      isSel ? 'bg-physics/20' : 'bg-card'
                    } ${
                      bad
                        ? 'text-red-400'
                        : given
                          ? 'font-semibold text-foreground'
                          : 'ink-math font-mono'
                    }`}
                  >
                    {value || ''}
                  </button>
                );
              }),
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <Button
                key={n}
                variant="outline"
                className="h-10 w-10 p-0 font-mono text-lg"
                onClick={() => selected && setCell(selected[0], selected[1], n)}
              >
                {n}
              </Button>
            ))}
            <Button
              variant="outline"
              className="h-10 w-10 p-0"
              onClick={() => selected && setCell(selected[0], selected[1], 0)}
              aria-label="erase"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>
        </Panel>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className={isDaily ? 'pointer-events-none opacity-60' : ''}>
            <PresetButtons label="Difficulty" options={LEVELS} value={level} onChange={(v) => { setLevel(v); newGame(v); }} tone="math" />
          </div>
          <Button variant="outline" onClick={() => newGame()}>
            <RotateCcw className="mr-2 h-4 w-4" />
            New puzzle
          </Button>
        </div>

        {done && (
          <div className="mt-6">
            <ResultPanel score={score} saveState={saveState} onReplay={() => newGame()} replayLabel="New puzzle" />
          </div>
        )}
      </div>
    </GameShell>
  );
}