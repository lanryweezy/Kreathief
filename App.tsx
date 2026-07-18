import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation, useParams } from 'react-router-dom';
import { ToastContainer } from './components/Toast';
import { OnboardingTour } from './components/OnboardingTour';
import { useStore } from './store/useStore';
import { authService } from './services/authService';
import { storageService } from './services/storageService';
import { User, Project } from './types';
import { performanceService } from './services/performanceService';
import { log } from './utils/log';

import { WelcomeModal } from './components/modals/WelcomeModal';
import { GuidedTour, TourStep } from './components/modals/GuidedTour';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { BlogList } from './components/blog/BlogList';
import { BlogPostView } from './components/blog/BlogPostView';
import { SEO } from './components/SEO';
import { FeedbackModal } from './components/modals/FeedbackModal';
import { PresentationModal } from './components/modals/PresentationModal';
import { VersionDiffModal } from './components/modals/VersionDiffModal';
import {
  AboutPage,
  PrivacyPage,
  TermsPage,
  SecurityPage,
  ContactPage,
  HelpCenterPage,
  ChangelogPage,
  APIPage,
} from './components/pages/StaticPages';
import { parseShareLink } from './utils/shareUtils';

import { UserProfilePage } from './components/UserProfilePage';

function ProfileRoute() {
  const { userId } = useParams();
  const navigate = useNavigate();
  return <UserProfilePage userId={userId || ''} onBack={() => navigate(-1)} />;
}

// Lazy load main views for code splitting
const Auth = React.lazy(() => import('./components/Auth').then((module) => ({ default: module.Auth })));
const Dashboard = React.lazy(() => import('./components/Dashboard').then((module) => ({ default: module.Dashboard })));
const Editor = React.lazy(() => import('./components/Editor').then((module) => ({ default: module.Editor })));
const AuthCallback = React.lazy(() =>
  import('./components/AuthCallback').then((module) => ({ default: module.AuthCallback }))
);
const AudienceView = React.lazy(() => import('./components/AudienceView').then((module) => ({ default: module.AudienceView })));
import { EditorSkeleton } from './components/EditorSkeleton';

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#1f1f1f] flex-col gap-4">
    <div className="w-8 h-8 rounded-full border-4 border-[#7d2ae8] border-t-transparent animate-spin"></div>
    <div className="text-gray-400 font-medium animate-pulse">Loading Kreathief...</div>
  </div>
);

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const toasts = useStore((state) => state.toasts);
  const removeToast = useStore((state) => state.removeToast);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

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

        // Check Supabase auth session
        const savedUser = await authService.getSession();
        if (savedUser) {
          setUser(savedUser);
        }

        const seenOnboarding = localStorage.getItem('kreathief_onboarding_seen');
        if (!seenOnboarding) {
          setShowWelcome(true);
        }
      } catch (error) {
        log.error('App initialization failed', error);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };
    initApp();
  }, [setUser]); // Only run on mount (setUser is stable)

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = authService.onAuthChange((updatedUser) => {
      setUser(updatedUser);
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
              setUser({ id: 'guest', name: 'Guest', email: 'guest@kreathief.app', plan: 'free' });
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

  // Local-First: Background Persistence
  // Mirror state to IndexedDB every 2 seconds if changes detected
  useEffect(() => {
    if (!user) {
      return;
    }
    const state = useStore.getState();
    if (!state.projectId) {
      return;
    }

    const timeout = setTimeout(() => {
      const mirrorState = {
        artboards: state.artboards,
        canvasBackgroundColor: state.canvasBackgroundColor,
        canvasFilters: state.canvasFilters,
        canvasSize: state.canvasSize,
        brandKits: state.brandKits,
        showGrid: state.showGrid,
        showRulers: state.showRulers,
      };
      storageService.saveSessionMirror(state.projectId, mirrorState as any);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [location.pathname, user]);

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
    navigate('/editor');
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    navigate('/auth');
  };

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    navigate('/editor');
  };

  const handleCreateProject = () => {
    setCurrentProject(undefined);
    navigate('/editor');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
    setCurrentProject(undefined);
  };

  const handleStartTour = () => {
    setShowWelcome(false);
    localStorage.setItem('kreathief_onboarding_seen', 'true');
    setActiveTour(location.pathname === '/editor' ? 'editor' : 'dashboard');
  };

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) return;
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
        artboards: [{ id: 'default', name: 'Artboard 1', x: 0, y: 0, width: 1080, height: 1080, layers: [] }],
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
      <SEO />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage onGetStarted={handleGuestEntry} onTryGuest={handleGuestEntry} />} />
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
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:id" element={<BlogPostView />} />
          <Route path="/profile/:userId" element={<ProfileRoute />} />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/api" element={<APIPage />} />
        </Routes>

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
      <FeedbackModal />
      <PresentationModal />
      <VersionDiffModal />
    </ErrorBoundary>
  );
};

export default App;
