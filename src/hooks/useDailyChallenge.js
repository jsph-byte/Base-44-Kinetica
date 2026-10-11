import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getDailyChallenge } from '@/lib/daily';

/** Whether the signed-in player has already completed today's daily challenge. */
export function useDailyChallenge() {
  const [state, setState] = useState({ loading: true, completed: false, bestScore: null });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const me = await base44.auth.me();
        const challenge = getDailyChallenge();
        const page = await base44.entities.GameResult.filter(
          {
            is_daily: true,
            challenge_date: challenge.date,
            game_key: challenge.game.key,
            created_by_id: me.id,
          },
          { sort: '-score', limit: 1 },
        );
        const items = page?.items || [];
        if (!active) return;
        setState({
          loading: false,
          completed: items.length > 0,
          bestScore: items[0]?.score ?? null,
        });
      } catch {
        if (!active) return;
        setState({ loading: false, completed: false, bestScore: null });
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return state;
}