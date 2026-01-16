
import React, { useState } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { PricingModal } from './components/PricingModal';
import { WelcomeModal } from './components/modals/WelcomeModal';
import { GuidedTour, TourStep } from './components/modals/GuidedTour';
import { User, Project } from './types';

const App: React.FC = () => {
  // Views: 'auth' | 'dashboard' | 'editor'
  const [view, setView] = useState<'auth' | 'dashboard' | 'editor'>('auth');
  const [user, setUser] = useState<User | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);
  const [showPricing, setShowPricing] = useState(false);

  // Onboarding State
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTour, setActiveTour] = useState<'dashboard' | 'editor' | null>(null);

  // Check for existing session
  React.useEffect(() => {
    const savedUser = localStorage.getItem('kreathief_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setView('dashboard');
    }

    // Check for onboarding
    const seenOnboarding = localStorage.getItem('kreathief_onboarding_seen');
    if (!seenOnboarding) {
      setShowWelcome(true);
    }
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
    { target: '#sidebar', title: 'Tools of the Trade', content: 'Everything you need is right here: AI tools, shapes, text, and more.', position: 'right' },
    { target: '#canvas-container', title: 'The Stage', content: 'This is where your design comes to life. Drag, drop, and edit anything.', position: 'bottom' },
    { target: '#export-btn', title: 'Ship It!', content: 'When you\'re ready, export your design in high quality.', position: 'bottom' }
  ];

  if (view === 'auth') {
    return <Auth onLogin={handleLogin} />;
  }

  if (view === 'dashboard' && user) {
    return (
      <>
        <Dashboard
          user={user}
          onOpenProject={handleOpenProject}
          onCreateProject={handleCreateProject}
          onLogout={handleLogout}
          onOpenPricing={() => setShowPricing(true)}
        />
        {showWelcome && (
          <WelcomeModal
            onClose={() => setShowWelcome(false)}
            onStartTour={handleStartTour}
          />
        )}
        {activeTour === 'dashboard' && (
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
      </>
    );
  }

  if (view === 'editor' && user) {
    return (
      <>
        <Editor
          initialProject={currentProject}
          onBack={handleBackToDashboard}
          user={user}
          onOpenPricing={() => setShowPricing(true)}
        />
        {activeTour === 'editor' && (
          <GuidedTour
            steps={editorTourSteps}
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
      </>
    );
  }

  return <div>Loading...</div>;
};

export default App;
