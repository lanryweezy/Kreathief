import { describe, it, expect } from 'vitest';
import {
  generateStyleTemplates,
  generateAllStyleTemplates,
  getStylePreviewTemplates,
} from '../../services/styleTemplateGenerator';
import {
  DESIGN_STYLE_DATABASE,
  getAllStyles,
  getStylesByCategory,
  searchStyles,
} from '../../services/designStyleDatabase';

describe('Style Templates Generator & Library', () => {
  it('should generate 3 templates per style across all styles', () => {
    const allStyles = getAllStyles();
    expect(allStyles.length).toBeGreaterThanOrEqual(60);

    const allTemplates = generateAllStyleTemplates('instagram');
    expect(allTemplates.length).toBe(allStyles.length * 3);
  });

  it('should generate correct dimensions for all 3 supported formats', () => {
    const artDeco = DESIGN_STYLE_DATABASE.artDeco;
    expect(artDeco).toBeDefined();

    const squareTemplates = generateStyleTemplates(artDeco, 'instagram');
    expect(squareTemplates.length).toBe(3);
    expect(squareTemplates[0].width).toBe(1080);
    expect(squareTemplates[0].height).toBe(1080);

    const storyTemplates = generateStyleTemplates(artDeco, 'story');
    expect(storyTemplates.length).toBe(3);
    expect(storyTemplates[0].width).toBe(1080);
    expect(storyTemplates[0].height).toBe(1920);

    const slideTemplates = generateStyleTemplates(artDeco, 'presentation');
    expect(slideTemplates.length).toBe(3);
    expect(slideTemplates[0].width).toBe(1920);
    expect(slideTemplates[0].height).toBe(1080);
  });

  it('should produce 3 distinct layout archetypes per style', () => {
    const bento = DESIGN_STYLE_DATABASE.bentoGrid || DESIGN_STYLE_DATABASE.bauhaus;
    const templates = generateStyleTemplates(bento, 'instagram');

    // Bold Hero, Split Layout, Minimal Card
    expect(templates[0].name).toContain('Bold Hero');
    expect(templates[1].name).toContain('Split Layout');
    expect(templates[2].name).toContain('Minimal Card');

    // Verify layers exist and are populated
    for (const tmpl of templates) {
      expect(tmpl.layers.length).toBeGreaterThanOrEqual(4);
      expect(tmpl.backgroundColor).toBeDefined();
      expect(tmpl.previewColors.length).toBe(3);
    }
  });

  it('should support search and category filtering correctly', () => {
    const retroStyles = getStylesByCategory('retro');
    expect(retroStyles.length).toBeGreaterThanOrEqual(8);

    const searchResults = searchStyles('bauhaus');
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults.some((s) => s.id === 'bauhaus')).toBe(true);

    const goldSearch = searchStyles('gold');
    expect(goldSearch.length).toBeGreaterThan(0);
  });

  it('should return preview templates for quick gallery views', () => {
    const previews = getStylePreviewTemplates(6);
    expect(previews.length).toBe(6);
    for (const preview of previews) {
      expect(preview.layers.length).toBeGreaterThan(0);
      expect(preview.name).toContain('Bold Hero');
    }
  });
});
