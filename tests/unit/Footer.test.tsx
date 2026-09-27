import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from '../../components/landing/BlogAndFooter';

describe('World-Class 5-Column Footer Component', () => {
  it('renders all 5 verified columns and core navigation links', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // 1. Column headers
    expect(screen.getByText('AI Creative Tools')).toBeInTheDocument();
    expect(screen.getByText('Design Studio')).toBeInTheDocument();
    expect(screen.getByText('Use Cases')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Company & Legal')).toBeInTheDocument();

    // 2. Verified AI Tools links
    expect(screen.getByText('Magic Object Eraser')).toBeInTheDocument();
    expect(screen.getByText('AI Background Remover')).toBeInTheDocument();
    expect(screen.getByText('Image to SVG Vectorizer')).toBeInTheDocument();
    expect(screen.getByText('AI Image Upscaler')).toBeInTheDocument();
    expect(screen.getByText(/All 9 Free AI Tools/i)).toBeInTheDocument();

    // 3. Design Studio links
    expect(screen.getByText('3D Mockup Generator')).toBeInTheDocument();
    expect(screen.getByText('Smart Format Auto-Resize')).toBeInTheDocument();
    expect(screen.getByText('60+ Aesthetic Movements')).toBeInTheDocument();

    // 4. Status badge and company metadata
    expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
    expect(screen.getByText(/Kreathief Inc\. All rights reserved/i)).toBeInTheDocument();
  });
});
