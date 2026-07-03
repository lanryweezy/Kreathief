import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AIGenerateModal } from '../../../components/modals/AIGenerateModal';
import { useNodeGraph } from '../../../hooks/useNodeGraph';

// Mock the hook
vi.mock('../../../hooks/useNodeGraph', () => ({
  useNodeGraph: vi.fn(),
}));

// Mock framer-motion to avoid animation delays in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: ({ children, className, onClick, ...props }: any) => (
        <div className={className} onClick={onClick} data-testid="motion-div">
          {children}
        </div>
      ),
    },
  };
});

describe('AIGenerateModal', () => {
  const mockExecuteGraph = vi.fn();
  const mockLoadPreset = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnGenerate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default hook return value
    (useNodeGraph as any).mockReturnValue({
      loadPreset: mockLoadPreset,
      executeGraph: mockExecuteGraph,
      nodeOutputs: {},
    });
  });

  it('displays a specific error message when AI generation fails due to a network error', async () => {
    // Make executeGraph reject with a simulated network error
    mockExecuteGraph.mockRejectedValue(new Error('fetch failed'));

    render(
      <AIGenerateModal isOpen={true} onClose={mockOnClose} onGenerate={mockOnGenerate} />
    );

    // Enter a prompt
    const textarea = screen.getByPlaceholderText('What do you want to create?');
    fireEvent.change(textarea, { target: { value: 'A cute cat' } });

    // Select the first preset
    const presetButtons = screen.getAllByRole('button');
    // Assuming the presets start at the 2nd button (after close)
    fireEvent.click(presetButtons[1]);

    // Click Generate
    const generateButton = screen.getByRole('button', { name: 'Generate' });
    fireEvent.click(generateButton);

    // Wait for the specific error message to appear
    await waitFor(() => {
      // getAIErrorMessage should return this string for network errors
      expect(screen.getByText('AI generation failed: Network error. Check your connection and try again.')).toBeInTheDocument();
    });
  });

  it('displays a specific error message when AI generation times out', async () => {
    // Make executeGraph reject with a simulated timeout error
    mockExecuteGraph.mockRejectedValue(new Error('Operation timed out'));

    render(
      <AIGenerateModal isOpen={true} onClose={mockOnClose} onGenerate={mockOnGenerate} />
    );

    // Enter a prompt
    const textarea = screen.getByPlaceholderText('What do you want to create?');
    fireEvent.change(textarea, { target: { value: 'A cute cat' } });

    // Select the first preset
    const presetButtons = screen.getAllByRole('button');
    fireEvent.click(presetButtons[1]);

    // Click Generate
    const generateButton = screen.getByRole('button', { name: 'Generate' });
    fireEvent.click(generateButton);

    // Wait for the specific error message to appear
    await waitFor(() => {
      // getAIErrorMessage should return this string for timeouts
      expect(screen.getByText('AI generation timed out. Try a simpler prompt or try again later.')).toBeInTheDocument();
    });
  });
});
