import { render } from '@testing-library/react';
import { vi } from 'vitest';
import Dashboard from '../../components/Dashboard';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({
        projects: [],
        loadAllProjects: vi.fn(),
        deleteProject: vi.fn(),
        duplicateProject: vi.fn(),
        updateProject: vi.fn(),
        createProject: vi.fn(),
        loadProject: vi.fn(),
        favoriteProjects: [],
        toggleFavoriteProject: vi.fn(),
        shareToCommunity: vi.fn(),
        addToast: vi.fn(),
        reset: vi.fn(),
      });
    }
    return undefined;
  }),
}));

describe('Dashboard', () => {
  it('renders without crashing', () => {
    render(
      <Dashboard
        user={{ id: 'user-1', email: 'test@test.com', name: 'Test User' } as any}
        onOpenProject={vi.fn()}
        onCreateProject={vi.fn()}
        onLogout={vi.fn()}
      />
    );
  });
});
