import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MediaPanel } from '../../components/panels/MediaPanel';

describe('MediaPanel Render Check', () => {
  it('renders without crashing', () => {
    const { container } = render(<MediaPanel />);
    expect(container).toBeTruthy();
  });
});
