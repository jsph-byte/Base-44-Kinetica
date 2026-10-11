import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { DIFFICULTIES } from '@/lib/difficulty';

/** Reads daily-challenge params (?daily=1&difficulty=hard) from the current URL. */
export function useDailyMode() {
  const location = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    const isDaily = params.get('daily') === '1';
    const raw = params.get('difficulty');
    const difficulty = raw && DIFFICULTIES[raw] ? raw : null;
    return { isDaily, difficulty };
  }, [location.search]);
}