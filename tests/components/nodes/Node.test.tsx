import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Node } from '../../../components/nodes/Node';
import { useNodeGraph } from '../../../hooks/useNodeGraph';

// Mock useNodeGraph hook
vi.mock('../../../hooks/useNodeGraph', () => ({
  useNodeGraph: vi.fn(),
}));

describe('Node component with interactive settings', () => {
  const mockRemoveNode = vi.fn();
  const mockExecuteGraph = vi.fn();
  const mockOnMouseDown = vi.fn();
  const mockOnPortMouseDown = vi.fn();
  const mockOnPortMouseUp = vi.fn();
  const mockOnSettingsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useNodeGraph as any).mockImplementation((selector: any) => {
      const state = {
        removeNode: mockRemoveNode,
        nodeOutputs: {},
        executeGraph: mockExecuteGraph,
        isExecuting: false,
      };
      return selector(state);
    });
  });

  it('renders a text-prompt node with text inputs and responds to settings changes', () => {
    const node = {
      id: 'node-1',
      type: 'text-prompt',
      x: 100,
      y: 100,
      settings: { prompt: 'A medieval castle', negativePrompt: 'ugly, blurry' },
    };

    render(
      <Node
        node={node}
        isSelected={true}
        onMouseDown={mockOnMouseDown}
        onPortMouseDown={mockOnPortMouseDown}
        onPortMouseUp={mockOnPortMouseUp}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    // Verify prompt label and textarea render correctly
    expect(screen.getByText('Prompt')).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText('Describe what to generate...');
    expect(textarea).toHaveValue('A medieval castle');

    // Change value and verify callback
    fireEvent.change(textarea, { target: { value: 'A sci-fi spaceship' } });
    expect(mockOnSettingsChange).toHaveBeenCalledWith('prompt', 'A sci-fi spaceship');

    // Verify negative prompt renders and changes
    expect(screen.getByText('Negative Prompt')).toBeInTheDocument();
    const negInput = screen.getByPlaceholderText('Ugly, low quality, etc...');
    expect(negInput).toHaveValue('ugly, blurry');

    fireEvent.change(negInput, { target: { value: 'dark, noisy' } });
    expect(mockOnSettingsChange).toHaveBeenCalledWith('negativePrompt', 'dark, noisy');
  });

  it('renders an image-upload node with a dropzone and triggers file input', () => {
    const node = {
      id: 'node-2',
      type: 'image-upload',
      x: 150,
      y: 150,
      settings: { src: '' },
    };

    render(
      <Node
        node={node}
        isSelected={false}
        onMouseDown={mockOnMouseDown}
        onPortMouseDown={mockOnPortMouseDown}
        onPortMouseUp={mockOnPortMouseUp}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('Upload Image')).toBeInTheDocument();
    expect(screen.getByText('Click to upload image')).toBeInTheDocument();
  });

  it('renders an image preview and a clear button when image-upload contains a source', () => {
    const node = {
      id: 'node-2',
      type: 'image-upload',
      x: 150,
      y: 150,
      settings: { src: 'data:image/png;base64,mockdata' },
    };

    render(
      <Node
        node={node}
        isSelected={false}
        onMouseDown={mockOnMouseDown}
        onPortMouseDown={mockOnPortMouseDown}
        onPortMouseUp={mockOnPortMouseUp}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    const img = screen.getByAltText('Uploaded reference');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,mockdata');

    // Clear button
    const clearButton = screen.getByTitle('Clear Image');
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);
    expect(mockOnSettingsChange).toHaveBeenCalledWith('src', '');
  });

  it('renders style-reference strength slider', () => {
    const node = {
      id: 'node-3',
      type: 'style-reference',
      x: 150,
      y: 150,
      settings: { src: '', strength: 0.5 },
    };

    render(
      <Node
        node={node}
        isSelected={false}
        onMouseDown={mockOnMouseDown}
        onPortMouseDown={mockOnPortMouseDown}
        onPortMouseUp={mockOnPortMouseUp}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('0.5')).toBeInTheDocument();

    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('0.5');

    fireEvent.change(slider, { target: { value: '0.8' } });
    expect(mockOnSettingsChange).toHaveBeenCalledWith('strength', 0.8);
  });

  it('renders AI models with dimensions, and executes graph when clicking Generate Image', () => {
    const node = {
      id: 'node-ai',
      type: 'ai-flux',
      x: 200,
      y: 200,
      settings: { width: 1024, height: 1024, model: 'flux-schnell', steps: 20 },
    };

    render(
      <Node
        node={node}
        isSelected={false}
        onMouseDown={mockOnMouseDown}
        onPortMouseDown={mockOnPortMouseDown}
        onPortMouseUp={mockOnPortMouseUp}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    expect(screen.getByText('Dimensions')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Steps')).toBeInTheDocument();

    const generateBtn = screen.getByRole('button', { name: 'Generate Image' });
    expect(generateBtn).toBeInTheDocument();

    fireEvent.click(generateBtn);
    expect(mockExecuteGraph).toHaveBeenCalled();
  });
});
