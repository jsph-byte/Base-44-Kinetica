import { useEffect, useState } from 'react';

/** Mirrors primitive fields of a mutable simulation object into React state. */
export function useReadout(ref, interval = 110) {
  const [snapshot, setSnapshot] = useState(() => ({ ...(ref.current || {}) }));

  useEffect(() => {
    const id = window.setInterval(() => setSnapshot({ ...(ref.current || {}) }), interval);
    return () => window.clearInterval(id);
  }, [ref, interval]);

  return snapshot;
}