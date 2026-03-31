import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from './components/Toast';
import { useStore } from './store/useStore';
import { authService } from './services/authService';
import { storageService } from './services/storageService';
import { User, Project } from './types';
import { performanceService } from './services/performanceService';

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
import { AboutPage, PrivacyPage, TermsPage, SecurityPage, ContactPage, HelpCenterPage, ChangelogPage, APIPage } from './components/pages/StaticPages';

// Lazy load main views for code splitting
const Auth = React.lazy(() => import('./components/Auth').then((module) => ({ default: module.Auth })));
const Dashboard = React.lazy(() => import('./components/Dashboard').then((module) => ({ default: module.Dashboard })));
const Editor = React.lazy(() => import('./components/Editor').then((module) => ({ default: module.Editor })));

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#1f1f1f] flex-col gap-4">
    <div className="w-8 h-8 rounded-full border-4 border-[#7d2ae8] border-t-transparent animate-spin"></div>
    <div className="text-gray-400 font-medium animate-pulse">Loading Kreathief...</div>
  </div>
);

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { toasts, removeToast } = useStore();

  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTour, setActiveTour] = useState<'dashboard' | 'editor' | null>(null);

  useEffect(() => {
    const initApp = async () => {
      // Initialize performance and storage
      performanceService.init();
      await storageService.init();

      // Check Supabase auth session
      const savedUser = await authService.getSession();
      if (savedUser) {
        setUser(savedUser);
        if (location.pathname === '/' || location.pathname === '/auth') {
          navigate('/dashboard');
        }
      }

      // Handle share links
      if (window.location.search.includes('share=')) {
        const { parseShareLink } = await import('./utils/shareUtils');
        const sharedProject = await parseShareLink(window.location.href);
        if (sharedProject) {
          setCurrentProject(sharedProject);
          if (!savedUser) {
            setUser({ id: 'guest', name: 'Guest', email: 'guest@kreathief.app', plan: 'free' });
          }
          navigate('/editor');
          window.history.replaceState({}, '', window.location.pathname);
        }
      }

      const seenOnboarding = localStorage.getItem('kreathief_onboarding_seen');
      if (!seenOnboarding) {
        setShowWelcome(true);
      }

      setLoading(false);
    };
    initApp();

    // Listen for auth state changes
    const unsubscribe = authService.onAuthChange((updatedUser) => {
      setUser(updatedUser);
      if (updatedUser && location.pathname === '/auth') {
        navigate('/dashboard');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
    navigate('/dashboard');
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

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary componentName="App Root" variant="full">
      <SEO />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage onGetStarted={() => navigate('/auth')} />} />
          <Route path="/auth" element={<Auth onLogin={handleLogin} />} />
          <Route
            path="/dashboard"
            element={user ? (
              <Dashboard
                onOpenProject={handleOpenProject}
                onCreateProject={handleCreateProject}
                onLogout={handleLogout}
                user={user}
              />
            ) : <Navigate to="/auth" />}
          />
          <Route
            path="/editor"
            element={user ? (
              <Editor initialProject={currentProject} onBack={handleBackToDashboard} user={user} />
            ) : <Navigate to="/auth" />}
          />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:id" element={<BlogPostView />} />
          
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
      <FeedbackModal />
      <PresentationModal />
      <VersionDiffModal />
    </ErrorBoundary>
  );
};

export default App;
