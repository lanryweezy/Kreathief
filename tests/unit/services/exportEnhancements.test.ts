import { describe, it, expect } from 'vitest';
import { exportToSVG } from '../../../services/exportService';

describe('Export Enhancements (Font embedding & Color tint)', () => {
  it('embeds Google Fonts @import inside <defs><style> for custom font families', async () => {
    const layers = [
      {
        id: 'text-1',
        type: 'text',
        x: 50,
        y: 50,
        width: 200,
        height: 60,
        text: 'Antigravity Creative',
        fontFamily: 'Inter',
        fontSize: 32,
        fill: '#ffffff',
      },
      {
        id: 'text-2',
        type: 'text',
        x: 50,
        y: 120,
        width: 200,
        height: 40,
        text: 'Secondary Title',
        fontFamily: 'Outfit',
        fontSize: 20,
        fill: '#cccccc',
      },
    ];

    const svg = await exportToSVG(800, 600, '#000000', layers);
    expect(svg).toContain('<defs>');
    expect(svg).toContain('<style>');
    expect(svg).toContain('@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap\');');
    expect(svg).toContain('@import url(\'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap\');');
  });

  it('does not embed @import for generic system fonts', async () => {
    const layers = [
      {
        id: 'text-arial',
        type: 'text',
        x: 10,
        y: 10,
        width: 100,
        height: 30,
        text: 'Standard Text',
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#111111',
      },
    ];

    const svg = await exportToSVG(400, 300, '#ffffff', layers);
    expect(svg).not.toContain('family=Arial');
  });

  it('renders colorTint overlay rect for image layers with tint enabled', async () => {
    const layers = [
      {
        id: 'img-1',
        type: 'image',
        x: 0,
        y: 0,
        width: 400,
        height: 400,
        imageUrl: 'https://images.unsplash.com/photo-example.jpg',
        colorTint: {
          enabled: true,
          color: '#EC4899',
          opacity: 0.6,
          blendMode: 'color',
        },
      },
    ];

    const svg = await exportToSVG(400, 400, 'transparent', layers);
    expect(svg).toContain('fill="#EC4899"');
    expect(svg).toContain('opacity="0.6"');
    expect(svg).toContain('style="mix-blend-mode:color"');
  });
});
