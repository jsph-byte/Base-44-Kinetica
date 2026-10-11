import { GAMES } from './games';

const challengeGames = () => GAMES.filter((g) => g.category === 'math' || g.category === 'brain');

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Deterministic daily challenge — every player gets the same game + difficulty
 * on a given date, cycling through all math and brain games.
 */
export function getDailyChallenge(date = new Date()) {
  const key = todayKey(date);
  const seed = key.split('-').reduce((acc, part) => acc + Number(part), 0);
  const games = challengeGames();
  const game = games[seed % games.length];
  const difficulties = ['easy', 'medium', 'hard'];
  const difficulty = difficulties[seed % difficulties.length];
  return { game, difficulty, date: key };
}