import { test, expect } from '@playwright/test';
import * as path from 'path';

const SCREENSHOT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/0d435f57-6a76-4232-a7a3-b3635d61c2c6';

test.describe('AI Graphic Design Styles & 2026 Trends E2E Visual Verification', () => {
  test('Generate Bento Grid and Aurora Artboards and Capture Visual Results', async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1600, height: 1000 });

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
    });

    await page.goto('http://localhost:5173/editor', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.canvas-container, .design-artboard').first()).toBeVisible({ timeout: 15000 });

    // 1. Open AI Assistant Panel
    await page.evaluate(() => {
      const store = (window as any).__KREATHIEF_STORE__ || (window as any).useStore;
      if (store) {
        store.getState().setShowAIOverlay(true, 'assistant');
      }
    });

    // If evaluate didn't find the global store, click the Agent button in Header
    const agentBtn = page.locator('button[aria-label="Open AI tools"]');
    if (await agentBtn.isVisible()) {
      await agentBtn.click();
      await page.waitForTimeout(300);
      const agentTab = page.locator('button:has-text("Agent")').first();
      if (await agentTab.isVisible()) {
        await agentTab.click();
      }
    }

    await page.waitForTimeout(500);

    // 2. Verify Graphic Styles & 2026 Trends UI
    const stylesHeading = page.locator('text=Graphic Styles & 2026 Trends');
    await expect(stylesHeading).toBeVisible({ timeout: 10000 });

    // Capture the Assistant Panel with the 2026 Trends & Styles Bar
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'ai_styles_selector_ui.png'),
    });

    // 3. Click the Bento Grid style chip
    const bentoChip = page.locator('button:has-text("Bento Grid")').first();
    await expect(bentoChip).toBeVisible();
    await bentoChip.click();
    await page.waitForTimeout(300);

    // Verify Locked Style pill appears
    await expect(page.locator('text=Locked:')).toBeVisible();

    // 4. Fill Prompt and Generate
    const promptInput = page.locator('textarea[placeholder*="Describe what you want to create"]');
    await expect(promptInput).toBeVisible({ timeout: 10000 });
    await promptInput.fill('Modular SaaS analytics command center and performance metrics dashboard');

    const generateBtn = page.locator('button[aria-label="Start AI Design Workflow"]');
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 5. Wait for generation to complete (detect Curation Complete)
    await expect(page.locator('text=Curation Complete')).toBeVisible({ timeout: 90000 });
    await page.waitForTimeout(1000);

    // 6. Capture Assistant Panel with the 3 generated variants
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'ai_generated_3_variants.png'),
    });

    // 7. Click 'Apply This Variant' on the primary Bento Grid variant
    const applyBtn = page.locator('button:has-text("Apply This Variant")').first();
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();
    await page.waitForTimeout(1500);

    // Deselect
    await page.mouse.click(100, 100);
    await page.waitForTimeout(500);

    // 8. Capture Bento Grid artboard canvas
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'ai_generated_bento_grid_canvas.png'),
    });

    // 9. Now generate an Aurora / Ethereal flagship design
    const auroraChip = page.locator('button:has-text("Aurora")').first();
    if (await auroraChip.isVisible()) {
      await auroraChip.click();
      await page.waitForTimeout(300);
    }

    await promptInput.fill('Ethereal glowing iridescent cosmic aurora meditation and soundscape');
    await generateBtn.click();
    await expect(page.locator('text=Curation Complete')).toBeVisible({ timeout: 90000 });
    await page.waitForTimeout(1000);

    const applyAuroraBtn = page.locator('button:has-text("Apply This Variant")').first();
    await applyAuroraBtn.click();
    await page.waitForTimeout(1500);

    await page.mouse.click(100, 100);
    await page.waitForTimeout(500);

    // 10. Capture Aurora artboard canvas
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'ai_generated_aurora_canvas.png'),
    });
  });
});
