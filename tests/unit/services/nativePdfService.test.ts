import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportArtboardToNativePdf } from '../../../services/nativePdfService';
import { Artboard, TextLayer } from '../../../types';

const mockSetFont = vi.fn();

vi.mock('jspdf', () => {
  return {
    jsPDF: vi.fn().mockImplementation(() => {
      return {
        setFillColor: vi.fn(),
        rect: vi.fn(),
        output: vi.fn().mockReturnValue(new Blob()),
        setTextColor: vi.fn(),
        setFontSize: vi.fn(),
        setFont: mockSetFont,
        setCharSpace: vi.fn(),
        text: vi.fn(),
        addImage: vi.fn(),
        GState: vi.fn(),
        setGState: vi.fn(),
      };
    }),
  };
});

describe('nativePdfService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fall back to normal font style if setFont throws for text layer', async () => {
    // Arrange
    const textLayer: TextLayer = {
      id: 'text-1',
      type: 'text',
      x: 10,
      y: 10,
      width: 100,
      height: 50,
      text: 'Hello World',
      fontSize: 16,
      color: '#000000',
      fontWeight: '700', // This triggers fontStyle = 'bold'
      fontStyle: 'normal',
      fontFamily: 'Arial',
      textAlign: 'left',
    };

    const artboard: Artboard = {
      id: 'ab-1',
      type: 'artboard',
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      layers: [textLayer],
    };

    // Make setFont throw an error when called with bold
    mockSetFont.mockImplementation((font, style) => {
      if (style === 'bold') {
        throw new Error('Font style bold not available');
      }
    });

    // Act
    await exportArtboardToNativePdf(artboard, 'transparent');

    // Assert
    expect(mockSetFont).toHaveBeenCalledWith('helvetica', 'bold');
    // Fallback should be called
    expect(mockSetFont).toHaveBeenCalledWith('helvetica', 'normal');
  });
});
