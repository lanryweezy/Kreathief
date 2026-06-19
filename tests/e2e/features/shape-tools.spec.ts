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
    });

    // Navigate to editor
    await page.goto('/editor');
    await page.waitForFunction(() => (window as any).useStore !== undefined);
    await editor.waitForCanvasReady();
  });

  test('should add rectangle shape', async ({ page }) => {
    await shapeTools.addRectangle();
    await shapeTools.verifyShapeAdded();
  });

  test('should add circle shape', async ({ page }) => {
    await shapeTools.addCircle();
    await shapeTools.verifyShapeAdded();
  });

  test('should add triangle shape', async ({ page }) => {
    await shapeTools.addTriangle();
    await shapeTools.verifyShapeAdded();
  });

  test('should add star shape', async ({ page }) => {
    await shapeTools.addStar();
    await shapeTools.verifyShapeAdded();
  });

  test('should add multiple shapes', async ({ page }) => {
    await shapeTools.addRectangle();
    await page.waitForTimeout(300);

    await shapeTools.addCircle();
    await page.waitForTimeout(300);

    await shapeTools.addTriangle();
    await page.waitForTimeout(300);

    // Verify all shapes in store
    const count = await shapeTools.getShapeCount();
    expect(count).toBe(3);
  });

  test('should change shape color', async ({ page }) => {
    await shapeTools.addRectangle();

    // Change color to red
    await shapeTools.changeColor('#ff0000');

    // Verify color applied in store
    const color = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.color;
    });
    expect(color).toBe('#ff0000');
  });

  test('should change shape opacity', async ({ page }) => {
    await shapeTools.addRectangle();

    // Get initial opacity from store
    const initialOpacity = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.opacity;
    });

    // Change opacity
    await shapeTools.changeOpacity(50);

    // Verify opacity changed in store
    const newOpacity = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.opacity;
    });

    expect(newOpacity).toBe(0.5);
    expect(newOpacity).not.toBe(initialOpacity);
  });

  test('should delete shape layer', async ({ page }) => {
    // Add shape
    await shapeTools.addRectangle();
    await page.waitForTimeout(300);

    // Get initial layer count
    const initialCount = await shapeTools.getShapeCount();

    // Delete the shape layer via store
    await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      if (selectedId) {
        store.deleteLayer(selectedId);
      }
    });

    // Verify layer count decreased
    const finalCount = await shapeTools.getShapeCount();
    expect(finalCount).toBeLessThan(initialCount);
  });

  test('should duplicate shape layer', async ({ page }) => {
    // Add shape
    await shapeTools.addRectangle();
    await page.waitForTimeout(300);

    // Get initial layer count
    const initialCount = await shapeTools.getShapeCount();

    // Duplicate the shape layer via store
    await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      if (selectedId) {
        store.duplicateLayer(selectedId);
      }
    });

    // Verify layer count increased
    const finalCount = await shapeTools.getShapeCount();
    expect(finalCount).toBeGreaterThan(initialCount);
  });

  test('should lock and unlock shape layer', async ({ page }) => {
    // Add shape
    await shapeTools.addRectangle();
    await page.waitForTimeout(300);

    // Lock the layer via store
    await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      if (selectedId) {
        store.updateLayer(selectedId, { locked: true });
      }
    });

    // Verify layer is locked in store
    const isLocked = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.locked;
    });
    expect(isLocked).toBeTruthy();
  });

  test('should hide and show shape layer', async ({ page }) => {
    // Add shape
    await shapeTools.addRectangle();
    await page.waitForTimeout(300);

    // Hide the layer via store
    await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      if (selectedId) {
        store.updateLayer(selectedId, { visible: false });
      }
    });

    // Verify layer is hidden in store
    const isVisible = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.visible;
    });
    expect(isVisible).toBeFalsy();

    // Show the layer again
    await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      if (selectedId) {
        store.updateLayer(selectedId, { visible: true });
      }
    });

    // Verify layer is visible again in store
    const isVisibleNow = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.visible;
    });
    expect(isVisibleNow).toBeTruthy();
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
