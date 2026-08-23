import { test, expect } from '@playwright/test';

test('capture app screenshots', async ({ page }) => {
  // Mock session
  await page.addInitScript(() => {
    localStorage.setItem(
      'kreathief_guest_session',
      JSON.stringify({
        id: 'test-user',
        name: 'Test Designer',
        email: 'test@example.com',
        plan: 'pro',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      })
    );
    localStorage.setItem('kreathief_onboarding_seen', 'true');
  });

  // 1. Dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1500); // Wait for user to see dashboard
  await page.keyboard.press('Escape'); // Close any modals (like WelcomeModal) that might pop up and block the screen
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/screenshots/1-dashboard.png' });
  // Force remove any annoying modals or overlays that might be blocking the screen
  await page.evaluate(() => {
    document.querySelectorAll('.fixed.inset-0').forEach((el) => el.remove());
  });

  // 2. Click "Create Blank" to enter the editor directly without calling broken AI APIs
  await page.locator('#create-btn').click();
  await page.waitForSelector('.design-artboard', { timeout: 15000 });
  await page.waitForTimeout(2000); // Let the user see the loaded editor
  await page.screenshot({ path: 'verification/screenshots/2-editor.png' });

  // 3. Open Sidebar panels to show functionality

  // Try to open Elements/Shapes panel
  try {
    const elementsBtn = page.getByRole('button', { name: /Elements|Shapes/i }).first();
    if (await elementsBtn.isVisible()) {
      await elementsBtn.click();
      await page.waitForTimeout(1500);
    }
  } catch (e) {}

  // 4. Try to click Brand Kit if available
  try {
    const brandBtn = page.getByRole('button', { name: 'Brand' }).first();
    if (await brandBtn.isVisible()) {
      await brandBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'verification/screenshots/3-brand-kit.png' });
    }
  } catch (e) {}

  // 5. Try to open Export Modal
  try {
    const exportBtn = page.locator('[data-testid="export-btn"], button:has-text("Export")').first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'verification/screenshots/4-export-modal.png' });
    }
  } catch (e) {}

  await page.waitForTimeout(2000); // Final pause before closing
});
