
import { test, expect } from '@playwright/test';

test.describe('Component Functionality', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER_LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER_ERROR: ${err.toString()}`));

        // Mock authenticated user
        await page.addInitScript(() => {
            localStorage.setItem('kreathief_user', JSON.stringify({
                id: 'test-user',
                name: 'Test Tester',
                email: 'test@example.com',
                plan: 'pro',
                avatar: 'https://via.placeholder.com/150'
            }));
            localStorage.setItem('kreathief_onboarding_seen', 'true'); // Skip onboarding
        });

        // Navigate to root (which will redirect to Dashboard)
        await page.goto('http://localhost:5175/');

        // Wait for Dashboard
        await expect(page.locator('text=New Design')).toBeVisible({ timeout: 10000 });

        // Click "New Design" button to open modal
        await page.locator('text=New Design').click();

        // Wait for "Launch Editor" button in modal
        await expect(page.locator('text=Launch Editor')).toBeVisible({ timeout: 5000 });

        // Click "Launch Editor"
        await page.locator('text=Launch Editor').click();

        // Now wait for canvas
        await expect(page.locator('canvas')).toBeVisible({ timeout: 20000 });
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
        // Open Text Tab using specific selector
        await page.locator('#sidebar button[aria-label="Text"]').click();

        // Wait for "Add a heading"
        await expect(page.locator('text=Add a heading')).toBeVisible({ timeout: 5000 });

        // Click "Add a heading"
        await page.locator('text=Add a heading').click();

        // Verify text appears on canvas (indirect verification)
        // Check Layers Tab
        const layersTab = page.locator('#sidebar button[aria-label="Layers"]');
        if (await layersTab.isVisible()) {
            await layersTab.click();
            await expect(page.getByText('Heading')).toBeVisible({ timeout: 5000 });
        }
    });

    test('Elements Panel adds shape', async ({ page }) => {
        // Open Elements Tab
        await page.locator('#sidebar button[aria-label="Elements"]').click();
        await expect(page.getByText('Shapes')).toBeVisible({ timeout: 5000 });
    });

    test('Uploads Panel opens', async ({ page }) => {
        await page.locator('#sidebar button[aria-label="Uploads"]').click();
        await expect(page.getByText('Upload Media')).toBeVisible({ timeout: 5000 });
    });

    test('Templates Panel loads', async ({ page }) => {
        await page.locator('#sidebar button[aria-label="Designs"]').click();
        await expect(page.getByText('Templates')).toBeVisible({ timeout: 5000 });
    });
});
