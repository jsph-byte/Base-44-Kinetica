import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const THRESHOLD = 70;

/** Touch-based pull-to-refresh for the home and progress screens. No-op on desktop. */
export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);

  const onTouchStart = (e) => {
    if (refreshing || window.scrollY > 0) return;
    active.current = true;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    if (!active.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, 100));
  };

  const onTouchEnd = async () => {
    if (!active.current) return;
    active.current = false;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const show = pull > 0 || refreshing;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: `translateY(${pull}px)`,
        transition: active.current ? 'none' : 'transform 0.2s ease',
      }}
    >
      {show && (
        <div
          className="flex items-center justify-center"
          style={{ height: refreshing ? THRESHOLD : Math.max(pull, 0) }}
        >
          <Loader2 className={`h-6 w-6 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      )}
      {children}
    </div>
  );
}