import { test, expect } from '@playwright/test';

test.describe('Kreathief Smoke Test', () => {
    test.beforeEach(async ({ page }) => {
        // Inject mock user to bypass Auth screen
        await page.addInitScript(() => {
            window.localStorage.setItem('kreathief_user', JSON.stringify({
                id: 'test-user',
                name: 'Test Designer',
                email: 'test@example.com',
                plan: 'free',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test'
            }));
            window.localStorage.setItem('kreathief_onboarding_seen', 'true');
        });
        await page.goto('/');
    });

    test('should load the dashboard and allow creating a new project', async ({ page }) => {
        // 1. Verify Dashboard loads directly
        await expect(page.locator('h2')).toContainText('Start designing');

        // 2. Verify Glassmorphism cards exist
        const glassCard = page.locator('.glass-card').first();
        await expect(glassCard).toBeVisible();

        // 3. Create a new project from template
        const templateCard = page.locator('#templates-grid button').first();
        await expect(templateCard).toBeVisible();
        await templateCard.click();

        // 4. Verify Editor loads
        await expect(page.locator('.canvas-container')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('input#header-title')).toBeVisible();
    });

    test('should be able to add a layer and see it on canvas', async ({ page }) => {
        // Navigate to dashboard and click a template
        await page.locator('#templates-grid button').first().click();

        // Wait for editor and initial layout
        await expect(page.locator('.canvas-container')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000); // Wait for project state to settle

        // Go to text tab
        const textTab = page.locator('#sidebar >> button').filter({ hasText: 'Text' });
        await textTab.click();

        // Wait for TextPanel to be active in SidePanel
        await expect(page.locator('h3').filter({ hasText: 'Typography' })).toBeVisible({ timeout: 5000 });

        // Add text layer
        await page.click('button:has-text("Heading")');

        // Verify layer appears on canvas
        await expect(page.locator('.animate-scaleIn')).toBeVisible({ timeout: 5000 });
    });

    test('should verify Unsplash integration', async ({ page }) => {
        // Navigate to editor
        await page.locator('#templates-grid button').first().click();
        await expect(page.locator('.canvas-container')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        // Go to Photos tab
        await page.locator('#sidebar >> button').filter({ hasText: 'Photos' }).click();

        // Wait for Photos panel
        await expect(page.locator('h3').filter({ hasText: 'Photos' })).toBeVisible({ timeout: 5000 });

        // Use a specific selector for checking Unsplash grid
        // If working, there will be images from Unsplash API
        await expect(page.locator('.grid-cols-2 img').first()).toBeVisible({ timeout: 15000 });
    });
});
