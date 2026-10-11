import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getLocalProgress, setLocalProgress, flushQueue, isOnline } from '@/lib/offline';

const EMPTY = { loading: true, best: {}, counts: {}, plays: 0, dailyCount: 0, recent: [] };

const ProgressContext = createContext({
  ...EMPTY,
  loading: false,
  refresh: () => {},
  addResult: () => {},
});

/** The signed-in player's best score per game, run counts and recent sessions, shared app-wide. */
export function ProgressProvider({ children }) {
  const [data, setData] = useState(EMPTY);

  const load = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      const [grouped, page, dailyAgg] = await Promise.all([
        base44.entities.GameResult.aggregate({
          query: { created_by_id: me.id },
          groupBy: 'game_key',
          max: 'score',
        }),
        base44.entities.GameResult.filter(
          { created_by_id: me.id },
          { sort: '-created_date', limit: 12 },
        ),
        base44.entities.GameResult.aggregate({
          query: { created_by_id: me.id, is_daily: true },
          countDistinct: 'challenge_date',
        }),
      ]);

      const best = {};
      const counts = {};
      let plays = 0;
      (grouped?.rows || []).forEach((row) => {
        best[row.game_key] = row.max_score ?? row.max ?? null;
        counts[row.game_key] = row.count ?? 0;
        plays += row.count ?? 0;
      });

      const dailyCount = dailyAgg?.rows?.[0]?.countDistinct_challenge_date ?? 0;
      const next = { loading: false, best, counts, plays, dailyCount, recent: page?.items || [] };
      setData(next);
      setLocalProgress(next);
    } catch (error) {
      const local = getLocalProgress();
      setData(local ? { ...local, loading: false } : { ...EMPTY, loading: false });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Flush queued saves when the connection comes back, then reload.
  useEffect(() => {
    const handleOnline = () => {
      flushQueue((payload) => base44.entities.GameResult.create(payload)).then(({ flushed }) => {
        if (flushed > 0) load();
      });
    };
    window.addEventListener('online', handleOnline);
    handleOnline();
    return () => window.removeEventListener('online', handleOnline);
  }, [load]);

  /** Optimistically fold a just-finished run into the cached best/count/recent data. */
  const addResult = useCallback((result) => {
    setData((prev) => {
      const best = { ...prev.best };
      const counts = { ...prev.counts };
      const key = result.game_key;
      if (result.score != null && (best[key] == null || result.score > best[key])) {
        best[key] = result.score;
      }
      counts[key] = (counts[key] || 0) + 1;
      const recent = [
        {
          ...result,
          id: result.id || `opt-${Date.now()}`,
          created_date: result.created_date || new Date().toISOString(),
        },
        ...prev.recent,
      ].slice(0, 12);
      const next = { ...prev, loading: false, best, counts, plays: prev.plays + 1, recent };
      setLocalProgress(next);
      return next;
    });
  }, []);

  return (
    <ProgressContext.Provider value={{ ...data, refresh: load, addResult }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  return useContext(ProgressContext);
}