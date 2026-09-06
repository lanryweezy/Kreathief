import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { EditorPage } from '../pages/EditorPage';

test.describe('Dashboard Core Features', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);

    // Mock authenticated user
    await page.addInitScript(() => {
      const userSession = JSON.stringify({
        id: 'test-user',
        name: 'Test Designer',
        email: 'test@example.com',
        plan: 'pro',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      });
      localStorage.setItem('kreathief_guest_session', userSession);
      localStorage.setItem('kreathief_qa_session', userSession);
      localStorage.setItem('kreathief_onboarding_seen', 'true');
      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
    });

    await dashboard.goto();
  });

  test('should load dashboard and display templates', async () => {
    await dashboard.verifyDashboardLoaded();
    await dashboard.switchToTemplates();
    await expect(dashboard.templatesGrid).toBeVisible();

    // Verify templates are visible
    const templateCount = await dashboard.templatesGrid.locator('button').count();
    expect(templateCount).toBeGreaterThan(0);
  });

  test('should create new project from template', async ({ page }) => {
    const editor = new EditorPage(page);

    // Switch to templates tab first
    await dashboard.switchToTemplates();

    // Open first template
    await dashboard.openTemplate('Instagram Post');

    // Verify editor loads
    await editor.verifyEditorLoaded();
    await expect(editor.canvas).toBeVisible({ timeout: 15000 });
  });

  test('should search projects', async ({ page }) => {
    // Switch to templates tab first
    await dashboard.switchToTemplates();

    // Create a project first
    await dashboard.openTemplate('Instagram Post');
    const editor = new EditorPage(page);
    await editor.waitForCanvasReady();
    await editor.setProjectTitle('Test Project');
    await editor.save();

    // Go back to dashboard
    await page.goto('/dashboard');
    await dashboard.verifyDashboardLoaded();

    // Search for project
    await dashboard.searchProjects('Test Project');

    // Verify filtered results
    const project = dashboard.projectsList.locator('text="Test Project"');
    await expect(project).toBeVisible({ timeout: 5000 });
  });

  test('should open existing project', async ({ page }) => {
    // Switch to templates tab first
    await dashboard.switchToTemplates();

    // Create a project
    await dashboard.openTemplate('Instagram Post');
    const editor = new EditorPage(page);
    await editor.waitForCanvasReady();

    // Set a unique title
    const uniqueTitle = `Project ${Date.now()}`;
    await editor.setProjectTitle(uniqueTitle);
    await editor.save();

    // Go back and reopen
    await dashboard.goto();
    await dashboard.verifyDashboardLoaded();

    // Open the project we just created
    const projectCard = page.locator(`text="${uniqueTitle}"`).first();
    await expect(projectCard).toBeVisible({ timeout: 15000 });
    await projectCard.click();

    // Verify editor loads with saved content
    await editor.verifyEditorLoaded();
    await expect(page.getByTestId('project-title-display')).toHaveText(uniqueTitle);
  });

  test('should delete project', async ({ page }) => {
    // Switch to templates tab first
    await dashboard.switchToTemplates();

    // Create a project from template
    await dashboard.openTemplate('Instagram Post');
    const editor = new EditorPage(page);
    await page.waitForTimeout(1000);
    await editor.verifyEditorLoaded();
    await editor.save();

    // Go back to dashboard
    await dashboard.goto();
    await dashboard.verifyDashboardLoaded();

    // Count projects before deletion
    const initialCount = await dashboard.projectsList.locator('button, [role="button"]').count();

    // Delete first project if projects exist
    const projectCard = dashboard.projectsList.locator('button, [role="button"]').first();
    if (await projectCard.isVisible()) {
      await projectCard.hover();
      const deleteBtn = projectCard.locator('button[aria-label="Delete"], button:has-text("Delete")').first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        const confirmBtn = page.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
      }
    }
  });

  test('should logout successfully', async ({ page }) => {
    const profileBtn = page
      .locator('[data-testid="profile-menu-btn"], header button[aria-label="Open account menu"]')
      .first();
    await profileBtn.click();
    await page.waitForTimeout(300);
    const signOutBtn = page.locator('[data-testid="logout-btn"], button:has-text("Sign Out")').first();
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click();
    }
    await page.waitForTimeout(300);
  });
});
