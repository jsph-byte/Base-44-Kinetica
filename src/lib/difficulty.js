export const DIFFICULTIES = {
  easy: { label: 'Easy', level: 1, ceiling: 2, multiplier: 0.8 },
  medium: { label: 'Medium', level: 2, ceiling: 3, multiplier: 1 },
  hard: { label: 'Hard', level: 4, ceiling: 5, multiplier: 1.35 },
};

export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

/** Escalating level for a position within a difficulty band. */
export function levelForDifficulty(difficulty, position, step = 3) {
  const d = DIFFICULTIES[difficulty] || DIFFICULTIES.medium;
  return Math.min(d.ceiling, d.level + Math.floor(position / step));
}

/** Applies the difficulty score multiplier. */
export function applyMultiplier(score, difficulty) {
  const d = DIFFICULTIES[difficulty] || DIFFICULTIES.medium;
  return Math.round(score * d.multiplier);
}