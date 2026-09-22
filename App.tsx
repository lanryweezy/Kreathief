import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer } from './components/Toast';
import { OnboardingTour } from './components/OnboardingTour';
import { useStore } from './store/useStore';
import { authService } from './services/authService';
import { storageService } from './services/storageService';
import { setFontToastCallback } from './services/FontLoader';
import { isSupabaseConfigured } from './lib/supabase/client';
import { User, Project } from './types';
import { performanceService } from './services/performanceService';
import { log } from './utils/log';

import { WelcomeModal } from './components/modals/WelcomeModal';
import { GuidedTour, TourStep } from './components/modals/GuidedTour';
import { ErrorBoundary } from './components/ErrorBoundary';
import { parseShareLink } from './utils/shareUtils';

// Lazy load all route-level and modal components for code splitting
const LandingPage = React.lazy(() => import('./components/LandingPage').then((m) => ({ default: m.LandingPage })));
const BlogList = React.lazy(() => import('./components/blog/BlogList').then((m) => ({ default: m.BlogList })));
const BlogPostView = React.lazy(() =>
  import('./components/blog/BlogPostView').then((m) => ({ default: m.BlogPostView }))
);
const FeedbackModal = React.lazy(() =>
  import('./components/modals/FeedbackModal').then((m) => ({ default: m.FeedbackModal }))
);
const ProfileModal = React.lazy(() =>
  import('./components/modals/ProfileModal').then((m) => ({ default: m.ProfileModal }))
);
const PresentationModal = React.lazy(() =>
  import('./components/modals/PresentationModal').then((m) => ({ default: m.PresentationModal }))
);
const VersionDiffModal = React.lazy(() =>
  import('./components/modals/VersionDiffModal').then((m) => ({ default: m.VersionDiffModal }))
);
const PricingModal = React.lazy(() =>
  import('./components/modals/PricingModal').then((m) => ({ default: m.PricingModal }))
);
const UserProfilePage = React.lazy(() =>
  import('./components/UserProfilePage').then((m) => ({ default: m.UserProfilePage }))
);
const AboutPage = React.lazy(() => import('./components/pages/StaticPages').then((m) => ({ default: m.AboutPage })));
const PrivacyPage = React.lazy(() =>
  import('./components/pages/StaticPages').then((m) => ({ default: m.PrivacyPage }))
);
const TermsPage = React.lazy(() => import('./components/pages/StaticPages').then((m) => ({ default: m.TermsPage })));
const SecurityPage = React.lazy(() =>
  import('./components/pages/StaticPages').then((m) => ({ default: m.SecurityPage }))
);
const ContactPage = React.lazy(() =>
  import('./components/pages/StaticPages').then((m) => ({ default: m.ContactPage }))
);
const HelpCenterPage = React.lazy(() =>
  import('./components/pages/StaticPages').then((m) => ({ default: m.HelpCenterPage }))
);
const ChangelogPage = React.lazy(() =>
  import('./components/pages/StaticPages').then((m) => ({ default: m.ChangelogPage }))
);
const APIPage = React.lazy(() => import('./components/pages/StaticPages').then((m) => ({ default: m.APIPage })));

function ProfileRoute() {
  const { userId } = useParams();
  const navigate = useNavigate();
  return <UserProfilePage userId={userId || ''} onBack={() => navigate(-1)} />;
}

// Lazy load main views for code splitting
const Auth = React.lazy(() => import('./components/Auth').then((module) => ({ default: module.Auth })));
const Dashboard = React.lazy(() =>
  import('./components/Dashboard').then((module) => ({
    default: module.Dashboard,
  }))
);
const Editor = React.lazy(() => import('./components/Editor').then((module) => ({ default: module.Editor })));
const AuthCallback = React.lazy(() =>
  import('./components/AuthCallback').then((module) => ({
    default: module.AuthCallback,
  }))
);
const AudienceView = React.lazy(() =>
  import('./components/AudienceView').then((module) => ({
    default: module.AudienceView,
  }))
);
import { EditorSkeleton } from './components/EditorSkeleton';
import { DashboardSkeleton } from './components/DashboardSkeleton';

const LoadingFallback = () => {
  const isDashboard = typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');
  const isEditor = typeof window !== 'undefined' && window.location.pathname.startsWith('/editor');

  if (isDashboard) {
    return <DashboardSkeleton />;
  }
  if (isEditor) {
    return <EditorSkeleton />;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface-dark-0 flex-col gap-6">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl border border-white/10 shadow-glow-brand flex items-center justify-center relative overflow-hidden bg-surface-dark-1">
          <img src="/logo.svg" alt="Kreathief" className="w-8 h-8 object-contain z-10" />
          <div className="absolute inset-0 bg-brand-500/20 animate-pulse-soft" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="text-white font-black uppercase tracking-widest text-sm animate-pulse-soft">
          Loading Kreathief...
        </div>
        <div className="w-48 h-1 bg-surface-dark-3 rounded-full overflow-hidden relative">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-600 to-accent rounded-full w-1/2 animate-[shimmer_1.5s_infinite_linear]"
            style={{ backgroundSize: '200% 100%' }}
          />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useStore((state) => state.user);

  useEffect(() => {
    // Expose store for E2E/dev tooling only — never in production
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      (window as any).__store = useStore;
      return () => {
        delete (window as any).__store;
      };
    }
    return undefined;
  }, []);

  const setUser = useStore((state) => state.setUser);
  const loadCredits = useStore((state) => state.loadCredits);
  const toasts = useStore((state) => state.toasts);
  const removeToast = useStore((state) => state.removeToast);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTour, setActiveTour] = useState<'dashboard' | 'editor' | null>(null);

  useEffect(() => {
    const initApp = async () => {
      // Safety timeout to ensure app always boots
      const safetyTimeout = setTimeout(() => {
        setLoading(false);
        log.warn('App initialization timed out, forcing mount');
      }, 5000);

      try {
        // Initialize performance and storage
        performanceService.init();
        await storageService.init();

        // Register toast callback for storage service
        storageService.setToastCallback((message, type) => {
          useStore.getState().addToast(message, type);
        });

        // Surface font-load failures to the user
        setFontToastCallback((message, type) => {
          useStore.getState().addToast(message, type);
        });

        // Warn developers when Supabase creds are missing (client falls back to a placeholder endpoint)
        if (import.meta.env.DEV && !isSupabaseConfigured) {
          useStore.getState().addToast('Supabase is not configured — cloud sync and auth are disabled.', 'warning');
        }

        // Check Supabase auth session
        const savedUser = await authService.getSession();
        if (savedUser) {
          setUser(savedUser);
          // Load credit balance from Supabase — guests use DEFAULT_FREE_CREDITS
          if (savedUser.id !== 'guest' && !(savedUser as any).isGuest) {
            loadCredits(savedUser.id);
          }
        }

        const seenOnboarding = localStorage.getItem('kreathief_onboarding_seen');
        if (!seenOnboarding) {
          setShowWelcome(true);
        }

        // Restore unsaved session mirror if landing on /editor
        if (window.location.pathname === '/editor') {
          const mirror = await storageService.getSessionMirror();
          if (mirror && mirror.state) {
            let projectName = (mirror as any).projectName;
            if (!projectName && mirror.projectId) {
              try {
                const projects = await storageService.getAllProjects();
                const existing = projects.find((p: any) => p.id === mirror.projectId);
                if (existing?.name) {
                  projectName = existing.name;
                }
              } catch {
                // Ignore storage lookup error
              }
            }
            const restoredProject: any = {
              id: mirror.projectId || 'default',
              name: projectName || 'Restored Session',
              updatedAt: Date.now(),
              state: mirror.state,
            };
            setCurrentProject(restoredProject);
            log.info('Restored project from session mirror');
          }
        }
      } catch (error) {
        log.error('App initialization failed', error);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };
    initApp();
  }, [setUser, loadCredits]); // Only run on mount (setUser and loadCredits are stable)

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = authService.onAuthChange((updatedUser) => {
      setUser(updatedUser);
      // Sync credits whenever auth state changes (login, token refresh)
      if (updatedUser && updatedUser.id !== 'guest' && !(updatedUser as any).isGuest) {
        loadCredits(updatedUser.id);
      }
      if (updatedUser && location.pathname === '/auth') {
        navigate('/dashboard');
      }
    });

    if (window.location.search.includes('share=')) {
      const handleShare = async () => {
        try {
          const sharedProject = await parseShareLink(window.location.href);
          if (sharedProject) {
            setCurrentProject(sharedProject);
            // Auto-login guest if needed
            if (!useStore.getState().user) {
              setUser({
                id: 'guest',
                name: 'Guest',
                email: 'guest@kreathief.app',
                plan: 'free',
                isGuest: true,
              });
            }
            navigate('/editor');
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (shareErr) {
          log.error('Failed to parse share link:', shareErr);
        }
      };
      handleShare();
    }

    return () => {
      unsubscribe();
    };
  }, [location.pathname, navigate, setUser]);

  // Local-First: Background Persistence
  useEffect(() => {
    // Redirect if already logged in and on landing/auth pages
    if (user && (location.pathname === '/' || location.pathname === '/auth')) {
      navigate('/dashboard');
    }
  }, [user, location.pathname, navigate]);

  // Note: session mirroring to IndexedDB is handled by historySlice.saveToHistory,
  // which persists the full HistoryState plus undo/redo stacks on every edit (debounced).

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
    navigate('/dashboard');
  };

  const handleGuestEntry = () => {
    const guestUser: User = {
      id: `guest_${crypto.randomUUID().slice(0, 7)}`,
      email: 'guest@kreathief.local',
      name: 'Guest Creator',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=guest`,
      plan: 'free',
      isGuest: true,
    };
    setUser(guestUser);
    localStorage.setItem('kreathief_guest_session', JSON.stringify(guestUser));
    navigate('/editor');
  };

  const handleLogout = async () => {
    localStorage.removeItem('kreathief_guest_session');
    await authService.signOut();
    setUser(null);
    navigate('/auth');
  };

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/editor');
      setTimeout(() => setIsTransitioning(false), 200);
    }, 400);
  };

  const handleCreateProject = () => {
    setCurrentProject(undefined);
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/editor');
      setTimeout(() => setIsTransitioning(false), 200);
    }, 400);
  };

  const handleBackToDashboard = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/dashboard');
      setCurrentProject(undefined);
      setTimeout(() => setIsTransitioning(false), 200);
    }, 400);
  };

  const handleStartTour = () => {
    setShowWelcome(false);
    localStorage.setItem('kreathief_onboarding_seen', 'true');
    setActiveTour(location.pathname === '/editor' ? 'editor' : 'dashboard');
  };

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) {
      return;
    }
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  const dashboardTourSteps: TourStep[] = [
    {
      target: '#create-btn',
      title: 'Start Fresh',
      content: 'Click here to start a blank canvas and let your creativity flow.',
      position: 'bottom',
    },
    {
      target: '#templates-grid',
      title: 'Quick Start',
      content: 'Or pick a template to get professional results in seconds.',
      position: 'top',
    },
  ];

  const editorTourSteps: TourStep[] = [
    {
      target: '#header-title',
      title: 'Your Workspace',
      content: 'Give your masterpiece a name here.',
      position: 'bottom',
    },
    {
      target: '#sidebar',
      title: 'Creative Tools',
      content: 'Access AI Magic, Text, Shapes, and Uploads from this sidebar.',
      position: 'right',
    },
    {
      target: '#canvas-container',
      title: 'The Canvas',
      content: 'This is where you create. Drag and drop elements, or use the brush to draw.',
      position: 'right',
    },
    {
      target: '#layers-panel-toggle',
      title: 'Layers & Organization',
      content: 'Manage your layers here. Lock, hide, or reorder elements.',
      position: 'left',
    },
    {
      target: '#export-btn',
      title: 'Export',
      content: 'Ready to share? Export your design in high quality PNG, JPG, or WEBP.',
      position: 'bottom',
    },
  ];

  const defaultProject = useMemo(() => {
    if (location.pathname !== '/editor' || useStore.getState().projectId) {
      return undefined;
    }
    return {
      id: 'default',
      name: 'Untitled',
      updatedAt: Date.now(),
      state: {
        artboards: [
          {
            id: 'default',
            name: 'Artboard 1',
            x: 0,
            y: 0,
            width: 1080,
            height: 1080,
            layers: [],
          },
        ],
        activeArtboardId: 'default',
        canvasBackgroundColor: '#ffffff',
        canvasFilters: {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          sepia: 0,
          grayscale: 0,
          blur: 0,
          opacity: 1,
          vignette: 0,
          hueRotate: 0,
        },
        canvasSize: { width: 1080, height: 1080, name: 'Square' },
      },
    } as any;
  }, [location.pathname]);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary componentName="App Root" variant="full">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <LandingPage onGetStarted={handleGuestEntry} onTryGuest={handleGuestEntry} />
              </Suspense>
            }
          />
          <Route path="/auth" element={<Auth onLogin={handleLogin} />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/dashboard"
            element={
              user ? (
                <Dashboard
                  onOpenProject={handleOpenProject}
                  onCreateProject={handleCreateProject}
                  onLogout={handleLogout}
                  user={user}
                />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/editor"
            element={
              user ? (
                <Suspense fallback={<EditorSkeleton />}>
                  <Editor
                    initialProject={currentProject || defaultProject}
                    onBack={handleBackToDashboard}
                    user={user}
                  />
                </Suspense>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/blog"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <BlogList />
              </Suspense>
            }
          />
          <Route
            path="/blog/:id"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <BlogPostView />
              </Suspense>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ProfileRoute />
              </Suspense>
            }
          />

          <Route
            path="/about"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AboutPage />
              </Suspense>
            }
          />
          <Route
            path="/privacy"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <PrivacyPage />
              </Suspense>
            }
          />
          <Route
            path="/terms"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <TermsPage />
              </Suspense>
            }
          />
          <Route
            path="/security"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SecurityPage />
              </Suspense>
            }
          />
          <Route
            path="/contact"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ContactPage />
              </Suspense>
            }
          />
          <Route
            path="/help"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <HelpCenterPage />
              </Suspense>
            }
          />
          <Route
            path="/changelog"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ChangelogPage />
              </Suspense>
            }
          />
          <Route
            path="/api"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <APIPage />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[9999] bg-surface-dark-0 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                className="w-12 h-12 rounded-xl border border-white/10 shadow-glow-brand flex items-center justify-center relative overflow-hidden bg-surface-dark-1"
              >
                <img src="/logo.svg" alt="Kreathief" className="w-8 h-8 object-contain z-10" />
                <div className="absolute inset-0 bg-brand-500/20 animate-pulse-soft" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {location.pathname === '/dashboard' && user && showWelcome && (
          <WelcomeModal
            isOpen={showWelcome}
            onClose={() => {
              setShowWelcome(false);
              localStorage.setItem('kreathief_onboarding_seen', 'true');
            }}
            onStartTour={handleStartTour}
          />
        )}
        {location.pathname === '/dashboard' && user && activeTour === 'dashboard' && (
          <GuidedTour
            steps={dashboardTourSteps}
            onComplete={() => setActiveTour(null)}
            onSkip={() => setActiveTour(null)}
          />
        )}
        {location.pathname === '/editor' && user && activeTour === 'editor' && (
          <GuidedTour
            steps={editorTourSteps}
            onComplete={() => setActiveTour(null)}
            onSkip={() => setActiveTour(null)}
          />
        )}
      </Suspense>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <OnboardingTour />
      <Suspense fallback={null}>
        <FeedbackModal />
        <ProfileModal />
        <PresentationModal />
        <VersionDiffModal />
        <PricingModal />
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
