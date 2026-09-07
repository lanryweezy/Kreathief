import { test, expect } from '@playwright/test';
import * as path from 'path';

const SCREENSHOT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/0d435f57-6a76-4232-a7a3-b3635d61c2c6/.tempmediaStorage';

test.describe('Kreathief Modals Visual Capture', () => {
  test('Capture Shortcuts, Share, and Contextual Modals', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.addInitScript(() => {
      const userSession = JSON.stringify({
        id: 'audit-user',
        email: 'designer@kreathief.app',
        name: 'Alex Rivera',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
        plan: 'pro',
      });
      window.localStorage.setItem('kreathief_guest_session', userSession);
      window.localStorage.setItem('kreathief_qa_session', userSession);
      window.localStorage.setItem('kreathief_onboarding_seen', 'true');
      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
      localStorage.setItem('kreathief_editor_tour_seen', 'true');
      window.localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
    });

    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.canvas-container, .design-artboard').first()).toBeVisible({ timeout: 15000 });

    // 1. Keyboard Shortcuts Modal
    await page.keyboard.press('?');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_shortcuts_dialog.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 2. Share Modal
    const shareBtn = page.locator('button[aria-label="Share design"]').first();
    if (await shareBtn.isVisible()) {
      await shareBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_share_modal.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });
});
