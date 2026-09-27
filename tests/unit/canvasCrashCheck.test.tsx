import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { Canvas } from '../../components/Canvas';
import { useStore } from '../../store/useStore';

describe('Canvas crash check', () => {
  it('renders Canvas without throwing an exception', () => {
    useStore.setState({
      artboards: [
        {
          id: 'default',
          name: 'Artboard 1',
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
          layers: [],
        },
      ],
      activeArtboardId: 'default',
      showGrid: true,
      showRulers: true,
      guides: [],
    });

    expect(() => {
      render(
        <Canvas
          zoom={1}
          onZoomChange={() => {}}
          onFileUpload={() => {}}
          onDoubleClickLayer={() => {}}
          onAddLogoToCanvas={() => {}}
          onUpdatePath={() => {}}
        />
      );
    }).not.toThrow();
  });
});
