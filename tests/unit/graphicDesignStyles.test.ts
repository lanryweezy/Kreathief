import { describe, it, expect } from 'vitest';
import {
  GRAPHIC_DESIGN_STYLES,
  GRAPHIC_DESIGN_STYLE_LIST,
  getStylesByCategory,
  classifyDesignMovement,
  buildCompositionByStyleId,
  GraphicDesignStyleId,
} from '../../services/graphicDesignStyles';

describe('Graphic Design Styles & 2026 Trends Engine', () => {
  it('should define all 25 curated design movements and 2026 trends', () => {
    expect(GRAPHIC_DESIGN_STYLE_LIST.length).toBe(25);
    const ids = GRAPHIC_DESIGN_STYLE_LIST.map((s) => s.id);
    expect(ids).toContain('bentoGrid');
    expect(ids).toContain('aurora');
    expect(ids).toContain('neoBrutalism');
    expect(ids).toContain('luxuryTypography');
    expect(ids).toContain('micrographics');
    expect(ids).toContain('bauhaus');
    expect(ids).toContain('artDeco');
    expect(ids).toContain('swissStyle');
    expect(ids).toContain('popArt');
    expect(ids).toContain('psychedelic');
    expect(ids).toContain('y2k');
    expect(ids).toContain('synthwave');
    expect(ids).toContain('japandi');
    expect(ids).toContain('risograph');
    expect(ids).toContain('typeCollage');
  });

  it('should categorize styles into valid buckets', () => {
    const trends = getStylesByCategory('trends2026');
    expect(trends.some((s) => s.id === 'bentoGrid')).toBe(true);
    expect(trends.some((s) => s.id === 'aurora')).toBe(true);
    expect(trends.some((s) => s.id === 'neoBrutalism')).toBe(true);

    const movements = getStylesByCategory('movements');
    expect(movements.some((s) => s.id === 'bauhaus')).toBe(true);
    expect(movements.some((s) => s.id === 'artDeco')).toBe(true);
    expect(movements.some((s) => s.id === 'swissStyle')).toBe(true);

    const retro = getStylesByCategory('retroSubculture');
    expect(retro.some((s) => s.id === 'y2k')).toBe(true);
    expect(retro.some((s) => s.id === 'synthwave')).toBe(true);
    expect(retro.some((s) => s.id === 'risograph')).toBe(true);
  });

  it('should classify prompts into the correct 2026 trends and movements', () => {
    expect(classifyDesignMovement('Create a modular bento grid layout for SaaS analytics')).toBe('bentoGrid');
    expect(classifyDesignMovement('Ethereal aurora northern lights background for wellness app')).toBe('aurora');
    expect(classifyDesignMovement('Bold neo-brutalism streetwear poster with 4px border')).toBe('neoBrutalism');
    expect(classifyDesignMovement('Haute couture luxury typography for gold perfume branding')).toBe('luxuryTypography');
    expect(classifyDesignMovement('Y2K cybercore liquid chrome metallic rave flyer')).toBe('y2k');
    expect(classifyDesignMovement('Synthwave neon grid sunset album art')).toBe('synthwave');
    expect(classifyDesignMovement('Bauhaus form follows function poster')).toBe('bauhaus');
    expect(classifyDesignMovement('Art Deco gatsby luxury event invitation')).toBe('artDeco');
    expect(classifyDesignMovement('Swiss style international typographic grid poster')).toBe('swissStyle');
    expect(classifyDesignMovement('Pop art Roy Lichtenstein comic book boom')).toBe('popArt');
    expect(classifyDesignMovement('Trippy psychedelic 60s rock concert')).toBe('psychedelic');
    expect(classifyDesignMovement('Japandi wabi-sabi minimalist coffee brand')).toBe('japandi');
    expect(classifyDesignMovement('Risograph misregistered two-tone spot print')).toBe('risograph');
    expect(classifyDesignMovement('Type-collage ransom note font experiment')).toBe('typeCollage');
  });

  it('should return null for non-stylized generic prompts', () => {
    expect(classifyDesignMovement('Make a flyer for my store')).toBeNull();
    expect(classifyDesignMovement('')).toBeNull();
  });

  it('should build authentic Bento Grid composition with modular compartments', () => {
    const result = buildCompositionByStyleId('bentoGrid', 1080, 1080, 'SaaS Analytics Dashboard');
    expect(result.width).toBe(1080);
    expect(result.height).toBe(1080);
    expect(result.layers.length).toBeGreaterThanOrEqual(10);

    // Verify bento modular cards are present
    const card1 = result.layers.find((l) => l.name?.includes('Bento Hero Card'));
    expect(card1).toBeDefined();
    expect((card1 as any).cornerRadius).toBe(24);

    const headline = result.layers.find((l) => l.name?.includes('Bento Main Headline'));
    expect(headline).toBeDefined();
    expect((headline as any).text).toContain('SAAS');
  });

  it('should build authentic Aurora composition with glowing translucent orbs', () => {
    const result = buildCompositionByStyleId('aurora', 1080, 1080, 'Cosmic Calm App');
    expect(result.layers.length).toBeGreaterThanOrEqual(8);

    const orb = result.layers.find((l) => l.name?.includes('Aurora Violet Glow'));
    expect(orb).toBeDefined();
    expect(orb?.type).toBe('circle');

    const glass = result.layers.find((l) => l.name?.includes('Aurora Glass Frame'));
    expect(glass).toBeDefined();
    expect((glass as any).cornerRadius).toBe(32);
  });

  it('should build authentic Neo-Brutalist composition with 4px borders and hard shadows', () => {
    const result = buildCompositionByStyleId('neoBrutalism', 1080, 1080, 'Raw Streetwear');
    expect(result.layers.length).toBeGreaterThanOrEqual(8);

    const mainFrame = result.layers.find((l) => l.name?.includes('Neo-Brutalist Main Frame'));
    expect(mainFrame).toBeDefined();
    expect((mainFrame as any).stroke.width).toBe(4);
    expect((mainFrame as any).shadow.blur).toBe(0);
    expect((mainFrame as any).shadow.offsetX).toBe(8);

    const sticker = result.layers.find((l) => l.name?.includes('Neo Tilted Sticker'));
    expect(sticker).toBeDefined();
    expect((sticker as any).rotation).toBe(-5);
  });

  it('should build authentic Luxury Typography composition with gold hairline frame', () => {
    const result = buildCompositionByStyleId('luxuryTypography', 1080, 1080, 'Maison De Parfum');
    expect(result.layers.length).toBeGreaterThanOrEqual(7);

    const frame = result.layers.find((l) => l.name?.includes('Luxury Gold Hairline Frame'));
    expect(frame).toBeDefined();
    expect((frame as any).stroke.color).toBe(GRAPHIC_DESIGN_STYLES.luxuryTypography.palette.primary);

    const headline = result.layers.find((l) => l.name?.includes('Luxury Headline'));
    expect(headline).toBeDefined();
    expect((headline as any).fontFamily).toBe('Cinzel');
  });

  it('should successfully build all 25 style compositions without throwing', () => {
    const allIds: GraphicDesignStyleId[] = GRAPHIC_DESIGN_STYLE_LIST.map((s) => s.id);
    for (const id of allIds) {
      const res = buildCompositionByStyleId(id, 1080, 1080, `Sample ${id} design test`);
      expect(res.width).toBe(1080);
      expect(res.height).toBe(1080);
      expect(res.layers.length).toBeGreaterThanOrEqual(5);
      expect(res.backgroundColor).toBeDefined();
    }
  });
});
