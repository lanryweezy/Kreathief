import { render } from '@testing-library/react';
import { vi } from 'vitest';
import ColorPicker from '../../components/ColorPicker';

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({
        addToast: vi.fn(),
        reset: vi.fn(),
      });
    }
    return undefined;
  }),
}));

describe('ColorPicker', () => {
  it('renders without crashing', () => {
    render(
      <ColorPicker
        value="#ff0000"
        onChange={vi.fn()}
      />
    );
  });
});
