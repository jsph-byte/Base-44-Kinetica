import { useMemo } from 'react';

/** Reads the app's design tokens so canvas drawing matches the theme. */
export function useThemeColors() {
  return useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    const token = (name) => styles.getPropertyValue(name).trim();
    const solid = (name) => `hsl(${token(name)})`;
    const soft = (name, alpha) => `hsl(${token(name)} / ${alpha})`;

    return {
      physics: solid('--physics'),
      maths: solid('--math'),
      physicsSoft: soft('--physics', 0.35),
      mathsSoft: soft('--math', 0.35),
      ink: solid('--foreground'),
      muted: soft('--muted-foreground', 0.85),
      faint: soft('--muted-foreground', 0.4),
      grid: soft('--border', 0.85),
      surface: solid('--card'),
    };
  }, []);
}