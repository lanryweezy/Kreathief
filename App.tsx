import React, { useState, Suspense } from 'react';
import { ToastContainer } from './components/Toast';
import { useStore } from './store/useStore';

import { WelcomeModal } from './components/modals/WelcomeModal';
import { GuidedTour, TourStep } from './components/modals/GuidedTour';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { User, Project } from './types';
import { parseShareLink } from './utils/shareUtils';
import { STARTER_TEMPLATES } from './data/templates';

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
  // Views: 'landing' | 'auth' | 'dashboard' | 'editor'
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard' | 'editor'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);
  const { toasts, removeToast } = useStore();

  // Onboarding State
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTour, setActiveTour] = useState<'dashboard' | 'editor' | null>(null);

  // Check for onboarding and share links
  React.useEffect(() => {
    const initApp = async () => {
      const savedUser = localStorage.getItem('kreathief_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setView('dashboard');
      }

      // Check for share link
      if (window.location.search.includes('share=')) {
        const sharedProject = await parseShareLink(window.location.href);
        if (sharedProject) {
          setCurrentProject(sharedProject);
          if (savedUser) {
            setView('editor');
          } else {
            const guestUser: User = { id: 'guest', name: 'Guest', email: 'guest@kreathief.app', plan: 'free' };
            setUser(guestUser);
            setView('editor');
          }
          window.history.replaceState({}, '', window.location.pathname);
        }
      }

      const seenOnboarding = localStorage.getItem('kreathief_onboarding_seen');
      if (!seenOnboarding) {
        setShowWelcome(true);
      }
    };
    initApp();

    // Pre-fetch Template Assets with cleanup
    const images: HTMLImageElement[] = [];
    const prefetchTemplates = () => {
      STARTER_TEMPLATES.forEach((tmpl) => {
        tmpl.state.layers.forEach((layer) => {
          if (layer.type === 'image') {
            const img = new Image();
            img.src = (layer as any).src;
            images.push(img);
          }
        });
      });
    };
    prefetchTemplates();

    // Cleanup: Release memory from prefetched images
    return () => {
      images.forEach((img) => {
        img.src = '';
      });
    };
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
    localStorage.setItem('kreathief_user', JSON.stringify(user));
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('kreathief_user');
    setView('auth');
  };

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    setView('editor');
  };

  const handleCreateProject = () => {
    // Create new blank project logic is handled inside Editor init or by passing undefined
    setCurrentProject(undefined);
    setView('editor');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setCurrentProject(undefined);
  };

  const handleStartTour = () => {
    setShowWelcome(false);
    localStorage.setItem('kreathief_onboarding_seen', 'true');
    setActiveTour(view === 'editor' ? 'editor' : 'dashboard');
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

  return (
    <ErrorBoundary componentName="App Root" variant="full">
      <Suspense fallback={<LoadingFallback />}>
        {view === 'landing' && <LandingPage onGetStarted={() => setView('auth')} />}

        {view === 'auth' && <Auth onLogin={handleLogin} />}

        {view === 'dashboard' && user && (
          <Dashboard
            onOpenProject={handleOpenProject}
            onCreateProject={handleCreateProject}
            onLogout={handleLogout}
            user={user}
          />
        )}
        {view === 'dashboard' && user && showWelcome && (
          <WelcomeModal
            onClose={() => {
              setShowWelcome(false);
              localStorage.setItem('kreathief_onboarding_seen', 'true');
            }}
            onStartTour={handleStartTour}
          />
        )}
        {view === 'dashboard' && user && activeTour === 'dashboard' && (
          <GuidedTour
            steps={dashboardTourSteps}
            onComplete={() => setActiveTour(null)}
            onSkip={() => setActiveTour(null)}
          />
        )}

        {view === 'editor' && user && (
          <Editor initialProject={currentProject} onBack={handleBackToDashboard} user={user} />
        )}
        {view === 'editor' && user && activeTour === 'editor' && (
          <GuidedTour
            steps={editorTourSteps}
            onComplete={() => setActiveTour(null)}
            onSkip={() => setActiveTour(null)}
          />
        )}
      </Suspense>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ErrorBoundary>
  );
};

export default App;
