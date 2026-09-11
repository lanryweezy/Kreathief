import { test, expect } from '@playwright/test';

test('record video', async ({ page }) => {
  // Mock session for dashboard/editor
  await page.addInitScript(() => {
    localStorage.setItem(
      'kreathief_qa_session',
      JSON.stringify({
        id: 'test-user',
        name: 'PH Demo User',
        email: 'demo@kreathief.com',
        plan: 'pro',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      })
    );
    localStorage.setItem('kreathief_onboarding_seen', 'true');
    localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
    localStorage.setItem('kreathief_editor_tour_seen', 'true');
  });

  await page.goto('/editor');
  await page.waitForFunction(() => (window as any).useStore !== undefined);
  await page.waitForSelector('.design-artboard', { state: 'visible' });

  // 1. Add Text
  await page.getByRole('button', { name: 'Text' }).click();
  await page.getByTestId('add-heading-btn').click();
  await page.waitForTimeout(1000);

  // 2. Change Color
  await page.evaluate(() => {
    const store = (window as any).useStore.getState();
    const id = store.selectedLayerIds[0];
    store.updateLayer(id, { color: '#7d2ae8', text: 'Launch Video' });
  });
  await page.waitForTimeout(1000);

  // 3. Open AI Assistant
  await page.getByRole('button', { name: 'AI Assistants' }).click();
  await page.waitForTimeout(1500);

  // 4. Open Mockup Studio
  await page.getByRole('button', { name: 'Mockups' }).click();
  await page.waitForTimeout(1500);

  // 5. Open Layers
  await page.getByRole('button', { name: 'Layers' }).click();
  await page.waitForTimeout(1500);

  // 6. Export
  await page.getByTestId('export-btn').click();
  await page.waitForSelector('[role="dialog"]');
  await page.waitForTimeout(2000);
});
