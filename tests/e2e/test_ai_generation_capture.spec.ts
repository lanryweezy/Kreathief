import { test, expect } from '@playwright/test';
import * as path from 'path';

const SCREENSHOT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/0d435f57-6a76-4232-a7a3-b3635d61c2c6';

test.describe('AI Design Generation E2E Visual Verification', () => {
  test('Generate Fitness and Real Estate Artboards and Capture Visual Results', async ({ page }) => {
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

    await page.goto('http://localhost:5174/editor', { waitUntil: 'domcontentloaded' });
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

    // 2. Type Fitness prompt in the Assistant textarea
    const promptInput = page.locator('textarea[placeholder*="Describe what you want to create"]');
    await expect(promptInput).toBeVisible({ timeout: 10000 });
    await promptInput.fill('Crossfit high-performance athletic fitness gym workout poster');

    // 3. Click Generate Button
    const generateBtn = page.locator('button[aria-label="Start AI Design Workflow"]');
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 4. Wait for generation to complete (detect 3 VARIANTS badge or Curation Complete)
    await expect(page.locator('text=Curation Complete')).toBeVisible({ timeout: 90000 });
    await page.waitForTimeout(1000);

    // 5. Screenshot of Assistant panel with the 3 generated variants
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'ai_generated_3_variants.png'),
    });

    // 6. Click 'Apply This Variant' on the primary variant card
    const applyBtn = page.locator('button:has-text("Apply This Variant")').first();
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();
    await page.waitForTimeout(1500);

    // 7. Deselect / click outside to clear selection handles for a clean canvas capture
    await page.mouse.click(100, 100);
    await page.waitForTimeout(500);

    // 8. Capture full screen with canvas showing the newly generated 10-layer fitness artboard
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'ai_generated_fitness_canvas.png'),
    });

    // 9. Now test a second archetype: Luxury Real Estate!
    await promptInput.fill('Modern Beverly Hills penthouse real estate showcase with pool and view');
    await generateBtn.click();
    await expect(page.locator('text=Curation Complete')).toBeVisible({ timeout: 90000 });
    await page.waitForTimeout(1000);

    const applyRealEstateBtn = page.locator('button:has-text("Apply This Variant")').first();
    await applyRealEstateBtn.click();
    await page.waitForTimeout(1500);

    await page.mouse.click(100, 100);
    await page.waitForTimeout(500);

    // 10. Capture screenshot of the Luxury Real Estate artboard on canvas
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'ai_generated_realestate_canvas.png'),
    });
  });
});
