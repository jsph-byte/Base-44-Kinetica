import { useEffect, useRef, useState } from 'react';

/**
 * Counts down `seconds` while `running` is true, then calls `onEnd`.
 * Changing `resetKey` restarts the countdown from the top.
 */
export function useCountdown(seconds, running, onEnd, resetKey) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);

  useEffect(() => {
    endRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (!running) return undefined;
    setLeft(seconds);
    const started = Date.now();
    const id = window.setInterval(() => {
      const remaining = seconds - (Date.now() - started) / 1000;
      if (remaining <= 0) {
        window.clearInterval(id);
        setLeft(0);
        if (endRef.current) endRef.current();
      } else {
        setLeft(remaining);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [seconds, running, resetKey]);

  return left;
}