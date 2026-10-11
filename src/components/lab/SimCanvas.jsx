import { useEffect, useRef, useState } from 'react';

/**
 * Canvas with a requestAnimationFrame loop.
 * `step(sim, dt)` advances the simulation held in `simRef.current`.
 * `draw(ctx, width, height, sim)` paints one frame.
 */
export default function SimCanvas({ simRef, step, draw, className = '', children }) {
  const canvasRef = useRef(null);
  const anchorRef = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const stepRef = useRef(step);
  const drawRef = useRef(draw);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let last = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const loop = (now) => {
      if (!last) last = now;
      const dt = Math.min(1 / 20, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, width, height);
      if (stepRef.current) stepRef.current(simRef.current, dt);
      if (drawRef.current) drawRef.current(ctx, width, height, simRef.current);
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [simRef]);

  // When the simulation's natural spot scrolls out of view, minimize it into a
  // small floating window (like YouTube's minimized video) so it stays visible
  // while adjusting the controls — without overlapping the page as a sticky block.
  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => setMinimized(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(anchor);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={anchorRef} className="absolute inset-0" />
      <div
        className={
          minimized
            ? 'fixed bottom-20 right-3 z-40 h-24 w-36 overflow-hidden rounded-xl border border-border bg-card shadow-2xl ring-1 ring-black/5 sm:bottom-24 sm:right-4 sm:h-32 sm:w-52'
            : 'absolute inset-0 overflow-hidden rounded-2xl border border-border bg-secondary'
        }
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
        {children}
      </div>
    </div>
  );
}