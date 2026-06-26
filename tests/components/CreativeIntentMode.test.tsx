import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreativeIntentMode } from '../../components/CreativeIntentMode';

const mockSetIntent = vi.fn();
const mockSetCanvasSize = vi.fn();

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({
        setIntent: mockSetIntent,
        setCanvasSize: mockSetCanvasSize,
      });
    }
    return undefined;
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => <div {...filterMotionProps(props)} />,
    button: (props: any) => <button {...filterMotionProps(props)} />,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

function filterMotionProps(props: Record<string, any>) {
  const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
  return rest;
}

describe('CreativeIntentMode', () => {
  it('renders the heading', () => {
    render(<CreativeIntentMode onSelect={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText('What are you trying to create?')).toBeInTheDocument();
  });

  it('shows 10 intent cards', () => {
    render(<CreativeIntentMode onSelect={vi.fn()} onSkip={vi.fn()} />);
    const titles = [
      'Social Post', 'Flyer', 'Presentation', 'Brand Kit', 'Logo',
      'YouTube Thumbnail', 'Product Mockup', 'Website Hero', 'Business Card', 'Poster',
    ];
    titles.forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
  });

  it('clicking a card calls onSelect callback', () => {
    const onSelect = vi.fn();
    render(<CreativeIntentMode onSelect={onSelect} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByText('Social Post'));
    expect(onSelect).toHaveBeenCalled();
    expect(mockSetIntent).toHaveBeenCalledWith('social', 1080, 1080);
    expect(mockSetCanvasSize).toHaveBeenCalledWith({ width: 1080, height: 1080, name: 'Social Post' });
  });

  it('shows skip link at the bottom', () => {
    render(<CreativeIntentMode onSelect={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/Skip/)).toBeInTheDocument();
  });

  it('clicking skip calls onSkip callback', () => {
    const onSkip = vi.fn();
    render(<CreativeIntentMode onSelect={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByText(/Skip/));
    expect(onSkip).toHaveBeenCalled();
  });
});
