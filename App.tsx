import React, { useState, Suspense } from 'react';
import { PricingModal } from './components/PricingModal';
import { WelcomeModal } from './components/modals/WelcomeModal';
import { GuidedTour, TourStep } from './components/modals/GuidedTour';
import { ErrorBoundary } from './components/ErrorBoundary';
import { User, Project } from './types';
import { parseShareLink } from './utils/shareUtils';
import { STARTER_TEMPLATES } from './data/templates';

// Lazy load main views for code splitting
const Auth = React.lazy(() => import('./components/Auth').then(module => ({ default: module.Auth })));
const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Editor = React.lazy(() => import('./components/Editor').then(module => ({ default: module.Editor })));

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#1f1f1f] flex-col gap-4">
    <div className="w-8 h-8 rounded-full border-4 border-[#7d2ae8] border-t-transparent animate-spin"></div>
    <div className="text-gray-400 font-medium animate-pulse">Loading Kreathief...</div>
  </div>
);

const App: React.FC = () => {
  // Views: 'auth' | 'dashboard' | 'editor'
  const [view, setView] = useState<'auth' | 'dashboard' | 'editor'>('auth');
  const [user, setUser] = useState<User | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);
  const [showPricing, setShowPricing] = useState(false);

  // Onboarding State
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTour, setActiveTour] = useState<'dashboard' | 'editor' | null>(null);

  // Check for existing session AND share link
  React.useEffect(() => {
    const initApp = async () => {
      const savedUser = localStorage.getItem('kreathief_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setView('dashboard');
      }

      // Check for share link
      if (window.location.search.includes('share=')) {
        console.log("Found share link, parsing...");
        const sharedProject = await parseShareLink(window.location.href);
        if (sharedProject) {
          console.log("Project loaded from share link:", sharedProject);
          setCurrentProject(sharedProject);
          // If user not logged in, maybe show a guest mode or force auth? 
          // For now, let's allow viewing if we have a user, or force auth if not.
          // If no user, we might want to set a "pendingProject" state to open after login.
          if (savedUser) {
            setView('editor');
          } else {
            // Determine what to do for non-logged in users. 
            // Let's set it as currentProject and go to auth, maybe Auth can handle redirect?
            // Simplest: Just set view to 'editor' but Editor requires user.
            // Let's auto-create a temporary guest user if none exists?
            // OR just redirect to Auth and hope currentProject persists (it acts as state).
            // Actually, currentProject is state, so if we switch to 'auth', we keep it.
            // But Auth doesn't know to switch back.

            // Hack: Create guest user
            const guestUser: User = { id: 'guest', name: 'Guest', email: 'guest@kreathief.app', plan: 'free' };
            setUser(guestUser);
            setView('editor');
          }
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        }
      }

      // Check for onboarding
      const seenOnboarding = localStorage.getItem('kreathief_onboarding_seen');
      if (!seenOnboarding) {
        setShowWelcome(true);
      }
    };
    initApp();

    // Pre-fetch Template Assets
    const prefetchTemplates = () => {
      STARTER_TEMPLATES.forEach(tmpl => {
        // Pre-fetch image layers
        tmpl.state.imageLayers.forEach(layer => {
          const img = new Image();
          img.src = layer.src;
        });
      });
    };
    prefetchTemplates();
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

  const handleUpgrade = () => {
    if (user) {
      const upgraded = { ...user, plan: 'pro' as const };
      setUser(upgraded);
      localStorage.setItem('kreathief_user', JSON.stringify(upgraded));
      alert("Successfully upgraded to Pro!");
      setShowPricing(false);
    }
  };

  const handleStartTour = () => {
    setShowWelcome(false);
    localStorage.setItem('kreathief_onboarding_seen', 'true');
    setActiveTour(view === 'editor' ? 'editor' : 'dashboard');
  };

  const dashboardTourSteps: TourStep[] = [
    { target: '#create-btn', title: 'Start Fresh', content: 'Click here to start a blank canvas and let your creativity flow.', position: 'bottom' },
    { target: '#templates-grid', title: 'Quick Start', content: 'Or pick a template to get professional results in seconds.', position: 'top' }
  ];

  const editorTourSteps: TourStep[] = [
    { target: '#header-title', title: 'Your Workspace', content: 'Give your masterpiece a name here.', position: 'bottom' },
    { target: '#sidebar', title: 'Creative Tools', content: 'Access AI Magic, Text, Shapes, and Uploads from this sidebar.', position: 'right' },
    { target: '#canvas-container', title: 'The Canvas', content: 'This is where you create. Drag and drop elements, or use the brush to draw.', position: 'right' },
    { target: '#layers-panel-toggle', title: 'Layers & Organization', content: 'Manage your layers here. Lock, hide, or reorder elements.', position: 'left' },
    { target: '#export-btn', title: 'Export', content: 'Ready to share? Export your design in high quality PNG, JPG, or WEBP.', position: 'bottom' }
  ];

  return (
    <ErrorBoundary componentName="App Root" variant="full">
      <Suspense fallback={<LoadingFallback />}>
        {view === 'auth' && <Auth onLogin={handleLogin} />}

        {view === 'dashboard' && user && (
          <Dashboard
            onOpenProject={handleOpenProject}
            onCreateProject={handleCreateProject}
            onLogout={handleLogout}
            user={user}
            onOpenPricing={() => setShowPricing(true)}
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
        {showPricing && (
          <PricingModal
            onClose={() => setShowPricing(false)}
            onUpgrade={handleUpgrade}
          />
        )}

        {view === 'editor' && user && (
          <Editor
            initialProject={currentProject}
            onBack={handleBackToDashboard}
            user={user}
            onOpenPricing={() => setShowPricing(true)}
            onRestartTour={handleStartTour}
          />
        )}
        {view === 'editor' && user && activeTour === 'editor' && (
          <GuidedTour
            steps={editorTourSteps}
            onComplete={() => setActiveTour(null)}
            onSkip={() => setActiveTour(null)}
          />
        )}
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
