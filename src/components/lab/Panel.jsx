export default function Panel({ title, subtitle, action, className = '', children }) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="font-heading text-sm font-semibold tracking-tight">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}