import { test, expect } from '@playwright/test';

test.describe('Phase 0 Smoke Test - 6 Core Loops', () => {
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
      }
    });

    page.on('response', (res) => {
      if (res.status() >= 400) {
        console.log(`[HTTP ${res.status()}] ${res.url()}`);
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(`[Uncaught Error] ${err.message}`);
    });

    await page.setViewportSize({ width: 1440, height: 900 });

    await page.addInitScript(() => {
      const userSession = JSON.stringify({
        id: 'qa-user',
        email: 'qa@kreathief.app',
        name: 'QA Engineer',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qa',
        plan: 'pro',
      });
      window.localStorage.setItem('kreathief_guest_session', userSession);
      window.localStorage.setItem('kreathief_qa_session', userSession);
      window.localStorage.setItem('kreathief_onboarding_seen', 'true');
      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
      localStorage.setItem('kreathief_editor_tour_seen', 'true');
      window.localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
    });
  });

  test('Complete Phase 0 Smoke Test: 1) Load without errors 2) Create project 3) Add shape, text, image 4) Move/resize/delete 5) Export PNG 6) Refresh persistence', async ({
    page,
  }) => {
    // 1. App loads without console errors
    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.canvas-container, .design-artboard').first()).toBeVisible({ timeout: 15000 });

    // Verify no fatal console errors during load
    const fatalErrors = consoleErrors.filter((e) => !e.includes('Download the React DevTools'));
    expect(fatalErrors.length, `Console errors on load: ${fatalErrors.join(', ')}`).toBe(0);

    // 2. Verify project/canvas initialized
    const initialTitle = page.getByTestId('project-title-display');
    await expect(initialTitle).toBeVisible();

    // Set custom project title
    const uniqueTitle = `Smoke Test ${Date.now()}`;
    await initialTitle.click();
    const titleInput = page.getByTestId('project-title-input');
    await titleInput.fill(uniqueTitle);
    await page.keyboard.press('Enter');
    await expect(initialTitle).toHaveText(uniqueTitle);

    // 3. Add one shape, one text layer, one image
    // Add Shape, Text, and Image layers
    await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      store.addLayer({
        id: 'smoke-shape-1',
        type: 'vector',
        name: 'Smoke Shape',
        x: 100,
        y: 100,
        width: 150,
        height: 150,
        fill: '#ff5500',
        opacity: 1,
        shapeType: 'rectangle',
      });
      store.addLayer({
        id: 'smoke-text-1',
        type: 'text',
        name: 'Smoke Text',
        text: 'Smoke Test Heading',
        x: 150,
        y: 280,
        fontSize: 32,
        fontFamily: 'Inter',
        fill: '#111111',
        width: 300,
        height: 60,
        opacity: 1,
      });
      store.addLayer({
        id: 'smoke-image-1',
        type: 'image',
        name: 'Smoke Image',
        src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%233b82f6"/></svg>',
        x: 200,
        y: 400,
        width: 200,
        height: 200,
        opacity: 1,
      });
    });
    await page.waitForTimeout(400);

    // Check layer count is at least 3
    const layers = await page.evaluate(() => {
      const state = (window as any).useStore.getState();
      const artboard = state.artboards?.[0];
      return artboard ? artboard.layers : [];
    });
    expect(layers.length).toBeGreaterThanOrEqual(3);

    // 4. Move, resize, and delete test
    // Test moving and resizing shape layer
    const shapeLayerId = layers.find((l: any) => l.type === 'vector')?.id;
    expect(shapeLayerId).toBeTruthy();

    await page.evaluate((id) => {
      (window as any).useStore.getState().updateLayer(id, {
        x: 120,
        y: 120,
        width: 180,
        height: 180,
      });
    }, shapeLayerId);

    const updatedShape = await page.evaluate((id) => {
      const artboard = (window as any).useStore.getState().artboards?.[0];
      return artboard?.layers.find((l: any) => l.id === id);
    }, shapeLayerId);

    expect(updatedShape.x).toBe(120);
    expect(updatedShape.width).toBe(180);

    // Test delete layer (delete text layer)
    const textLayerId = layers.find((l: any) => l.type === 'text')?.id;
    expect(textLayerId).toBeTruthy();

    await page.evaluate((id) => {
      (window as any).useStore.getState().deleteLayer(id);
    }, textLayerId);

    const remainingLayers = await page.evaluate(() => {
      return (window as any).useStore.getState().artboards?.[0]?.layers || [];
    });
    expect(remainingLayers.some((l: any) => l.id === textLayerId)).toBe(false);

    // 5. Export as PNG
    const exportBtn = page.getByRole('button', { name: 'Export' });
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    await page.waitForTimeout(500);

    const pngOptionBtn = page.getByTestId('export-png-btn').or(page.locator('button:has-text("PNG")')).first();
    await expect(pngOptionBtn).toBeVisible();
    await pngOptionBtn.click();

    // Verify download trigger button
    const downloadBtn = page.getByTestId('download-btn').or(page.locator('button:has-text("Download")')).first();
    await expect(downloadBtn).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 6. Save & Refresh the page — check IndexedDB persistence
    await page.evaluate(async () => {
      await (window as any).useStore.getState().saveProject();
    });
    await page.waitForTimeout(500);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('.canvas-container, .design-artboard').first()).toBeVisible({ timeout: 15000 });

    // Verify title and layers persisted after reload
    await expect(page.getByTestId('project-title-display')).toHaveText(uniqueTitle);

    const persistedLayers = await page.evaluate(() => {
      return (window as any).useStore.getState().artboards?.[0]?.layers || [];
    });
    expect(persistedLayers.length).toBe(remainingLayers.length);
    expect(persistedLayers.find((l: any) => l.id === shapeLayerId)?.width).toBe(180);
  });
});
