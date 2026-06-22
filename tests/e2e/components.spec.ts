import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 1920, height: 1080 },
});

test.describe('Component Functionality', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log(`BROWSER_LOG: ${msg.text()}`));
    page.on('pageerror', (err) => console.log(`BROWSER_ERROR: ${err.toString()}`));

    // Mock authenticated user
    await page.addInitScript(() => {
      localStorage.setItem(
        'kreathief_qa_session',
        JSON.stringify({
          id: 'test-user',
          name: 'Test Tester',
          email: 'test@example.com',
          plan: 'pro',
          avatar: 'https://via.placeholder.com/150',
        })
      );
      localStorage.setItem('kreathief_onboarding_seen', 'true'); // Skip onboarding
    });

    // Navigate directly to editor
    await page.goto('/editor');

    // Now wait for editor workspace
    await expect(page.locator('[data-artboard-id]')).toBeVisible({ timeout: 20000 });
  });

  test('Canvas loads without error', async ({ page }) => {
    // Check for "Component Error" text overlay
    const errorOverlay = page.locator('text=Component Error');
    if (await errorOverlay.isVisible()) {
      const errorText = await page.locator('body').innerText();
      console.log('VISIBLE ERROR OVERLAY:', errorText);
      throw new Error('Canvas has error overlay');
    }
    await expect(errorOverlay).not.toBeVisible();
  });

  test('Text Panel adds text', async ({ page }) => {
    // Open Text Tab using data-testid
    await page.getByRole('button', { name: 'Text' }).click();

    // Wait for "Add a heading"
    await expect(page.getByText('Add a heading')).toBeVisible({ timeout: 10000 });

    // Click "Add a heading"
    await page.getByText('Add a heading').click();

    // Brief wait for state update
    await page.waitForTimeout(2000);

    // Verify text appears on canvas (indirect verification)
    // Check Layers Tab
    await page.getByRole('button', { name: 'Layers' }).click();

    // Take a screenshot to debug
    await page.screenshot({ path: 'debug_layers_text.png' });

    // The layer name for "Heading" is "Heading" based on the code
    // Use a more specific locator for the side panel
    await expect(page.getByTestId('side-panel').getByText('Heading')).toBeVisible({ timeout: 10000 });
  });

  test('Elements Panel adds shape', async ({ page }) => {
    // Open Elements Tab
    await page.getByRole('button', { name: 'Components' }).click();

    // Ensure we are on Shapes tab
    const shapesTab = page.locator('button:has-text("Shapes")').first();
    await shapesTab.click();

    // Wait for shape buttons to be available
    await page.waitForSelector('.grid button');

    // Click a shape (first one in the grid - "Square")
    await page.locator('.grid button').first().click();

    // Brief wait for state update
    await page.waitForTimeout(2000);

    // Verify shape added to layers
    // Ensure sidebar is scrolled if needed
    const layersTab = page.getByRole('button', { name: 'Layers' });
    await layersTab.scrollIntoViewIfNeeded();
    await layersTab.click();

    // Wait for Layers panel to be active
    await expect(page.getByTestId('side-panel').getByText('Layers').first()).toBeVisible({ timeout: 5000 });

    // Check for "Square" layer name specifically in the side-panel's layer list
    // It might be nested in a span with other text, so we use a locator that targets the side-panel
    const layerItem = page
      .getByTestId('side-panel')
      .locator('span')
      .filter({ hasText: /^Square$/ })
      .first();
    await expect(layerItem).toBeVisible({ timeout: 10000 });

    // Take a screenshot to debug
    await page.screenshot({ path: 'debug_layers_shape_fixed.png' });
  });

  test('Uploads Panel opens', async ({ page }) => {
    await page.getByRole('button', { name: 'Media' }).click();
    await expect(page.getByText('Upload Media')).toBeVisible({ timeout: 5000 });
  });

  test('Templates Panel loads', async ({ page }) => {
    await page.getByRole('button', { name: 'Templates' }).click();
    await expect(page.getByText('Templates')).toBeVisible({ timeout: 5000 });
  });
});
