import { test, expect } from '@playwright/test';

test.describe('Kreathief Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    // Setup QA bypass
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'kreathief_qa_session',
        JSON.stringify({
          id: 'qa-user',
          email: 'qa@kreathief.app',
          name: 'QA Engineer',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qa',
          plan: 'pro',
        })
      );
      window.localStorage.setItem('kreathief_onboarding_seen', 'true');
    });

    await page.goto('/');
  });

  test('should load the dashboard and create a new project', async ({ page }) => {
    // Should be on dashboard after goto('/') because of QA bypass
    await expect(page).toHaveURL(/.*dashboard/);

    // Check branding in dashboard header
    const branding = page.locator('header').getByText('Kreathief');
    await expect(branding).toBeVisible();

    // Click "New Design" button
    const newDesignBtn = page.getByRole('button', { name: /New Design/i });
    await expect(newDesignBtn).toBeVisible();
    await newDesignBtn.click();

    // Should see the "Create New Design" modal
    await expect(page.getByRole('heading', { name: /Create New Design/i })).toBeVisible();

    // Click "Launch Editor" with a custom name
    await page.getByPlaceholder('My Awesome Design').fill('Smoke Test Project');
    await page.getByRole('button', { name: /Launch Editor/i }).click();

    // Wait for navigation to editor
    await page.waitForURL(/.*editor/, { timeout: 30000 });

    // Verify editor header is visible
    await expect(page.locator('header').getByText('Smoke Test Project')).toBeVisible({ timeout: 30000 });

    // Verify canvas is visible
    const canvas = page.locator('.canvas-container');
    await expect(canvas).toBeVisible({ timeout: 30000 });

    // Verify we have at least one artboard
    await expect(page.getByText('Artboard 1')).toBeVisible();
  });

  test('should interact with the editor sidebar', async ({ page }) => {
    // Directly go to editor
    await page.getByRole('button', { name: /New Design/i }).click();
    await page.getByRole('button', { name: /Launch Editor/i }).click();
    await page.waitForURL(/.*editor/);

    // Click on "AI Magic" tab
    await page.getByRole('tab', { name: /^AI Magic$/i }).click();
    await expect(page.getByText(/AI Magic/i, { exact: true })).toBeVisible();

    // Click on "Elements" tab
    await page.getByRole('tab', { name: /^Elements$/i }).click();
    await expect(page.getByText(/Shapes/i)).toBeVisible();

    // Click on "Text" tab
    await page.getByRole('tab', { name: /^Text$/i }).click();
    await expect(page.getByText(/Typography/i)).toBeVisible();

    // Click on "Photos" tab
    await page.getByRole('tab', { name: /^Photos$/i }).click();
    await expect(page.getByPlaceholder(/Search millions of photos/i)).toBeVisible();
  });
});
