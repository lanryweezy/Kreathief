import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { EditorPage } from '../pages/EditorPage';

test.describe('Full Design Workflow', () => {
  test('should complete full design workflow from creation to export', async ({ page }) => {
    // Mock authenticated user
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
      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
      localStorage.setItem('kreathief_editor_tour_seen', 'true');
    });

    const dashboard = new DashboardPage(page);
    const editor = new EditorPage(page);

    // Step 1: Navigate to dashboard
    await dashboard.goto();
    await dashboard.verifyDashboardLoaded();

    // Step 2: Create new project from template
    await dashboard.switchToTemplates();
    await dashboard.openTemplate('Instagram Post');
    await editor.waitForCanvasReady();

    // Step 3: Set project title
    await editor.setProjectTitle('My Complete Design');

    // Step 4: Add text layer
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();

    const addHeading = page.getByTestId('add-heading-btn');
    await addHeading.click();
    await page.waitForTimeout(500);

    // Step 5: Add shape
    const elementsTab = editor.sidebar.locator('button[aria-label="Elements"]');
    await elementsTab.click();

    const shapeBtn = page
      .locator('button[aria-label*="Rectangle"], button[aria-label*="Square"], [id^="shape-btn-rectangle"]')
      .first();
    await expect(shapeBtn).toBeVisible({ timeout: 10000 });
    await shapeBtn.click();
    await page.waitForTimeout(500);

    // Step 6: Verify layers exist via store
    const layerCount = await page.evaluate(() => {
      const state = (window as any).useStore.getState();
      const artboard = state.artboards.find((a: any) => a.id === state.activeArtboardId);
      return artboard.layers.length;
    });
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
      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
      localStorage.setItem('kreathief_editor_tour_seen', 'true');
    });

    const editor = new EditorPage(page);

    // First session: Create and save
    await page.goto('/dashboard');
    const dashboard = new DashboardPage(page);
    await dashboard.switchToTemplates();
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    await editor.setProjectTitle('Persistent Design');

    // Add text
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();
    const addHeading = page.getByTestId('add-heading-btn');
    await addHeading.click();
    await page.waitForTimeout(500);

    // Save
    await editor.save();
    // Wait for store to indicate not dirty
    await page.waitForFunction(() => !(window as any).useStore.getState().hasUnsavedChanges, { timeout: 10000 });
    const projectId = await page.evaluate(() => (window as any).useStore.getState().projectId);

    // Second session: Reload and verify
    await page.goto(`/editor?id=${projectId}`);
    await editor.waitForCanvasReady();

    // Verify title persisted via store
    const savedTitle = await page.evaluate(() => (window as any).useStore.getState().projectTitle);
    expect(savedTitle).toBe('Persistent Design');

    // Verify layer exists via store
    const layerCount = await page.evaluate(() => {
      const state = (window as any).useStore.getState();
      const artboard = state.artboards.find((a: any) => a.id === state.activeArtboardId);
      return artboard.layers.length;
    });
    expect(layerCount).toBeGreaterThan(0);
  });

  test('should handle multiple tabs workflow', async ({ page, context }) => {
    // Mock authenticated user
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
      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
      localStorage.setItem('kreathief_editor_tour_seen', 'true');
    });

    // Tab 1: Create project
    await page.goto('/dashboard');
    const dashboard1 = new DashboardPage(page);
    await dashboard1.switchToTemplates();
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();

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
    const projectCard = page2
      .locator(`button:has-text("Multi-Tab Design"), [data-testid^="project-card-"]:has-text("Multi-Tab Design")`)
      .first();
    await projectCard.click();

    const editor2 = new EditorPage(page2);
    await editor2.waitForCanvasReady();

    // Verify both tabs show same title via store
    const title2 = await page2.evaluate(() => (window as any).useStore.getState().projectTitle);
    expect(title2).toBe('Multi-Tab Design');

    // Clean up
    await page2.close();
  });
});
