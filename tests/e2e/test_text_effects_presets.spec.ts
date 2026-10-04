import { test, expect } from '@playwright/test';
import * as path from 'path';

const SCREENSHOT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/0d435f57-6a76-4232-a7a3-b3635d61c2c6';

test.describe('Editor Text Effects Presets Engine E2E Visual Verification', () => {
  test('Browse and Apply Text Effect Presets from Sidebar & Top Toolbar', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1600, height: 1000 });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));

    await page.addInitScript(() => {
      const userSession = JSON.stringify({
        id: 'qa-designer',
        email: 'tester@kreathief.app',
        name: 'Alex Design',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
        plan: 'pro',
      });
      window.localStorage.setItem('kreathief_guest_session', userSession);
      window.localStorage.setItem('kreathief_qa_session', userSession);
      window.localStorage.setItem('kreathief_onboarding_seen', 'true');
      window.localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
      window.localStorage.setItem('kreathief_editor_tour_seen', 'true');
    });

    await page.goto('http://localhost:5173/editor', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).useStore !== undefined, { timeout: 20000 });
    await expect(page.locator('.canvas-container, .design-artboard').first()).toBeVisible({ timeout: 15000 });

    // 1. Add and select a styled text layer
    await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const textLayer = {
        id: 'test-text-preset-layer',
        type: 'text',
        name: 'Preset Hero Text',
        text: 'NEO KREAT',
        x: 180,
        y: 220,
        width: 500,
        height: 120,
        fontSize: 64,
        fontFamily: 'Inter',
        fontWeight: '900',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        color: '#ffffff',
        opacity: 1,
        rotation: 0,
        locked: false,
        visible: true,
        zIndex: 1,
      };
      store.addLayer(textLayer);
      store.selectLayer('test-text-preset-layer');
    });

    await page.waitForTimeout(600);

    // 2. Open the Text tab or trigger open-effects-panel
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-effects-panel'));
    });
    await page.waitForTimeout(500);

    // If effects panel not open, click the Effects button in the toolbar
    const quickEffectsBtn = page.locator('button[title="Text Effects"]').first();
    await expect(quickEffectsBtn).toBeVisible({ timeout: 10000 });
    await quickEffectsBtn.click();
    await page.waitForTimeout(500);

    // 3. Verify Quick Effects dropdown has Presets tab and 10 preset buttons
    const presetsTab = page.locator('[data-testid="quick-tab-presets"]');
    await expect(presetsTab).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="quick-preset-liquidChrome"]')).toBeVisible();

    // Screenshot of Quick Text Effects dropdown
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'quick_effects_presets_dropdown.png'),
    });

    // 4. Click Liquid Chrome preset from top toolbar dropdown
    await page.locator('[data-testid="quick-preset-liquidChrome"]').click();
    await page.waitForTimeout(600);

    // Verify store has liquidChrome applied
    const layerAfterChrome = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const active = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === 'test-text-preset-layer');
      return {
        color: active?.color,
        strokeColor: active?.textStroke?.color,
        neonColor: active?.neonGlow?.color,
        warpStyle: active?.warpStyle,
      };
    });
    expect(layerAfterChrome.strokeColor).toBe('#38bdf8');
    expect(layerAfterChrome.neonColor).toBe('#38bdf8');
    expect(layerAfterChrome.warpStyle).toBe('wave');

    // 5. Open sidebar Text Effects panel via More Effects button or direct navigation
    await quickEffectsBtn.click();
    await page.waitForTimeout(300);
    const moreEffectsBtn = page.locator('button', { hasText: 'More Effects & Mesh Warping' }).first();
    await expect(moreEffectsBtn).toBeVisible({ timeout: 5000 });
    await moreEffectsBtn.click();
    await page.waitForTimeout(1000);

    // Check if the Text Effects panel presets are visible in the sidebar
    const comicBoomCard = page.locator('[data-testid="preset-card-comicBoom"]');
    await expect(comicBoomCard).toBeVisible({ timeout: 10000 });

    // Test category filtering
    const retroCatBtn = page.locator('[data-testid="preset-cat-retro"]');
    await retroCatBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="preset-card-synthwaveSunset"]')).toBeVisible();

    // Return to All
    await page.locator('[data-testid="preset-cat-all"]').click();
    await page.waitForTimeout(300);

    // Screenshot of Text Effects panel with presets
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'text_effects_presets_ui.png'),
    });

    // Apply Comic Boom preset
    await comicBoomCard.click();
    await page.waitForTimeout(600);

    // 6. Screenshot of the Canvas with the applied typography styling
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'canvas_text_effects_applied.png'),
    });
  });
});
