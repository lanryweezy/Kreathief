import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { FeatureLandingPage } from '../../components/pages/FeatureLandingPage';
import {
  EraserDemo,
  BgRemoveDemo,
  MockupDemo,
  VectorizerDemo,
  SmartResizeDemo,
  DesignStylesDemo,
} from '../../components/pages/featureDemos/FeatureDemos';

// Helper to render FeatureLandingPage with routing & helmet context
const renderFeaturePage = (slug: string) => {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/tools/${slug}`]}>
        <Routes>
          <Route path="/tools/:slug" element={<FeatureLandingPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('Creative Tool Landing Pages & Interactive Feature Demos', () => {
  describe('FeatureLandingPage routing and content', () => {
    it('renders Magic Eraser landing page with correct metadata and interactive elements', () => {
      renderFeaturePage('magic-eraser');
      expect(screen.getByText(/Erase unwanted objects from photos like magic/i)).toBeInTheDocument();
      expect(screen.getByText(/Start Erasing Free/i)).toBeInTheDocument();
      expect(screen.getByText(/Brush Mask/i)).toBeInTheDocument();
      expect(screen.getByText(/Auto-Erase/i)).toBeInTheDocument();
    });

    it('renders AI Background Remover landing page with edge isolation elements', () => {
      renderFeaturePage('background-remover');
      expect(screen.getByText(/Instant transparent backgrounds with sub-pixel edge precision/i)).toBeInTheDocument();
      expect(screen.getByText(/Cutout PNG/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero-Halo Matting/i)).toBeInTheDocument();
    });

    it('renders 3D Mockup Generator landing page', () => {
      renderFeaturePage('mockup-generator');
      expect(screen.getByText(/Hyper-realistic 3D product mockups with natural fabric physics/i)).toBeInTheDocument();
      expect(screen.getByText(/Heavyweight Tee/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage Your Design/i)).toBeInTheDocument();
    });

    it('renders Vectorizer landing page with bezier curves comparison', () => {
      renderFeaturePage('vectorizer');
      expect(screen.getByText(/Turn raster images and sketches into crisp, scalable SVGs/i)).toBeInTheDocument();
      expect(screen.getByText(/142 Bezier Points/i)).toBeInTheDocument();
      expect(screen.getByText(/Copy Clean SVG/i)).toBeInTheDocument();
    });

    it('renders Smart Resize landing page with responsive format switcher', () => {
      renderFeaturePage('smart-resize');
      expect(screen.getByText(/1 design adapted to every social media format in 1 click/i)).toBeInTheDocument();
      expect(screen.getByText(/Batch Auto-Resize/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Multi-Artboard Matrix/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders Design Styles landing page with 60+ movements presets', () => {
      renderFeaturePage('design-styles');
      expect(screen.getByText(/Explore 60\+ iconic graphic design styles and movements/i)).toBeInTheDocument();
      expect(screen.getByText(/Harmonized Palette/i)).toBeInTheDocument();
      expect(screen.getByText(/Use in Canvas/i)).toBeInTheDocument();
    });
  });

  describe('Isolated Interactive Demos', () => {
    it('EraserDemo supports scene switching and auto-erase simulation', () => {
      const mockLaunch = vi.fn();
      render(<EraserDemo onLaunchEditor={mockLaunch} />);

      const streetBtn = screen.getByText('Street Photobomb');
      fireEvent.click(streetBtn);
      expect(streetBtn).toHaveClass('bg-brand-600');

      const eraseBtn = screen.getByText('Auto-Erase');
      fireEvent.click(eraseBtn);
      expect(screen.getByText(/AI Inpainting/i)).toBeInTheDocument();
    });

    it('BgRemoveDemo toggles backdrops and edge zoom', () => {
      const mockLaunch = vi.fn();
      render(<BgRemoveDemo onLaunchEditor={mockLaunch} />);

      const whiteBgText = screen.getByText('Studio White');
      const whiteBgBtn = whiteBgText.closest('button')!;
      fireEvent.click(whiteBgBtn);
      expect(whiteBgBtn).toHaveClass('bg-brand-600');

      const zoomBtn = screen.getByText('Inspect Edge (2.5x)');
      fireEvent.click(zoomBtn);
      expect(screen.getByText('Exit 2.5x Zoom')).toBeInTheDocument();
    });

    it('MockupDemo switches products and garment colors', () => {
      const mockLaunch = vi.fn();
      render(<MockupDemo onLaunchEditor={mockLaunch} />);

      const hoodieBtn = screen.getByText('Streetwear Hoodie');
      fireEvent.click(hoodieBtn);
      expect(hoodieBtn).toHaveClass('bg-brand-600');

      const stageBtn = screen.getByText('Stage Your Design');
      fireEvent.click(stageBtn);
      expect(mockLaunch).toHaveBeenCalledWith('mockup');
    });

    it('VectorizerDemo toggles nodes and copies SVG', () => {
      const mockLaunch = vi.fn();
      render(<VectorizerDemo onLaunchEditor={mockLaunch} />);

      const copyBtn = screen.getByText('Copy Clean SVG');
      expect(copyBtn).toBeInTheDocument();

      const palette8Btn = screen.getByText('8 Colors');
      fireEvent.click(palette8Btn);
      expect(palette8Btn).toHaveClass('bg-brand-600');
    });

    it('SmartResizeDemo toggles between focused and matrix views', () => {
      const mockLaunch = vi.fn();
      render(<SmartResizeDemo onLaunchEditor={mockLaunch} />);

      const matrixBtn = screen.getByText('Multi-Artboard Matrix');
      fireEvent.click(matrixBtn);
      expect(screen.getByText('Focused View')).toBeInTheDocument();
    });

    it('DesignStylesDemo switches movements dynamically', () => {
      const mockLaunch = vi.fn();
      render(<DesignStylesDemo onLaunchEditor={mockLaunch} />);

      const memphisBtn = screen.getByText('Memphis');
      fireEvent.click(memphisBtn);
      expect(screen.getByText(/CHAOTIC POST-MODERN JOY/i)).toBeInTheDocument();
    });
  });
});
