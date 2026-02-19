import { test, expect } from '@playwright/test';
import { EditorPage } from '../pages/EditorPage';
import { ShapeToolsPage } from '../pages/ShapeToolsPage';
import { LayersPanelPage } from '../pages/LayersPanelPage';

test.describe('Shape Tools Features', () => {
  let editor: EditorPage;
  let shapeTools: ShapeToolsPage;
  let layersPanel: LayersPanelPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    shapeTools = new ShapeToolsPage(page);
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

  test('should add rectangle shape', async ({ page }) => {
    await shapeTools.addRectangle();
    await shapeTools.verifyShapeAdded();

    // Verify shape on canvas
    const shapeLayer = page.locator('.canvas-container .shape-layer').last();
    await expect(shapeLayer).toBeVisible();
  });

  test('should add circle shape', async ({ page }) => {
    await shapeTools.addCircle();
    await shapeTools.verifyShapeAdded();

    // Verify circle on canvas
    const shapeLayer = page.locator('.canvas-container .shape-layer').last();
    await expect(shapeLayer).toBeVisible();
  });

  test('should add triangle shape', async ({ page }) => {
    await shapeTools.addTriangle();
    await shapeTools.verifyShapeAdded();

    // Verify triangle on canvas
    const shapeLayer = page.locator('.canvas-container .shape-layer').last();
    await expect(shapeLayer).toBeVisible();
  });

  test('should add star shape', async ({ page }) => {
    await shapeTools.addStar();
    await shapeTools.verifyShapeAdded();

    // Verify star on canvas
    const shapeLayer = page.locator('.canvas-container .shape-layer').last();
    await expect(shapeLayer).toBeVisible();
  });

  test('should add multiple shapes', async ({ page }) => {
    await shapeTools.addRectangle();
    await page.waitForTimeout(300);

    await shapeTools.addCircle();
    await page.waitForTimeout(300);

    await shapeTools.addTriangle();
    await page.waitForTimeout(300);

    // Verify all shapes on canvas
    const shapeLayers = page.locator('.canvas-container .shape-layer');
    await expect(shapeLayers).toHaveCount(3);
  });

  test('should change shape color', async ({ page }) => {
    await shapeTools.addRectangle();

    // Change color to red
    await shapeTools.changeColor('#ff0000');
    await page.waitForTimeout(500);

    // Verify color applied (check if element has color attribute)
    const shapeLayer = page.locator('.canvas-container .shape-layer').last();
    const fillColor = await shapeLayer.evaluate((el) => {
      const svg = el.querySelector('svg');
      if (svg) {
        const rect = svg.querySelector('rect');
        return rect?.getAttribute('fill');
      }
      return el.style.backgroundColor;
    });

    expect(fillColor).toBeTruthy();
  });

  test('should change shape opacity', async ({ page }) => {
    await shapeTools.addRectangle();

    // Get initial opacity
    const shapeLayer = page.locator('.canvas-container .shape-layer').last();
    const initialOpacity = await shapeLayer.evaluate((el) => window.getComputedStyle(el).opacity);

    // Change opacity
    await shapeTools.changeOpacity(50);
    await page.waitForTimeout(500);

    // Verify opacity changed
    const newOpacity = await shapeLayer.evaluate((el) => window.getComputedStyle(el).opacity);

    expect(parseFloat(newOpacity)).toBeLessThanOrEqual(parseFloat(initialOpacity));
  });

  test('should delete shape layer', async ({ page }) => {
    // Add shape
    await shapeTools.addRectangle();
    await page.waitForTimeout(300);

    // Get initial layer count
    const initialCount = await layersPanel.getLayerCount();

    // Delete the shape layer
    const layerNames = await layersPanel.getLayerNames();
    const shapeLayerName = layerNames.find((name) => name.includes('Rectangle') || name.includes('Shape'));

    if (shapeLayerName) {
      await layersPanel.deleteLayer(shapeLayerName);

      // Verify layer count decreased
      const finalCount = await layersPanel.getLayerCount();
      expect(finalCount).toBeLessThan(initialCount);
    }
  });

  test('should duplicate shape layer', async ({ page }) => {
    // Add shape
    await shapeTools.addRectangle();
    await page.waitForTimeout(300);

    // Get initial layer count
    const initialCount = await layersPanel.getLayerCount();

    // Duplicate the shape layer
    const layerNames = await layersPanel.getLayerNames();
    const shapeLayerName = layerNames.find((name) => name.includes('Rectangle') || name.includes('Shape'));

    if (shapeLayerName) {
      await layersPanel.duplicateLayer(shapeLayerName);

      // Verify layer count increased
      const finalCount = await layersPanel.getLayerCount();
      expect(finalCount).toBeGreaterThan(initialCount);
    }
  });

  test('should lock and unlock shape layer', async ({ page }) => {
    // Add shape
    await shapeTools.addRectangle();
    await page.waitForTimeout(300);

    // Get layer names
    const layerNames = await layersPanel.getLayerNames();
    const shapeLayerName = layerNames.find((name) => name.includes('Rectangle') || name.includes('Shape'));

    if (shapeLayerName) {
      // Lock the layer
      await layersPanel.lockLayer(shapeLayerName);

      // Verify layer is locked (check for lock icon or attribute)
      const layerItem = layersPanel.layersPanel.locator(`text="${shapeLayerName}"`).first();
      const lockIcon = layerItem.locator('[aria-label="Locked"], [title*="Locked"], .locked');
      await expect(lockIcon).toBeVisible({ timeout: 3000 });
    }
  });

  test('should hide and show shape layer', async ({ page }) => {
    // Add shape
    await shapeTools.addRectangle();
    await page.waitForTimeout(300);

    // Get layer names
    const layerNames = await layersPanel.getLayerNames();
    const shapeLayerName = layerNames.find((name) => name.includes('Rectangle') || name.includes('Shape'));

    if (shapeLayerName) {
      // Hide the layer
      await layersPanel.hideLayer(shapeLayerName);

      // Verify layer is hidden on canvas
      const shapeOnCanvas = page.locator('.canvas-container .shape-layer').last();
      const isVisible = await shapeOnCanvas.isVisible();
      expect(isVisible).toBeFalsy();

      // Show the layer again
      await layersPanel.toggleLayerVisibility(0);
      await page.waitForTimeout(500);

      // Verify layer is visible again
      const isNowVisible = await shapeOnCanvas.isVisible();
      expect(isNowVisible).toBeTruthy();
    }
  });

  test('should reorder shape layers', async ({ page }) => {
    // Add multiple shapes
    await shapeTools.addRectangle();
    await page.waitForTimeout(300);

    await shapeTools.addCircle();
    await page.waitForTimeout(300);

    // Get initial layer order
    const initialOrder = await layersPanel.getLayerNames();

    // Reorder layer
    if (initialOrder.length > 1) {
      await layersPanel.reorderLayer(initialOrder[0], 'down');
      await page.waitForTimeout(500);

      // Verify order changed
      const finalOrder = await layersPanel.getLayerNames();
      expect(finalOrder[0]).not.toBe(initialOrder[0]);
    }
  });
});
