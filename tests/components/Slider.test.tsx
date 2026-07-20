import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Slider } from '../../components/Slider';
import React from 'react';

describe('Slider', () => {
  it('renders a slider and respects ariaLabel', () => {
    const handleChange = vi.fn();
    render(<Slider value={50} onChange={handleChange} ariaLabel="Test Slider" />);
    
    const sliderInput = screen.getByLabelText('Test Slider');
    expect(sliderInput).toBeInTheDocument();
    
    fireEvent.change(sliderInput, { target: { value: '75' } });
    expect(handleChange).toHaveBeenCalledWith(75);
  });
  
  it('uses label as fallback for ariaLabel', () => {
    const handleChange = vi.fn();
    render(<Slider value={50} onChange={handleChange} label="Fallback Label" />);
    
    const sliderInput = screen.getByLabelText('Fallback Label');
    expect(sliderInput).toBeInTheDocument();
  });
});
