import { test, expect } from '@playwright/test';
import { EditorPage } from '../pages/EditorPage';

test.describe('Editor Core Features', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
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

    // Navigate to editor via template
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();
  });

  test('should load editor without errors', async ({ page }) => {
    await editor.verifyEditorLoaded();

    // Check for error overlays
    const errorOverlay = page.locator('text=Component Error, text=Error');
    await expect(errorOverlay).not.toBeVisible();

    // Verify all major sections visible
    await expect(editor.canvas).toBeVisible();
    await expect(editor.toolbar).toBeVisible();
    await expect(editor.sidebar).toBeVisible();
  });

  test('should set project title', async () => {
    const testTitle = 'My Awesome Design';
    await editor.setProjectTitle(testTitle);

    // Verify title is saved
    const value = await editor.projectTitleInput.inputValue();
    expect(value).toBe(testTitle);
  });

  test('should zoom in and out', async ({ page }) => {
    // Get initial zoom level
    const zoomDisplay = editor.page.locator('[data-testid="zoom-level"], .zoom-level, span:has-text("%")').first();
    const initialZoom = await zoomDisplay.textContent();

    // Zoom in
    await editor.zoomIn();
    await page.waitForTimeout(500);

    // Verify zoom increased
    const zoomedInZoom = await zoomDisplay.textContent();
    expect(parseInt(zoomedInZoom!)).toBeGreaterThan(parseInt(initialZoom!));

    // Zoom out
    await editor.zoomOut();
    await page.waitForTimeout(500);

    // Verify zoom decreased
    const zoomedOutZoom = await zoomDisplay.textContent();
    expect(parseInt(zoomedOutZoom!)).toBeLessThanOrEqual(parseInt(initialZoom!));
  });

  test('should save project', async ({ page }) => {
    // Make a change
    await editor.setProjectTitle('Test Save Project');

    // Save
    await editor.save();

    // Look for save confirmation
    const saveIndicator = page.locator('[data-testid="save-indicator"], text="Saved", text="Saving..."');
    if (await saveIndicator.isVisible()) {
      await expect(saveIndicator).toContainText('Saved', { timeout: 5000 });
    }

    // Reload and verify title persists
    await page.reload();
    await editor.waitForCanvasReady();
    const savedTitle = await editor.projectTitleInput.inputValue();
    expect(savedTitle).toBe('Test Save Project');
  });

  test('should toggle layers panel', async () => {
    await editor.openLayersPanel();

    // Verify layers panel is visible
    await expect(editor.layersPanel).toBeVisible({ timeout: 5000 });

    // Verify at least one layer exists (from template)
    const layerCount = await editor.getLayerCount();
    expect(layerCount).toBeGreaterThan(0);
  });

  test('should select and delete layer', async () => {
    await editor.openLayersPanel();

    // Get initial layer count
    const initialCount = await editor.getLayerCount();

    // Select first layer
    const firstLayer = editor.layersPanel.locator('[data-testid="layer-item"], .layer-item').first();
    const layerName = await firstLayer.textContent();

    if (layerName) {
      await editor.selectLayer(layerName);

      // Delete layer
      await editor.deleteLayer(layerName);

      // Verify layer count decreased
      const finalCount = await editor.getLayerCount();
      expect(finalCount).toBeLessThan(initialCount);
    }
  });

  test('should export project', async ({ page }) => {
    // Wait for any pending saves
    await page.waitForTimeout(1000);

    // Try PNG export
    await editor.export('png');

    // Wait for download
    const download = await page.waitForEvent('download', { timeout: 15000 });
    expect(download.suggestedFilename()).toContain('.png');

    // Verify file downloaded
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test Ctrl/Cmd+S for save
    await editor.setProjectTitle('Keyboard Shortcut Test');
    await page.keyboard.press('Control+S');

    // Wait for save
    await page.waitForTimeout(1000);

    // Reload and verify
    await page.reload();
    await editor.waitForCanvasReady();
    const savedTitle = await editor.projectTitleInput.inputValue();
    expect(savedTitle).toBe('Keyboard Shortcut Test');
  });

  test('should handle multiple layers', async ({ page }) => {
    // Add multiple layers by opening different tools
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();

    // Add text
    const addHeading = editor.page.locator('button:has-text("Heading"), button:has-text("Add a heading")');
    await addHeading.click();
    await page.waitForTimeout(500);

    // Add another text
    await addHeading.click();
    await page.waitForTimeout(500);

    // Verify layer count increased
    await editor.openLayersPanel();
    const layerCount = await editor.getLayerCount();
    expect(layerCount).toBeGreaterThan(1);
  });
});
