import { render } from '@testing-library/react';
import { vi } from 'vitest';
import ShareModal from '../../../components/modals/ShareModal';

vi.mock('../../../store/useStore', () => ({
  useStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({
        onlineUsers: [],
        addToast: vi.fn(),
        reset: vi.fn(),
      });
    }
    return undefined;
  }),
}));

describe('ShareModal', () => {
  it('renders without crashing', () => {
    render(<ShareModal onClose={vi.fn()} designTitle="Test Design" onGetShareLink={vi.fn()} />);
  });
});
