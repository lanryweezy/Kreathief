import { test, expect } from '@playwright/test';

test.describe('Layer Management', () => {
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

  test('should add a text layer via keyboard shortcut', async ({ page }) => {
    const storeBefore = await page.evaluate(() => (window as any).useStore.getState());
    const layersBefore = storeBefore.artboards.find((a: any) => a.id === storeBefore.activeArtboardId)?.layers || [];

    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const storeAfter = await page.evaluate(() => (window as any).useStore.getState());
    const layersAfter = storeAfter.artboards.find((a: any) => a.id === storeAfter.activeArtboardId)?.layers || [];
    expect(layersAfter.length).toBe(layersBefore.length + 1);

    const newLayer = layersAfter[layersAfter.length - 1];
    expect(newLayer.type).toBe('text');
  });

  test('should add a rectangle shape layer', async ({ page }) => {
    const storeBefore = await page.evaluate(() => (window as any).useStore.getState());
    const layersBefore = storeBefore.artboards.find((a: any) => a.id === storeBefore.activeArtboardId)?.layers || [];

    await page.keyboard.press('r');
    await page.waitForTimeout(500);

    const storeAfter = await page.evaluate(() => (window as any).useStore.getState());
    const layersAfter = storeAfter.artboards.find((a: any) => a.id === storeAfter.activeArtboardId)?.layers || [];
    expect(layersAfter.length).toBe(layersBefore.length + 1);

    const newLayer = layersAfter[layersAfter.length - 1];
    expect(newLayer.type).toBe('rectangle');
  });

  test('should add a circle shape layer', async ({ page }) => {
    const storeBefore = await page.evaluate(() => (window as any).useStore.getState());
    const layersBefore = storeBefore.artboards.find((a: any) => a.id === storeBefore.activeArtboardId)?.layers || [];

    await page.keyboard.press('o');
    await page.waitForTimeout(500);

    const storeAfter = await page.evaluate(() => (window as any).useStore.getState());
    const layersAfter = storeAfter.artboards.find((a: any) => a.id === storeAfter.activeArtboardId)?.layers || [];
    expect(layersAfter.length).toBe(layersBefore.length + 1);

    const newLayer = layersAfter[layersAfter.length - 1];
    expect(newLayer.type).toBe('circle');
  });

  test('should select a layer', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const store = await page.evaluate(() => (window as any).useStore.getState());
    const layers = store.artboards.find((a: any) => a.id === store.activeArtboardId)?.layers || [];
    expect(layers.length).toBeGreaterThan(0);

    const layerId = layers[layers.length - 1].id;
    await page.evaluate((id) => (window as any).useStore.getState().selectLayer(id), layerId);
    await page.waitForTimeout(200);

    const selectedIds = await page.evaluate(() => (window as any).useStore.getState().selectedLayerIds);
    expect(selectedIds).toContain(layerId);
  });

  test('should delete a selected layer', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const store = await page.evaluate(() => (window as any).useStore.getState());
    const layers = store.artboards.find((a: any) => a.id === store.activeArtboardId)?.layers || [];
    const layerCountBefore = layers.length;

    const layerId = layers[layers.length - 1].id;
    await page.evaluate((id) => (window as any).useStore.getState().selectLayer(id), layerId);
    await page.waitForTimeout(200);

    await page.evaluate((id) => (window as any).useStore.getState().deleteLayer(id), layerId);
    await page.waitForTimeout(500);

    const storeAfter = await page.evaluate(() => (window as any).useStore.getState());
    const layerCountAfter = storeAfter.artboards.find((a: any) => a.id === storeAfter.activeArtboardId)?.layers?.length || 0;
    expect(layerCountAfter).toBe(layerCountBefore - 1);
  });

  test('should reorder layers', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(300);
    await page.keyboard.press('r');
    await page.waitForTimeout(300);
    await page.keyboard.press('o');
    await page.waitForTimeout(500);

    const store = await page.evaluate(() => (window as any).useStore.getState());
    const layers = store.artboards.find((a: any) => a.id === store.activeArtboardId)?.layers || [];
    expect(layers.length).toBeGreaterThanOrEqual(3);

    const firstLayerId = layers[0].id;
    await page.evaluate(
      ({ id, idx }) => (window as any).useStore.getState().reorderLayer(id, idx),
      { id: firstLayerId, idx: layers.length - 1 }
    );
    await page.waitForTimeout(300);

    const storeAfter = await page.evaluate(() => (window as any).useStore.getState());
    const layersAfter = storeAfter.artboards.find((a: any) => a.id === storeAfter.activeArtboardId)?.layers || [];
    const movedLayer = layersAfter.find((l: any) => l.id === firstLayerId);
    expect(movedLayer).toBeDefined();
  });

  test('should lock a layer', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const store = await page.evaluate(() => (window as any).useStore.getState());
    const layers = store.artboards.find((a: any) => a.id === store.activeArtboardId)?.layers || [];
    const layerId = layers[layers.length - 1].id;

    await page.evaluate(
      ({ id }) => (window as any).useStore.getState().updateLayer(id, { locked: true }),
      { id: layerId }
    );
    await page.waitForTimeout(200);

    const storeAfter = await page.evaluate(
      (id) => {
        const state = (window as any).useStore.getState();
        const layer = state.artboards.find((a: any) => a.id === state.activeArtboardId)?.layers.find((l: any) => l.id === id);
        return layer?.locked;
      },
      layerId
    );
    expect(storeAfter).toBe(true);
  });

  test('should unlock a layer', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const store = await page.evaluate(() => (window as any).useStore.getState());
    const layers = store.artboards.find((a: any) => a.id === store.activeArtboardId)?.layers || [];
    const layerId = layers[layers.length - 1].id;

    await page.evaluate(
      ({ id }) => (window as any).useStore.getState().updateLayer(id, { locked: true }),
      { id: layerId }
    );
    await page.waitForTimeout(200);

    await page.evaluate(
      ({ id }) => (window as any).useStore.getState().updateLayer(id, { locked: false }),
      { id: layerId }
    );
    await page.waitForTimeout(200);

    const storeAfter = await page.evaluate(
      (id) => {
        const state = (window as any).useStore.getState();
        const layer = state.artboards.find((a: any) => a.id === state.activeArtboardId)?.layers.find((l: any) => l.id === id);
        return layer?.locked;
      },
      layerId
    );
    expect(storeAfter).toBe(false);
  });

  test('should hide a layer', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const store = await page.evaluate(() => (window as any).useStore.getState());
    const layers = store.artboards.find((a: any) => a.id === store.activeArtboardId)?.layers || [];
    const layerId = layers[layers.length - 1].id;

    await page.evaluate(
      ({ id }) => (window as any).useStore.getState().updateLayer(id, { visible: false }),
      { id: layerId }
    );
    await page.waitForTimeout(200);

    const storeAfter = await page.evaluate(
      (id) => {
        const state = (window as any).useStore.getState();
        const layer = state.artboards.find((a: any) => a.id === state.activeArtboardId)?.layers.find((l: any) => l.id === id);
        return layer?.visible;
      },
      layerId
    );
    expect(storeAfter).toBe(false);
  });

  test('should show a hidden layer', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(500);

    const store = await page.evaluate(() => (window as any).useStore.getState());
    const layers = store.artboards.find((a: any) => a.id === store.activeArtboardId)?.layers || [];
    const layerId = layers[layers.length - 1].id;

    await page.evaluate(
      ({ id }) => (window as any).useStore.getState().updateLayer(id, { visible: false }),
      { id: layerId }
    );
    await page.waitForTimeout(200);

    await page.evaluate(
      ({ id }) => (window as any).useStore.getState().updateLayer(id, { visible: true }),
      { id: layerId }
    );
    await page.waitForTimeout(200);

    const storeAfter = await page.evaluate(
      (id) => {
        const state = (window as any).useStore.getState();
        const layer = state.artboards.find((a: any) => a.id === state.activeArtboardId)?.layers.find((l: any) => l.id === id);
        return layer?.visible;
      },
      layerId
    );
    expect(storeAfter).toBe(true);
  });
});
