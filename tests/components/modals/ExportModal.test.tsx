import { render } from '@testing-library/react';
import { vi } from 'vitest';
import ExportModal from '../../../components/modals/ExportModal';

vi.mock('../../../store/useStore', () => ({
  useStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({
        addToast: vi.fn(),
        artboards: [],
        activeArtboardId: null,
        selectedLayerIds: [],
        projectTitle: 'Test Project',
        user: null,
        reset: vi.fn(),
      });
    }
    return undefined;
  }),
}));

describe('ExportModal', () => {
  it('renders without crashing', () => {
    render(
      <ExportModal
        onClose={vi.fn()}
        onExport={vi.fn()}
        currentSize={{ width: 800, height: 600, name: 'Canvas' }}
      />
    );
  });
});
