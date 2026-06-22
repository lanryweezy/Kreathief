import { test, expect } from '@playwright/test';

test('capture app screenshots', async ({ page }) => {
  // Mock session
  await page.addInitScript(() => {
    localStorage.setItem(
      'kreathief_qa_session',
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
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'verification/screenshots/1-dashboard.png' });

  // 2. Editor
  await page.getByTestId('nav-templates').click();
  const templateBtn = page.getByTestId(/dashboard-template-btn-/).first();
  await templateBtn.click();
  await page.waitForSelector('.design-artboard');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'verification/screenshots/2-editor.png' });

  // 3. Brand Kit
  await page.getByRole('button', { name: 'Brand' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'verification/screenshots/3-brand-kit.png' });

  // 4. Export Modal
  await page.getByTestId('export-btn').click();
  await page.waitForSelector('[data-testid="export-modal"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'verification/screenshots/4-export-modal.png' });
  await page.getByTestId('close-export-modal').click();
});
