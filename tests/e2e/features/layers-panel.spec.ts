import { test, expect } from '@playwright/test';
import { EditorPage } from '../pages/EditorPage';
import { LayersPanelPage } from '../pages/LayersPanelPage';

test.describe('Layers Panel Features', () => {
  let editor: EditorPage;
  let layersPanel: LayersPanelPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    layersPanel = new LayersPanelPage(page);

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

    // Navigate to editor
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();
  });

  test('should open layers panel', async () => {
    await layersPanel.openLayersPanel();
    await expect(layersPanel.layersPanel).toBeVisible();
  });

  test('should display existing layers from template', async () => {
    const layerCount = await layersPanel.getLayerCount();
    expect(layerCount).toBeGreaterThan(0);
  });

  test('should show layer names', async () => {
    const layerNames = await layersPanel.getLayerNames();
    expect(layerNames.length).toBeGreaterThan(0);
    expect(layerNames[0]).toBeTruthy();
  });

  test('should select a layer', async () => {
    const layerNames = await layersPanel.getLayerNames();
    if (layerNames.length > 0) {
      await layersPanel.selectLayer(layerNames[0]);

      // Verify layer is selected (check for selected class or attribute)
      const layerItem = layersPanel.layersPanel.locator(`text="${layerNames[0]}"`).first();
      const isSelected = await layerItem.evaluate(
        (el) =>
          el.classList.contains('selected') ||
          el.getAttribute('data-selected') === 'true' ||
          el.getAttribute('aria-selected') === 'true'
      );
      expect(isSelected).toBeTruthy();
    }
  });

  test('should delete a layer', async () => {
    // Get initial layer count
    const initialCount = await layersPanel.getLayerCount();

    // Get layer names
    const layerNames = await layersPanel.getLayerNames();
    if (layerNames.length > 0) {
      const layerToDelete = layerNames[0];

      // Delete layer
      await layersPanel.deleteLayer(layerToDelete);

      // Verify layer count decreased
      const finalCount = await layersPanel.getLayerCount();
      expect(finalCount).toBeLessThan(initialCount);

      // Verify layer no longer exists
      await layersPanel.verifyLayerDeleted(layerToDelete);
    }
  });

  test('should duplicate a layer', async () => {
    // Get initial layer count
    const initialCount = await layersPanel.getLayerCount();

    // Get layer names
    const layerNames = await layersPanel.getLayerNames();
    if (layerNames.length > 0) {
      const layerToDuplicate = layerNames[0];

      // Duplicate layer
      await layersPanel.duplicateLayer(layerToDuplicate);

      // Verify layer count increased
      const finalCount = await layersPanel.getLayerCount();
      expect(finalCount).toBeGreaterThan(initialCount);

      // Verify duplicated layer exists (should have "Copy" in name)
      const newLayerNames = await layersPanel.getLayerNames();
      const hasCopy = newLayerNames.some((name) => name.includes('Copy'));
      expect(hasCopy).toBeTruthy();
    }
  });

  test('should lock a layer', async () => {
    const layerNames = await layersPanel.getLayerNames();
    if (layerNames.length > 0) {
      const layerToLock = layerNames[0];

      // Lock layer
      await layersPanel.lockLayer(layerToLock);

      // Verify layer is locked
      const layerItem = layersPanel.layersPanel.locator(`text="${layerToLock}"`).first();
      const lockIcon = layerItem.locator('[aria-label="Locked"], [title*="Locked"], .locked');
      await expect(lockIcon).toBeVisible({ timeout: 3000 });
    }
  });

  test('should hide a layer', async () => {
    const layerNames = await layersPanel.getLayerNames();
    if (layerNames.length > 0) {
      const layerToHide = layerNames[0];

      // Hide layer
      await layersPanel.hideLayer(layerToHide);

      // Verify layer is hidden (check for hidden icon or attribute)
      const layerItem = layersPanel.layersPanel.locator(`text="${layerToHide}"`).first();
      const hideIcon = layerItem.locator('[aria-label="Hidden"], [title*="Hidden"], .hidden');
      await expect(hideIcon).toBeVisible({ timeout: 3000 });
    }
  });

  test('should toggle layer visibility', async ({ page }) => {
    // Get initial visibility state
    const layerCount = await layersPanel.getLayerCount();
    if (layerCount > 0) {
      // Toggle visibility of first layer
      await layersPanel.toggleLayerVisibility(0);
      await page.waitForTimeout(500);

      // Toggle back
      await layersPanel.toggleLayerVisibility(0);
      await page.waitForTimeout(500);

      // Verify layers still exist
      const finalCount = await layersPanel.getLayerCount();
      expect(finalCount).toBe(layerCount);
    }
  });

  test('should reorder layers', async ({ page }) => {
    const layerNames = await layersPanel.getLayerNames();
    if (layerNames.length > 1) {
      const initialOrder = layerNames;

      // Move first layer down
      await layersPanel.reorderLayer(initialOrder[0], 'down');
      await page.waitForTimeout(500);

      // Verify order changed
      const finalOrder = await layersPanel.getLayerNames();
      expect(finalOrder[0]).not.toBe(initialOrder[0]);
    }
  });

  test('should move layer up', async ({ page }) => {
    const layerNames = await layersPanel.getLayerNames();
    if (layerNames.length > 1) {
      const initialOrder = layerNames;

      // Move last layer up
      await layersPanel.reorderLayer(initialOrder[initialOrder.length - 1], 'up');
      await page.waitForTimeout(500);

      // Verify order changed
      const finalOrder = await layersPanel.getLayerNames();
      expect(finalOrder).not.toEqual(initialOrder);
    }
  });

  test('should move layer down', async ({ page }) => {
    const layerNames = await layersPanel.getLayerNames();
    if (layerNames.length > 1) {
      const initialOrder = layerNames;

      // Move first layer down
      await layersPanel.reorderLayer(initialOrder[0], 'down');
      await page.waitForTimeout(500);

      // Verify order changed
      const finalOrder = await layersPanel.getLayerNames();
      expect(finalOrder).not.toEqual(initialOrder);
    }
  });

  test('should verify layer order', async () => {
    const layerNames = await layersPanel.getLayerNames();
    if (layerNames.length > 0) {
      // Verify order matches expected
      await layersPanel.verifyLayerOrder(layerNames.slice(0, 1));
    }
  });

  test('should handle multiple layer operations', async ({ page }) => {
    // Get initial count
    const initialCount = await layersPanel.getLayerCount();

    // Add text layer
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();
    const addHeading = editor.page.locator('button:has-text("Heading")');
    await addHeading.click();
    await page.waitForTimeout(500);

    // Verify layer added
    let count = await layersPanel.getLayerCount();
    expect(count).toBeGreaterThan(initialCount);

    // Duplicate the new layer
    const layerNames = await layersPanel.getLayerNames();
    const textLayer = layerNames.find((name) => name.includes('Heading') || name.includes('Text'));
    if (textLayer) {
      await layersPanel.duplicateLayer(textLayer);

      // Verify layer count increased again
      count = await layersPanel.getLayerCount();
      expect(count).toBeGreaterThan(initialCount + 1);
    }
  });

  test('should maintain layer order after save', async ({ page }) => {
    const layerNames = await layersPanel.getLayerNames();
    if (layerNames.length > 1) {
      // Reorder layers
      await layersPanel.reorderLayer(layerNames[0], 'down');
      await page.waitForTimeout(500);

      // Save
      await editor.save();
      await page.waitForTimeout(1000);

      // Reload
      await page.reload();
      await editor.waitForCanvasReady();

      // Verify order preserved
      const savedOrder = await layersPanel.getLayerNames();
      expect(savedOrder).not.toEqual(layerNames);
    }
  });
});
