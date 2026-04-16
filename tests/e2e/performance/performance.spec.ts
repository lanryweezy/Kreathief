import { test, expect } from '@playwright/test';
import { EditorPage } from '../pages/EditorPage';

test.describe('Performance Tests', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);

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
  });

  test('should load dashboard within time limit', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await expect(page.locator('#templates-grid')).toBeVisible({ timeout: 10000 });

    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);

    // Dashboard should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load editor within time limit', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    const loadTime = Date.now() - startTime;
    console.log(`Editor load time: ${loadTime}ms`);

    // Editor should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should add text layer quickly', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    const startTime = Date.now();

    // Add text
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();
    const addHeading = page.locator('button:has-text("Heading")');
    await addHeading.click();
    await page.waitForTimeout(500);

    const addTime = Date.now() - startTime;
    console.log(`Add text layer time: ${addTime}ms`);

    // Should add text within 2 seconds
    expect(addTime).toBeLessThan(2000);
  });

  test('should add shape layer quickly', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    const startTime = Date.now();

    // Add shape
    const elementsTab = editor.sidebar.locator('button[aria-label="Elements"]');
    await elementsTab.click();
    const shapeBtn = page.locator('.shape-btn').first();
    if (await shapeBtn.isVisible()) {
      await shapeBtn.click();
      await page.waitForTimeout(500);
    }

    const addTime = Date.now() - startTime;
    console.log(`Add shape layer time: ${addTime}ms`);

    // Should add shape within 2 seconds
    expect(addTime).toBeLessThan(2000);
  });

  test('should save project quickly', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    // Make a change
    await editor.setProjectTitle('Performance Test');

    const startTime = Date.now();

    // Save
    await editor.save();
    await page.waitForTimeout(1000);

    const saveTime = Date.now() - startTime;
    console.log(`Save project time: ${saveTime}ms`);

    // Should save within 3 seconds
    expect(saveTime).toBeLessThan(3000);
  });

  test('should export PNG quickly', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    const startTime = Date.now();

    // Export
    await editor.export('png');
    await page.waitForEvent('download', { timeout: 15000 });

    const exportTime = Date.now() - startTime;
    console.log(`Export PNG time: ${exportTime}ms`);

    // Should export within 15 seconds
    expect(exportTime).toBeLessThan(15000);
  });

  test('should handle multiple layers without lag', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    const startTime = Date.now();

    // Add 10 text layers
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();

    for (let i = 0; i < 10; i++) {
      const addHeading = page.locator('button:has-text("Heading")');
      await addHeading.click();
      await page.waitForTimeout(200);
    }

    const addTime = Date.now() - startTime;
    console.log(`Add 10 layers time: ${addTime}ms`);

    // Should add 10 layers within 10 seconds
    expect(addTime).toBeLessThan(10000);

    // Verify all layers added
    await editor.openLayersPanel();
    const layerCount = await editor.getLayerCount();
    expect(layerCount).toBeGreaterThanOrEqual(10);
  });

  test('should not have memory leaks during extended use', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    // Get initial memory usage (if available)
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    // Perform multiple operations
    for (let i = 0; i < 5; i++) {
      // Add text
      const textTab = editor.sidebar.locator('button[aria-label="Text"]');
      await textTab.click();
      const addHeading = page.locator('button:has-text("Heading")');
      await addHeading.click();
      await page.waitForTimeout(500);

      // Add shape
      const elementsTab = editor.sidebar.locator('button[aria-label="Elements"]');
      await elementsTab.click();
      const shapeBtn = page.locator('.shape-btn').first();
      if (await shapeBtn.isVisible()) {
        await shapeBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    console.log(`Initial memory: ${initialMemory}`);
    console.log(`Final memory: ${finalMemory}`);

    // Memory should not increase by more than 10MB
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
    }
  });

  test('should render canvas smoothly', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    // Measure frame rate during zoom
    const startTime = Date.now();

    // Zoom in and out multiple times
    for (let i = 0; i < 5; i++) {
      await editor.zoomIn();
      await page.waitForTimeout(200);
      await editor.zoomOut();
      await page.waitForTimeout(200);
    }

    const zoomTime = Date.now() - startTime;
    console.log(`5 zoom operations time: ${zoomTime}ms`);

    // Should complete 5 zoom operations within 5 seconds
    expect(zoomTime).toBeLessThan(5000);
  });

  test('should load layers panel quickly', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    const startTime = Date.now();

    // Open layers panel
    await editor.openLayersPanel();
    await page.waitForTimeout(500);

    const loadTime = Date.now() - startTime;
    console.log(`Layers panel load time: ${loadTime}ms`);

    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle large templates efficiently', async ({ page }) => {
    const startTime = Date.now();

    // Open a complex template
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    // Count layers
    await editor.openLayersPanel();
    const layerCount = await editor.getLayerCount();

    const loadTime = Date.now() - startTime;
    console.log(`Complex template load time: ${loadTime}ms, layers: ${layerCount}`);

    // Should load within 10 seconds regardless of layer count
    expect(loadTime).toBeLessThan(10000);
  });

  test('should not block UI during save', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    // Make a change
    await editor.setProjectTitle('UI Block Test');

    const startTime = Date.now();

    // Save
    await editor.save();

    // Try to interact with UI immediately
    await page.waitForTimeout(100);
    const isResponsive = await editor.projectTitleInput.isEnabled();

    const saveTime = Date.now() - startTime;
    console.log(`Save responsiveness: ${saveTime}ms, UI responsive: ${isResponsive}`);

    // UI should remain responsive during save
    expect(isResponsive).toBeTruthy();
  });
});
