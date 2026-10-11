// Sudoku generator with a uniqueness-checking solver.

const BASE = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function fullSolution() {
  const grid = BASE.map((row) => [...row]);
  const map = [0, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])];
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      grid[r][c] = map[grid[r][c]];
    }
  }
  for (let band = 0; band < 3; band += 1) {
    const rows = shuffle([0, 1, 2]).map((i) => band * 3 + i);
    const copy = grid.map((row) => [...row]);
    for (let i = 0; i < 3; i += 1) grid[band * 3 + i] = copy[rows[i]];
  }
  for (let stack = 0; stack < 3; stack += 1) {
    const cols = shuffle([0, 1, 2]).map((i) => stack * 3 + i);
    const copy = grid.map((row) => [...row]);
    for (let r = 0; r < 9; r += 1) {
      for (let i = 0; i < 3; i += 1) {
        grid[r][stack * 3 + i] = copy[r][cols[i]];
      }
    }
  }
  const bandOrder = shuffle([0, 1, 2]);
  let next = bandOrder.map((b) => grid.slice(b * 3, b * 3 + 3)).flat();
  const stackOrder = shuffle([0, 1, 2]);
  next = next.map((row) => {
    const rebuilt = stackOrder.map((s) => [row[s * 3], row[s * 3 + 1], row[s * 3 + 2]]).flat();
    return rebuilt;
  });
  return next;
}

function canPlace(grid, r, c, n) {
  for (let i = 0; i < 9; i += 1) {
    if (grid[r][i] === n || grid[i][c] === n) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      if (grid[br + i][bc + j] === n) return false;
    }
  }
  return true;
}

function countSolutions(grid, limit) {
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (grid[r][c] === 0) {
        let count = 0;
        for (let n = 1; n <= 9; n += 1) {
          if (canPlace(grid, r, c, n)) {
            grid[r][c] = n;
            count += countSolutions(grid, limit - count);
            grid[r][c] = 0;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return 1;
}

export const DIFFICULTY = {
  easy: { empty: 40, base: 600 },
  medium: { empty: 48, base: 800 },
  hard: { empty: 54, base: 1000 },
};

export function generateSudoku(level = 'easy') {
  const target = DIFFICULTY[level].empty;
  const solution = fullSolution();
  const puzzle = solution.map((row) => [...row]);
  const cells = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let removed = 0;
  for (const cell of cells) {
    if (removed >= target) break;
    const r = Math.floor(cell / 9);
    const c = cell % 9;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    const test = puzzle.map((row) => [...row]);
    if (countSolutions(test, 2) === 1) {
      removed += 1;
    } else {
      puzzle[r][c] = backup;
    }
  }
  return { puzzle, solution };
}

export function findConflicts(grid) {
  const bad = new Set();
  const key = (r, c) => r * 9 + c;
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const n = grid[r][c];
      if (!n) continue;
      for (let i = 0; i < 9; i += 1) {
        if (i !== c && grid[r][i] === n) bad.add(key(r, c));
        if (i !== r && grid[i][c] === n) bad.add(key(r, c));
      }
      const br = Math.floor(r / 3) * 3;
      const bc = Math.floor(c / 3) * 3;
      for (let i = 0; i < 3; i += 1) {
        for (let j = 0; j < 3; j += 1) {
          const rr = br + i;
          const cc = bc + j;
          if ((rr !== r || cc !== c) && grid[rr][cc] === n) bad.add(key(r, c));
        }
      }
    }
  }
  return bad;
}

export function isComplete(grid) {
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (!grid[r][c]) return false;
    }
  }
  return findConflicts(grid).size === 0;
}