import { useCallback, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Atom, Gamepad2, LineChart, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressProvider } from '@/hooks/useProgress';

const TAB_ROOTS = { play: '/', progress: '/progress', settings: '/settings' };

const tabForPath = (p) => {
  if (p === '/' || p.startsWith('/play/')) return 'play';
  if (p.startsWith('/progress')) return 'progress';
  if (p.startsWith('/settings')) return 'settings';
  return 'play';
};

const tabClass = (active) =>
  `flex min-h-12 flex-1 select-none flex-col items-center justify-center gap-1 py-2.5 text-xs transition ${
    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
  }`;

const TABS = [
  { key: 'play', to: '/', label: 'Play', icon: Gamepad2 },
  { key: 'progress', to: '/progress', label: 'Progress', icon: LineChart },
  { key: 'settings', to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabMemory = useRef({ ...TAB_ROOTS });
  const navigatedRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    const tab = tabForPath(location.pathname);
    tabMemory.current[tab] = location.pathname;
    if (mountedRef.current) navigatedRef.current = true;
    mountedRef.current = true;
  }, [location.pathname]);

  const handleTabClick = useCallback(
    (tab, e) => {
      e.preventDefault();
      const current = tabForPath(location.pathname);
      if (tab === current) {
        if (location.pathname !== TAB_ROOTS[tab]) navigate(TAB_ROOTS[tab]);
      } else {
        navigate(tabMemory.current[tab] || TAB_ROOTS[tab]);
      }
    },
    [location.pathname, navigate],
  );

  const handleBack = useCallback(() => {
    if (navigatedRef.current) navigate(-1);
    else navigate('/');
  }, [navigate]);

  const isChildGame = location.pathname.startsWith('/play/');
  const activeTab = tabForPath(location.pathname);

  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_-8%,hsl(var(--physics)/0.16),transparent_42%),radial-gradient(circle_at_88%_4%,hsl(var(--math)/0.14),transparent_45%)]"
      />
      <header className="safe-top safe-x sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center px-5 py-3.5 sm:px-8">
          {isChildGame ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex select-none items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              All experiments
            </button>
          ) : (
            <Link to="/" className="flex select-none items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <Atom className="h-4 w-4" />
              </span>
              <span className="font-display text-lg leading-none tracking-tight">Kinetica</span>
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        <ProgressProvider>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </ProgressProvider>
      </main>

      <footer className="border-t border-border/60 py-8 pb-24">
        <p className="mx-auto max-w-6xl px-5 text-xs text-muted-foreground sm:px-8">
          Kinetica — every slider is a question worth asking.
        </p>
      </footer>

      <nav className="safe-bottom safe-x fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-stretch px-2 sm:px-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.key}
                to={tab.to}
                onClick={(e) => handleTabClick(tab.key, e)}
                className={tabClass(activeTab === tab.key)}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}