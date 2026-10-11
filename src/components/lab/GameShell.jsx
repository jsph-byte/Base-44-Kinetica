import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CATEGORY_META } from '@/lib/games';

export default function GameShell({ game, children }) {
  const meta = CATEGORY_META[game.category];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All experiments
      </Link>

      <header className="mt-6">
        <span className={`eyebrow ${meta.ink}`}>{meta.label}</span>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">{game.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{game.blurb}</p>
      </header>

      <div className="mt-8">{children}</div>
    </div>
  );
}