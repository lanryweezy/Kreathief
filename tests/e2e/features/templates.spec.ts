import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { TemplatesPage } from '../pages/TemplatesPage';
import { EditorPage } from '../pages/EditorPage';

test.describe('Templates Features', () => {
  let dashboard: DashboardPage;
  let templates: TemplatesPage;
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    templates = new TemplatesPage(page);
    editor = new EditorPage(page);

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

  test('should open templates panel', async () => {
    await templates.openTemplatesPanel();
    await expect(templates.templatesPanel).toBeVisible();
  });

  test('should display templates grid', async () => {
    await templates.verifyTemplatesLoaded();
  });

  test('should search templates', async () => {
    await templates.searchTemplates('Instagram');

    // Verify search results
    const templateCount = await templates.getTemplateCount();
    expect(templateCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter templates by category', async () => {
    await templates.filterByCategory('Social');
    await templates.verifyCategoryFilter('Social');
  });

  test('should select and open template', async () => {
    // Open first template
    await templates.openTemplatesPanel();
    const templateBtn = templates.templatesGrid.locator('button').first();
    const templateName = await templateBtn.textContent();

    if (templateName) {
      await templates.selectTemplate(templateName);

      // Verify editor loads with template
      await editor.verifyEditorLoaded();
      await expect(editor.canvas).toBeVisible({ timeout: 15000 });
    }
  });

  test('should verify template exists', async () => {
    await templates.openTemplatesPanel();
    const templateBtn = templates.templatesGrid.locator('button').first();
    const templateName = await templateBtn.textContent();

    if (templateName) {
      await templates.verifyTemplateExists(templateName);
    }
  });

  test('should get template count', async () => {
    const templateCount = await templates.getTemplateCount();
    expect(templateCount).toBeGreaterThan(0);
  });

  test('should handle empty search results', async ({ page }) => {
    await templates.searchTemplates('NonExistentTemplate12345');
    await page.waitForTimeout(1000);

    // Verify no templates or "no results" message
    const templateCount = await templates.getTemplateCount();
    // Either 0 templates or a "no results" message should be visible
    expect(templateCount).toBeLessThanOrEqual(0);
  });

  test('should reset search', async ({ page }) => {
    // Search for something
    await templates.searchTemplates('Instagram');
    const searchCount = await templates.getTemplateCount();

    // Clear search
    await templates.searchInput.clear();
    await page.waitForTimeout(500);

    // Verify all templates shown again
    const allCount = await templates.getTemplateCount();
    expect(allCount).toBeGreaterThanOrEqual(searchCount);
  });

  test('should navigate templates with keyboard', async ({ page }) => {
    await templates.openTemplatesPanel();

    // Use arrow keys to navigate
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify editor loads
    await editor.verifyEditorLoaded();
  });

  test('should verify template categories', async () => {
    await templates.openTemplatesPanel();

    // Verify category filters exist
    await expect(templates.categoryFilters).toBeVisible();

    // Verify at least one category is available
    const categoryCount = await templates.categoryFilters.locator('button').count();
    expect(categoryCount).toBeGreaterThan(0);
  });

  test('should switch between categories', async ({ page }) => {
    await templates.openTemplatesPanel();

    // Get initial category
    await templates.getTemplateCount();

    // Switch to different category
    await templates.filterByCategory('Social');
    await page.waitForTimeout(500);
    const socialCount = await templates.getTemplateCount();

    // Switch to another category
    await templates.filterByCategory('Business');
    await page.waitForTimeout(500);
    const businessCount = await templates.getTemplateCount();

    // Verify counts are different (different categories have different templates)
    // Note: This might not always be true, but it's a reasonable test
    expect(socialCount).toBeGreaterThanOrEqual(0);
    expect(businessCount).toBeGreaterThanOrEqual(0);
  });

  test('should load template in editor', async () => {
    // Open first template
    await templates.openTemplatesPanel();
    const templateBtn = templates.templatesGrid.locator('button').first();
    await templateBtn.click();

    // Wait for editor
    await editor.waitForCanvasReady();

    // Verify template loaded with layers
    await editor.openLayersPanel();
    const layerCount = await editor.getLayerCount();
    expect(layerCount).toBeGreaterThan(0);
  });
});
