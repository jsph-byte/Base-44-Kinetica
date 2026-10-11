import { lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Progress from '@/pages/Progress';
import Settings from '@/pages/Settings';

const ProjectileLab = lazy(() => import('@/pages/games/ProjectileLab'));
const PendulumLab = lazy(() => import('@/pages/games/PendulumLab'));
const CollisionLab = lazy(() => import('@/pages/games/CollisionLab'));
const OrbitLab = lazy(() => import('@/pages/games/OrbitLab'));
const MentalMath = lazy(() => import('@/pages/games/MentalMath'));
const SequenceDetective = lazy(() => import('@/pages/games/SequenceDetective'));
const EquationBalancer = lazy(() => import('@/pages/games/EquationBalancer'));
const EstimateIt = lazy(() => import('@/pages/games/EstimateIt'));
const GasLab = lazy(() => import('@/pages/games/GasLab'));
const BuoyancyLab = lazy(() => import('@/pages/games/BuoyancyLab'));
const ConductionLab = lazy(() => import('@/pages/games/ConductionLab'));
const CarnotLab = lazy(() => import('@/pages/games/CarnotLab'));
const BernoulliLab = lazy(() => import('@/pages/games/BernoulliLab'));
const Memory = lazy(() => import('@/pages/games/Memory'));
const Sudoku = lazy(() => import('@/pages/games/Sudoku'));
const Stroop = lazy(() => import('@/pages/games/Stroop'));
const Simon = lazy(() => import('@/pages/games/Simon'));
const PrimeHunter = lazy(() => import('@/pages/games/PrimeHunter'));
const OrderOfOps = lazy(() => import('@/pages/games/OrderOfOps'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/play/projectile" element={<ProjectileLab />} />
          <Route path="/play/pendulum" element={<PendulumLab />} />
          <Route path="/play/collision" element={<CollisionLab />} />
          <Route path="/play/orbit" element={<OrbitLab />} />
          <Route path="/play/mental-math" element={<MentalMath />} />
          <Route path="/play/sequences" element={<SequenceDetective />} />
          <Route path="/play/equations" element={<EquationBalancer />} />
          <Route path="/play/estimate" element={<EstimateIt />} />
          <Route path="/play/gas" element={<GasLab />} />
          <Route path="/play/buoyancy" element={<BuoyancyLab />} />
          <Route path="/play/conduction" element={<ConductionLab />} />
          <Route path="/play/carnot" element={<CarnotLab />} />
          <Route path="/play/bernoulli" element={<BernoulliLab />} />
          <Route path="/play/memory" element={<Memory />} />
          <Route path="/play/sudoku" element={<Sudoku />} />
          <Route path="/play/stroop" element={<Stroop />} />
          <Route path="/play/simon" element={<Simon />} />
          <Route path="/play/prime-hunter" element={<PrimeHunter />} />
          <Route path="/play/order-of-ops" element={<OrderOfOps />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App