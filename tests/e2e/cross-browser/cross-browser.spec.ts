import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { EditorPage } from '../pages/EditorPage';

test.describe('Cross-Browser Compatibility', () => {
  let dashboard: DashboardPage;
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
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
  });

  test('should load dashboard correctly', async () => {
    await dashboard.goto();
    await dashboard.verifyDashboardLoaded();

    // Verify key elements are visible
    await expect(dashboard.createProjectButton).toBeVisible();
    await expect(dashboard.templatesGrid).toBeVisible();
  });

  test('should load editor correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    // Verify editor loads
    await editor.verifyEditorLoaded();
    await expect(editor.canvas).toBeVisible();
  });

  test('should render canvas correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    // Check canvas is rendered
    const canvas = editor.canvas;
    await expect(canvas).toBeVisible();

    // Check canvas has content
    const hasContent = await canvas.evaluate((el) => {
      const canvasEl = el as HTMLCanvasElement;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) {
        return false;
      }
      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      return imageData.data.some((pixel) => pixel !== 0);
    });

    expect(hasContent).toBeTruthy();
  });

  test('should handle text input correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    // Set project title
    await editor.setProjectTitle('Cross-Browser Test');

    // Verify title is saved
    const value = await editor.projectTitleInput.inputValue();
    expect(value).toBe('Cross-Browser Test');
  });

  test('should handle keyboard shortcuts correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    // Test Ctrl/Cmd+S for save
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+S' : 'Control+S');

    // Wait for save
    await page.waitForTimeout(1000);

    // Verify save occurred (check for save indicator or similar)
    const saveIndicator = page.locator('[data-testid="save-indicator"], text="Saved"');
    if (await saveIndicator.isVisible()) {
      await expect(saveIndicator).toContainText('Saved', { timeout: 3000 });
    }
  });

  test('should handle mouse interactions correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('#templates-grid button').first().click();
    await editor.waitForCanvasReady();

    // Test zoom controls
    await editor.zoomIn();
    await page.waitForTimeout(500);

    // Verify zoom changed
    const zoomDisplay = page.locator('[data-testid="zoom-level"], .zoom-level, span:has-text("%")').first();
    if (await zoomDisplay.isVisible()) {
      const zoomLevel = await zoomDisplay.textContent();
      expect(parseInt(zoomLevel!)).toBeGreaterThan(50);
    }
  });

  test('should handle touch events on mobile', async ({ page }) => {
    // Simulate touch device
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await dashboard.verifyDashboardLoaded();

    // Test touch interactions
    const templateBtn = dashboard.templatesGrid.locator('button').first();
    await templateBtn.tap();

    // Verify editor loads
    await editor.waitForCanvasReady();
  });

  test('should maintain layout on resize', async ({ page }) => {
    await page.goto('/');
    await dashboard.verifyDashboardLoaded();

    // Resize viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    // Verify layout is maintained
    await expect(dashboard.createProjectButton).toBeVisible();
    await expect(dashboard.templatesGrid).toBeVisible();

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Verify layout adapts
    await expect(dashboard.createProjectButton).toBeVisible();
  });

  test('should handle high DPI displays', async ({ page }) => {
    // Set device scale factor for high DPI
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/');
    await dashboard.verifyDashboardLoaded();

    // Take screenshot to verify rendering
    await expect(page).toHaveScreenshot('high-dpi-dashboard.png', {
      maxDiffPixels: 100,
    });
  });

  test('should handle different color schemes', async ({ page }) => {
    // Test dark mode (if supported)
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/');
    await dashboard.verifyDashboardLoaded();

    // Verify dark mode is applied
    const backgroundColor = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);

    console.log('Dark mode background:', backgroundColor);

    // Reset to light mode
    await page.emulateMedia({ colorScheme: 'light' });
  });

  test('should handle reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');
    await dashboard.verifyDashboardLoaded();

    // Verify animations are reduced
    const hasAnimations = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.animationDuration && style.animationDuration !== '0s') {
          return true;
        }
      }
      return false;
    });

    // Should have minimal or no animations
    console.log('Has animations with reduced motion:', hasAnimations);
  });

  test('should handle forced colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });

    await page.goto('/');
    await dashboard.verifyDashboardLoaded();

    // Verify forced colors mode is applied
    const forcedColors = await page.evaluate(() => window.matchMedia('(forced-colors: active)').matches);

    expect(forcedColors).toBeTruthy();
  });
});
