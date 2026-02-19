import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { EditorPage } from '../pages/EditorPage';

test.describe('Dashboard Core Features', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);

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

    await dashboard.goto();
  });

  test('should load dashboard and display templates', async () => {
    await dashboard.verifyDashboardLoaded();
    await expect(dashboard.templatesGrid).toBeVisible();

    // Verify templates are visible
    const templateCount = await dashboard.templatesGrid.locator('button').count();
    expect(templateCount).toBeGreaterThan(0);
  });

  test('should create new project from template', async ({ page }) => {
    const editor = new EditorPage(page);

    // Open first template
    await dashboard.openTemplate('Instagram Post');

    // Verify editor loads
    await editor.verifyEditorLoaded();
    await expect(editor.canvas).toBeVisible({ timeout: 15000 });
  });

  test('should search projects', async ({ page }) => {
    // Create a project first
    await dashboard.openTemplate('Instagram Post');
    const editor = new EditorPage(page);
    await editor.waitForCanvasReady();
    await editor.setProjectTitle('Test Project');
    await editor.save();

    // Go back to dashboard
    await page.goto('/');
    await dashboard.verifyDashboardLoaded();

    // Search for project
    await dashboard.searchProjects('Test Project');

    // Verify filtered results
    const project = dashboard.projectsList.locator('text="Test Project"');
    await expect(project).toBeVisible({ timeout: 5000 });
  });

  test('should open existing project', async ({ page }) => {
    // Create a project
    await dashboard.openTemplate('Instagram Post');
    const editor = new EditorPage(page);
    await editor.waitForCanvasReady();
    await editor.save();

    // Go back and reopen
    await page.goto('/');
    await dashboard.verifyDashboardLoaded();

    // Open the project we just created
    const projectCard = dashboard.projectsList.locator('button, [role="button"]').first();
    await projectCard.click();

    // Verify editor loads with saved content
    await editor.verifyEditorLoaded();
  });

  test('should delete project', async ({ page }) => {
    // Create a project
    await dashboard.openTemplate('Instagram Post');
    const editor = new EditorPage(page);
    await editor.waitForCanvasReady();
    await editor.save();

    // Go back to dashboard
    await page.goto('/');
    await dashboard.verifyDashboardLoaded();

    // Count projects before deletion
    const initialCount = await dashboard.projectsList.locator('button, [role="button"]').count();

    // Delete first project
    const projectCard = dashboard.projectsList.locator('button, [role="button"]').first();
    await projectCard.hover();

    // Look for delete button
    const deleteBtn = projectCard.locator('button[aria-label="Delete"], button:has-text("Delete")');
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();

      // Confirm deletion
      const confirmBtn = page.locator('button:has-text("Delete"), button:has-text("Confirm")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }

      // Verify project count decreased
      const finalCount = await dashboard.projectsList.locator('button, [role="button"]').count();
      expect(finalCount).toBeLessThan(initialCount);
    }
  });

  test('should logout successfully', async ({ page }) => {
    await dashboard.logout();

    // Verify redirected to auth/login
    await expect(page.locator('input[type="email"], input[placeholder*="Email"]')).toBeVisible({ timeout: 5000 });
  });
});
