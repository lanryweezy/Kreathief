import { test, expect } from '@playwright/test';
import * as path from 'path';

const SCREENSHOT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/0d435f57-6a76-4232-a7a3-b3635d61c2c6';

test.describe('SVG Vector Textures & Curved Badge Generator E2E Visual Verification', () => {
  test('Browse and Apply Vector Textures and Circular Badges to Canvas', async ({ page }) => {
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

    // 1. Navigate to the Textures tab in sidebar
    const texturesNavBtn = page.locator('button[title="Textures"], button[aria-label="Textures"]').first();
    await expect(texturesNavBtn).toBeVisible({ timeout: 10000 });
    await texturesNavBtn.click();
    await page.waitForTimeout(600);

    // 2. Verify Textures Panel is open
    const paperGrainCard = page.locator('[data-testid="texture-card-paperGrain"]');
    await expect(paperGrainCard).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="texture-card-risoHalftone"]')).toBeVisible();

    // Screenshot of Textures panel
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'textures_panel_ui.png'),
    });

    // 3. Apply Vintage Paper Grain to Canvas Artboard
    await paperGrainCard.click();
    await page.waitForTimeout(600);

    // Verify texture overlay exists on artboard
    const overlay = page.locator('[data-testid="artboard-texture-overlay-paperGrain"]');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Switch blend mode to overlay
    const overlayBlendBtn = page.locator('[data-testid="blendmode-overlay"]');
    if (await overlayBlendBtn.isVisible()) {
      await overlayBlendBtn.click();
      await page.waitForTimeout(400);
    }

    // Screenshot of Artboard with applied texture
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'canvas_artboard_texture_applied.png'),
    });

    // 4. Navigate to Text tab
    const textNavBtn = page.locator('button[title="Text"], button[aria-label="Text"]').first();
    await textNavBtn.click();
    await page.waitForTimeout(500);

    // 5. Open Badges tab via Callout button or direct tab
    const exploreBadgesBtn = page.locator('[data-testid="explore-badges-btn"]');
    if (await exploreBadgesBtn.isVisible()) {
      await exploreBadgesBtn.click();
      await page.waitForTimeout(500);
    } else {
      const badgesTab = page.locator('button[role="tab"]', { hasText: 'badges' }).first();
      await badgesTab.click();
      await page.waitForTimeout(500);
    }

    // 6. Verify badge presets
    const stampBtn = page.locator('[data-testid="add-badge-btn-classicStamp"]');
    await expect(stampBtn).toBeVisible({ timeout: 10000 });

    // 7. Click Add Emblem to generate Vintage Seal on canvas
    await stampBtn.click();
    await page.waitForTimeout(800);

    // 8. Capture canvas with the applied circular badge emblem
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'canvas_badge_generator_applied.png'),
    });
  });
});
