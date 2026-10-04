import { test, expect } from '@playwright/test';
import * as path from 'path';

const SCREENSHOT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/0d435f57-6a76-4232-a7a3-b3635d61c2c6';

test.describe('Editor Templates Panel — 195 Style Presets E2E Visual Verification', () => {
  test('Browse and Apply Style Templates to Canvas', async ({ page }) => {
    test.setTimeout(180000);
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
    });

    await page.goto('http://localhost:5173/editor', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.canvas-container, .design-artboard').first()).toBeVisible({ timeout: 15000 });

    // 1. Ensure the sidepanel is open and on the Templates tab
    const stylesTabBtn = page.locator('[data-testid="template-tab-styles"]');
    if (!await stylesTabBtn.isVisible()) {
      const templatesNavBtn = page.locator('#sidebar-container button, nav button').filter({ hasText: 'Templates' }).first();
      if (await templatesNavBtn.isVisible()) {
        await templatesNavBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // 2. Click the new "🎨 Styles (195)" tab
    await expect(stylesTabBtn).toBeVisible({ timeout: 10000 });
    await stylesTabBtn.click();
    await page.waitForTimeout(500);

    // 3. Verify format selector and movement chips
    await expect(page.locator('text=Canvas Format')).toBeVisible();
    await expect(page.locator('text=Movement Category')).toBeVisible();

    // 4. Capture screenshot of the Style Templates library in the left sidebar
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'templates_panel_styles_tab.png'),
    });

    // 5. Select a template button (e.g. Bold Hero under Art Deco)
    const applyTmplBtn = page.locator('button[title*="Apply"]').first();
    await expect(applyTmplBtn).toBeVisible();
    await applyTmplBtn.click();
    await page.waitForTimeout(500);

    // 6. Click the modal confirm button via testid
    const modalConfirmBtn = page.locator('[data-testid="confirm-modal-apply-btn"]');
    await expect(modalConfirmBtn).toBeVisible({ timeout: 5000 });
    await modalConfirmBtn.click();

    // Wait for modal to disappear
    await expect(modalConfirmBtn).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // 7. Click canvas background to deselect handles
    await page.mouse.click(800, 500);
    await page.waitForTimeout(600);

    // 8. Capture screenshot of canvas with the applied style template
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'canvas_applied_style_template.png'),
    });
  });
});
