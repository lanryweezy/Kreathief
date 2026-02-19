import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { EditorPage } from '../pages/EditorPage';

test.describe('Full Design Workflow', () => {
  test('should complete full design workflow from creation to export', async ({ page }) => {
    // Mock authenticated user
    await page.addInitScript(() => {
      localStorage.setItem(
        'kreathief_user',
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

    const dashboard = new DashboardPage(page);
    const editor = new EditorPage(page);

    // Step 1: Navigate to dashboard
    await dashboard.goto();
    await dashboard.verifyDashboardLoaded();

    // Step 2: Create new project from template
    await dashboard.openTemplate('Instagram Post');
    await editor.waitForCanvasReady();

    // Step 3: Set project title
    await editor.setProjectTitle('My Complete Design');

    // Step 4: Add text layer
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();

    const addHeading = page.locator('button:has-text("Heading"), button:has-text("Add a heading")');
    await addHeading.click();
    await page.waitForTimeout(500);

    // Step 5: Add shape
    const elementsTab = editor.sidebar.locator('button[aria-label="Elements"]');
    await elementsTab.click();

    const shapeBtn = page.locator('button[aria-label*="Rectangle"], button[aria-label*="Square"], .shape-btn').first();
    if (await shapeBtn.isVisible()) {
      await shapeBtn.click();
      await page.waitForTimeout(500);
    }

    // Step 6: Verify layers exist
    await editor.openLayersPanel();
    const layerCount = await editor.getLayerCount();
    expect(layerCount).toBeGreaterThan(1);

    // Step 7: Save project
    await editor.save();
    await page.waitForTimeout(1000);

    // Step 8: Export as PNG
    await editor.export('png');
    const download = await page.waitForEvent('download', { timeout: 15000 });
    expect(download.suggestedFilename()).toContain('.png');

    // Step 9: Navigate back to dashboard
    const backBtn = page.locator('button[aria-label="Back"], button:has-text("Back")');
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await dashboard.verifyDashboardLoaded();
    }

    // Step 10: Verify project saved
    await dashboard.searchProjects('My Complete Design');
    const project = dashboard.projectsList.locator('text="My Complete Design"');
    await expect(project).toBeVisible({ timeout: 5000 });
  });

  test('should preserve work across session', async ({ page }) => {
    // Mock authenticated user
    await page.addInitScript(() => {
      localStorage.setItem(
        'kreathief_user',
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

    const editor = new EditorPage(page);

    // First session: Create and save
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    await editor.setProjectTitle('Persistent Design');

    // Add text
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();
    const addHeading = page.locator('button:has-text("Heading")');
    await addHeading.click();
    await page.waitForTimeout(500);

    // Save
    await editor.save();
    await page.waitForTimeout(1000);

    // Second session: Reload and verify
    await page.reload();
    await editor.waitForCanvasReady();

    // Verify title persisted
    const savedTitle = await editor.projectTitleInput.inputValue();
    expect(savedTitle).toBe('Persistent Design');

    // Verify layer exists
    await editor.openLayersPanel();
    const layerCount = await editor.getLayerCount();
    expect(layerCount).toBeGreaterThan(0);
  });

  test('should handle multiple tabs workflow', async ({ page, context }) => {
    // Mock authenticated user
    await page.addInitScript(() => {
      localStorage.setItem(
        'kreathief_user',
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

    // Tab 1: Create project
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();

    const editor1 = new EditorPage(page);
    await editor1.waitForCanvasReady();
    await editor1.setProjectTitle('Multi-Tab Design');
    await editor1.save();

    // Tab 2: Open same project
    const page2 = await context.newPage();
    await page2.goto('/');
    const dashboard2 = new DashboardPage(page2);
    await dashboard2.verifyDashboardLoaded();

    // Find and open the project we just created
    const projectCard = dashboard2.projectsList.locator('button, [role="button"]').first();
    await projectCard.click();

    const editor2 = new EditorPage(page2);
    await editor2.waitForCanvasReady();

    // Verify both tabs show same title
    const title2 = await editor2.projectTitleInput.inputValue();
    expect(title2).toBe('Multi-Tab Design');

    // Clean up
    await page2.close();
  });
});
