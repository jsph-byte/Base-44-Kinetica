import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { CATEGORY_META } from '@/lib/games';

export default function GameCard({ game, best }) {
  const meta = CATEGORY_META[game.category];
  const Icon = game.icon;

  return (
    <Link
      to={game.path}
      className="group relative flex h-full flex-col select-none justify-between overflow-hidden rounded-2xl border border-border bg-card/60 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-card"
    >
      <span className={`absolute inset-x-0 top-0 h-px ${meta.fill} opacity-60`} />
      <div>
        <div className="flex items-start justify-between gap-4">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${meta.line} ${meta.soft} ${meta.ink}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          {best != null && (
            <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 font-mono text-xs text-muted-foreground">
              best {best}
            </span>
          )}
        </div>
        <h3 className="mt-4 font-heading text-lg tracking-tight">{game.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{game.blurb}</p>
      </div>

      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="text-xs leading-relaxed text-muted-foreground/90">{game.teaches}</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {game.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary/70 px-2 py-0.5 text-xs sm:text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
        </div>
      </div>
    </Link>
  );
}