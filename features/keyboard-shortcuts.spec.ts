import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('kreathief_qa_session', JSON.stringify({
        id: 'qa-user', email: 'qa@kreathief.app', name: 'QA Engineer',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qa', plan: 'pro',
      }));
      window.localStorage.setItem('kreathief_onboarding_seen', 'true');
    });
    await page.goto('/editor');
    await page.waitForFunction(() => (window as any).useStore !== undefined);
  });

  test('should undo with Ctrl+Z', async ({ page }) => {
    const layersBtn = page.getByRole('button', { name: /^Layers$/i });
    await layersBtn.click();
    await page.waitForTimeout(500);

    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const store = await page.evaluate(() => (window as any).useStore.getState());
    const layerCountBefore = store.artboards.find((a: any) => a.id === store.activeArtboardId)?.layers?.length || 0;
    expect(layerCountBefore).toBeGreaterThan(1);

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(500);

    const storeAfter = await page.evaluate(() => (window as any).useStore.getState());
    const layerCountAfter = storeAfter.artboards.find((a: any) => a.id === storeAfter.activeArtboardId)?.layers?.length || 0;
    expect(layerCountAfter).toBeLessThan(layerCountBefore);
  });

  test('should redo with Ctrl+Y', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const storeBefore = await page.evaluate(() => (window as any).useStore.getState());
    const layerCountBefore = storeBefore.artboards.find((a: any) => a.id === storeBefore.activeArtboardId)?.layers?.length || 0;

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+y');
    await page.waitForTimeout(500);

    const storeAfter = await page.evaluate(() => (window as any).useStore.getState());
    const layerCountAfter = storeAfter.artboards.find((a: any) => a.id === storeAfter.activeArtboardId)?.layers?.length || 0;
    expect(layerCountAfter).toBe(layerCountBefore);
  });

  test('should paste layer with Ctrl+V after copy', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const storeBefore = await page.evaluate(() => (window as any).useStore.getState());
    const layersBefore = storeBefore.artboards.find((a: any) => a.id === storeBefore.activeArtboardId)?.layers || [];
    const layerCountBefore = layersBefore.length;

    if (layerCountBefore > 0) {
      const layerId = layersBefore[layersBefore.length - 1].id;
      await page.evaluate((id) => (window as any).useStore.getState().selectLayer(id), layerId);
      await page.waitForTimeout(200);

      await page.keyboard.press('Control+c');
      await page.waitForTimeout(200);
      await page.keyboard.press('Control+v');
      await page.waitForTimeout(500);

      const storeAfter = await page.evaluate(() => (window as any).useStore.getState());
      const layerCountAfter = storeAfter.artboards.find((a: any) => a.id === storeAfter.activeArtboardId)?.layers?.length || 0;
      expect(layerCountAfter).toBe(layerCountBefore + 1);
    }
  });

  test('should delete selected layer with Delete key', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const store = await page.evaluate(() => (window as any).useStore.getState());
    const layers = store.artboards.find((a: any) => a.id === store.activeArtboardId)?.layers || [];
    const layerCountBefore = layers.length;

    if (layerCountBefore > 0) {
      const layerId = layers[layers.length - 1].id;
      await page.evaluate((id) => (window as any).useStore.getState().selectLayer(id), layerId);
      await page.waitForTimeout(200);

      await page.keyboard.press('Delete');
      await page.waitForTimeout(500);

      const storeAfter = await page.evaluate(() => (window as any).useStore.getState());
      const layerCountAfter = storeAfter.artboards.find((a: any) => a.id === storeAfter.activeArtboardId)?.layers?.length || 0;
      expect(layerCountAfter).toBe(layerCountBefore - 1);
    }
  });

  test('should delete selected layer with Backspace key', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const store = await page.evaluate(() => (window as any).useStore.getState());
    const layers = store.artboards.find((a: any) => a.id === store.activeArtboardId)?.layers || [];
    const layerCountBefore = layers.length;

    if (layerCountBefore > 0) {
      const layerId = layers[layers.length - 1].id;
      await page.evaluate((id) => (window as any).useStore.getState().selectLayer(id), layerId);
      await page.waitForTimeout(200);

      await page.keyboard.press('Backspace');
      await page.waitForTimeout(500);

      const storeAfter = await page.evaluate(() => (window as any).useStore.getState());
      const layerCountAfter = storeAfter.artboards.find((a: any) => a.id === storeAfter.activeArtboardId)?.layers?.length || 0;
      expect(layerCountAfter).toBe(layerCountBefore - 1);
    }
  });

  test('should deselect all layers with Escape', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const store = await page.evaluate(() => (window as any).useStore.getState());
    const layers = store.artboards.find((a: any) => a.id === store.activeArtboardId)?.layers || [];

    if (layers.length > 0) {
      const layerId = layers[layers.length - 1].id;
      await page.evaluate((id) => (window as any).useStore.getState().selectLayer(id), layerId);
      await page.waitForTimeout(200);

      const selectedBefore = await page.evaluate(() => (window as any).useStore.getState().selectedLayerIds);
      expect(selectedBefore.length).toBeGreaterThan(0);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      const selectedAfter = await page.evaluate(() => (window as any).useStore.getState().selectedLayerIds);
      expect(selectedAfter.length).toBe(0);
    }
  });

  test('should select all layers with Ctrl+A', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(300);
    await page.keyboard.press('r');
    await page.waitForTimeout(300);
    await page.keyboard.press('o');
    await page.waitForTimeout(500);

    await page.keyboard.press('Control+a');
    await page.waitForTimeout(200);

    const selectedIds = await page.evaluate(() => (window as any).useStore.getState().selectedLayerIds);
    const layers = await page.evaluate(() => {
      const state = (window as any).useStore.getState();
      return state.artboards.find((a: any) => a.id === state.activeArtboardId)?.layers || [];
    });
    expect(selectedIds.length).toBe(layers.length);
  });

  test('should zoom with Ctrl+0 to reset to 100%', async ({ page }) => {
    const zoomBefore = await page.evaluate(() => (window as any).useStore.getState().zoom);

    await page.evaluate(() => (window as any).useStore.getState().setZoom(2));
    await page.waitForTimeout(200);

    await page.keyboard.press('Control+0');
    await page.waitForTimeout(200);

    const zoomAfter = await page.evaluate(() => (window as any).useStore.getState().zoom);
    expect(zoomAfter).toBe(1);
  });

  test('should open export modal with Ctrl+E', async ({ page }) => {
    await page.keyboard.press('Control+e');
    await page.waitForTimeout(1000);

    const exportModal = page.getByTestId('export-modal').or(page.getByText('Export Design'));
    await expect(exportModal).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Escape');
  });
});
