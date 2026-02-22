import { test, expect } from '@playwright/test';

test.describe('Kreathief Smoke Test', () => {
    test.beforeEach(async ({ page }) => {
        // Inject mock user to bypass Auth screen
        await page.addInitScript(() => {
            window.localStorage.setItem('kreathief_user', JSON.stringify({
                id: 'test-user',
                name: 'Test Designer',
                email: 'test@example.com',
                plan: 'pro', // Use pro plan to avoid project limits during smoke tests
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test'
            }));
            window.localStorage.setItem('kreathief_onboarding_seen', 'true');
        });
        await page.goto('/');
    });

    test('should load the dashboard and allow creating a new project via modal', async ({ page }) => {
        // 1. Verify Branding loads
        await expect(page.locator('header span:has-text("Kreathief")')).toBeVisible();

        // 2. Click New Design button
        await page.click('#create-btn');

        // 3. Click 'Launch Editor' in the modal
        await page.click('button:has-text("Launch Editor")');

        // 4. Verify Editor loads
        await expect(page.locator('#canvas-container')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('input#header-title')).toBeVisible();
    });

    test('should be able to add a text layer and see it on canvas', async ({ page }) => {
        // 1. Navigate to editor via a template (faster path to canvas)
        await page.click('button[role="tab"]:has-text("Templates")');
        await page.locator('#templates-grid button.glass-card, #templates-grid button.group').first().click();

        await expect(page.locator('#canvas-container')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        // 2. Go to text tab
        await page.locator('#sidebar >> button').filter({ hasText: /^Text$/ }).click();

        // 3. Add text layer
        await page.click('button:has-text("Add a heading")');

        // 4. Verify layer appears on canvas
        await expect(page.locator('#canvas-container [data-layer-type="text"]')).toBeVisible({ timeout: 10000 });
    });

    test('should verify Photos integration', async ({ page }) => {
        // 1. Navigate to editor via a template
        await page.click('button[role="tab"]:has-text("Templates")');

        // Use a robust selector for the template card
        const firstTemplate = page.locator('#templates-grid button').first();
        await firstTemplate.waitFor({ state: 'visible', timeout: 10000 });
        await firstTemplate.click({ force: true });

        await expect(page.locator('#canvas-container')).toBeVisible({ timeout: 20000 });
        await page.waitForTimeout(1000);

        // 2. Go to Photos tab
        await page.locator('#sidebar >> button').filter({ hasText: /^Photos$/ }).click();

        // 3. Wait for Photos panel content
        await expect(page.locator('h3').filter({ hasText: /Photos/ })).toBeVisible({ timeout: 10000 });

        // 4. Verify images are loading (Unsplash with guaranteed fallbacks)
        const firstPhoto = page.locator('.custom-scrollbar img').first();
        await expect(firstPhoto).toBeVisible({ timeout: 15000 });

        // 5. Add photo to canvas
        await firstPhoto.click({ force: true });

        // 6. Verify image layer on canvas
        await expect(page.locator('#canvas-container [data-layer-type="image"]')).toBeVisible({ timeout: 10000 });
    });
});
