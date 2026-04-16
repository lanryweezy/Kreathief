import { test, expect } from '@playwright/test';
import { EditorPage } from '../pages/EditorPage';

test.describe('Visual Regression Tests', () => {
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

    // Navigate to editor
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();
  });

  test('should match dashboard screenshot', async ({ page }) => {
    await page.goto('/');

    // Wait for dashboard to load
    await expect(page.locator('#templates-grid')).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('dashboard-load.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match editor screenshot', async ({ page }) => {
    // Editor already loaded in beforeEach

    // Take screenshot of editor
    await expect(page).toHaveScreenshot('editor-load.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match canvas screenshot', async () => {
    // Focus on canvas area
    const canvas = editor.canvas;
    await expect(canvas).toBeVisible();

    // Take screenshot of canvas
    await expect(canvas).toHaveScreenshot('canvas-load.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match toolbar screenshot', async () => {
    const toolbar = editor.toolbar;
    await expect(toolbar).toBeVisible();

    // Take screenshot of toolbar
    await expect(toolbar).toHaveScreenshot('toolbar-load.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match sidebar screenshot', async () => {
    const sidebar = editor.sidebar;
    await expect(sidebar).toBeVisible();

    // Take screenshot of sidebar
    await expect(sidebar).toHaveScreenshot('sidebar-load.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match text panel screenshot', async ({ page }) => {
    // Open text panel
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();
    await page.waitForTimeout(500);

    // Take screenshot
    const textPanel = page.locator('[data-testid="text-panel"], .text-panel');
    await expect(textPanel).toHaveScreenshot('text-panel-load.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match elements panel screenshot', async ({ page }) => {
    // Open elements panel
    const elementsTab = editor.sidebar.locator('button[aria-label="Elements"]');
    await elementsTab.click();
    await page.waitForTimeout(500);

    // Take screenshot
    const elementsPanel = page.locator('[data-testid="elements-panel"], .elements-panel');
    await expect(elementsPanel).toHaveScreenshot('elements-panel-load.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match layers panel screenshot', async ({ page }) => {
    // Open layers panel
    await editor.openLayersPanel();
    await page.waitForTimeout(500);

    // Take screenshot
    await expect(editor.layersPanel).toHaveScreenshot('layers-panel-load.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match export modal screenshot', async ({ page }) => {
    // Open export modal
    await editor.exportButton.click();
    await page.waitForTimeout(500);

    // Take screenshot
    const exportModal = page.locator('[data-testid="export-modal"], .export-modal');
    await expect(exportModal).toHaveScreenshot('export-modal-load.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match text added screenshot', async ({ page }) => {
    // Add text
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();
    const addHeading = page.locator('button:has-text("Heading")');
    await addHeading.click();
    await page.waitForTimeout(1000);

    // Take screenshot
    await expect(page).toHaveScreenshot('text-added.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match shape added screenshot', async ({ page }) => {
    // Add shape
    const elementsTab = editor.sidebar.locator('button[aria-label="Elements"]');
    await elementsTab.click();
    const shapeBtn = page.locator('.shape-btn').first();
    if (await shapeBtn.isVisible()) {
      await shapeBtn.click();
      await page.waitForTimeout(1000);
    }

    // Take screenshot
    await expect(page).toHaveScreenshot('shape-added.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match multiple layers screenshot', async ({ page }) => {
    // Add text
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();
    await page.locator('button:has-text("Heading")').click();
    await page.waitForTimeout(500);

    // Add shape
    const elementsTab = editor.sidebar.locator('button[aria-label="Elements"]');
    await elementsTab.click();
    const shapeBtn = page.locator('.shape-btn').first();
    if (await shapeBtn.isVisible()) {
      await shapeBtn.click();
      await page.waitForTimeout(500);
    }

    // Open layers panel
    await editor.openLayersPanel();
    await page.waitForTimeout(500);

    // Take screenshot
    await expect(page).toHaveScreenshot('multiple-layers.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should detect visual changes', async ({ page }) => {
    // Take initial screenshot
    await expect(page).toHaveScreenshot('initial-state.png', {
      fullPage: true,
    });

    // Make a change
    await editor.setProjectTitle('Visual Test');
    await page.waitForTimeout(500);

    // Take another screenshot - should detect change
    await expect(page).toHaveScreenshot('after-title-change.png', {
      fullPage: true,
    });
  });

  test('should match mobile viewport screenshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload to apply viewport
    await page.reload();
    await expect(page.locator('#templates-grid')).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match tablet viewport screenshot', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Reload to apply viewport
    await page.reload();
    await expect(page.locator('#templates-grid')).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('tablet-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
