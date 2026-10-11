import { useCallback, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useProgress } from '@/hooks/useProgress';
import { queueResult, isOnline } from '@/lib/offline';

/** Records a finished run in the player's progress. `state` is idle | saving | saved | error. */
export function useGameSave() {
  const [state, setState] = useState('idle');
  const lastToken = useRef(null);
  const { addResult } = useProgress();

  const reset = useCallback(() => {
    lastToken.current = null;
    setState('idle');
  }, []);

  const save = useCallback(
    async (game, { score, summary = '', playToken, isDaily, challengeDate } = {}) => {
      const token = playToken || `${Date.now()}`;
      if (lastToken.current === token) return;
      lastToken.current = token;
      setState('saved');
      const payload = {
        game_key: game.key,
        game_title: game.title,
        category: game.category,
        score: Math.round(score),
        summary,
      };
      if (isDaily && challengeDate) {
        payload.is_daily = true;
        payload.challenge_date = challengeDate;
      }
      addResult(payload);
      try {
        await base44.entities.GameResult.create(payload);
      } catch (error) {
        if (!isOnline()) {
          queueResult(payload);
        } else {
          setState('error');
        }
      }
    },
    [addResult],
  );

  return { save, state, reset };
}