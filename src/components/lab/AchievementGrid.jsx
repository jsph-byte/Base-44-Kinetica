import { ACHIEVEMENTS } from '@/lib/achievements';

export default function AchievementGrid({ progress }) {
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.check(progress)).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold tracking-tight">Achievements</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {unlockedCount}/{ACHIEVEMENTS.length} unlocked
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const earned = a.check(progress);
          const Icon = a.icon;
          return (
            <div
              key={a.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                earned
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-card/40 opacity-65'
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  earned ? 'bg-primary/15 ink-physics' : 'bg-secondary/60 text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {a.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}