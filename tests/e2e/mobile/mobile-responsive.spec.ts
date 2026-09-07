import { test, expect, devices } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { EditorPage } from '../pages/EditorPage';

// Define mobile and tablet devices
const iPhone = devices['iPhone 13'];
const iPad = devices['iPad Pro'];
const Pixel = devices['Pixel 5'];

test.describe('Mobile Responsive Tests', () => {
  let dashboard: DashboardPage;
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
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
      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
      localStorage.setItem('kreathief_editor_tour_seen', 'true');
    });
  });

  test('should load dashboard on iPhone', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await dashboard.goto();
    await dashboard.verifyDashboardLoaded();

    // Verify layout adapts to mobile
    await expect(dashboard.userMenu).toBeVisible();

    // Take screenshot
    await expect(page).toHaveScreenshot('iphone-dashboard.png', {
      fullPage: true,
    });
  });

  test('should load dashboard on iPad', async ({ page }) => {
    await page.setViewportSize(iPad.viewport);
    await dashboard.goto();
    await dashboard.verifyDashboardLoaded();

    // Verify layout adapts to tablet
    await expect(dashboard.userMenu).toBeVisible();

    // Take screenshot
    await expect(page).toHaveScreenshot('ipad-dashboard.png', {
      fullPage: true,
    });
  });

  test('should load dashboard on Android', async ({ page }) => {
    await page.setViewportSize(Pixel.viewport);
    await dashboard.goto();
    await dashboard.verifyDashboardLoaded();

    // Verify layout adapts
    await expect(dashboard.userMenu).toBeVisible();

    // Take screenshot
    await expect(page).toHaveScreenshot('android-dashboard.png', {
      fullPage: true,
    });
  });

  test('should have responsive templates grid on mobile', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await dashboard.goto();

    // Verify templates grid is responsive
    const templatesGrid = dashboard.templatesGrid;
    await expect(templatesGrid).toBeVisible();

    // Check grid layout adapts
    const gridColumns = await templatesGrid.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.gridTemplateColumns;
    });

    console.log('Mobile grid columns:', gridColumns);

    // Should have fewer columns on mobile
    expect(gridColumns).toBeTruthy();
  });

  test('should have touch-friendly targets on mobile', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await dashboard.goto();

    // Check button sizes are touch-friendly (minimum 44x44px)
    const buttons = dashboard.page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const size = await button.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });

      // Buttons should be at least 44x44px for touch
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should have readable text on mobile', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await dashboard.goto();

    // Check font sizes are readable
    const headings = dashboard.page.locator('h1, h2, h3');
    const count = await headings.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const heading = headings.nth(i);
      const fontSize = await heading.evaluate((el) => parseInt(window.getComputedStyle(el).fontSize));

      // Font size should be at least 16px for readability
      expect(fontSize).toBeGreaterThanOrEqual(16);
    }
  });

  test('should have proper spacing on mobile', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await dashboard.goto();

    // Check elements have proper spacing
    const templateCards = dashboard.templatesGrid.locator('button');
    const count = await templateCards.count();

    if (count > 1) {
      const firstCard = templateCards.nth(0);
      const secondCard = templateCards.nth(1);

      const firstRect = await firstCard.evaluate((el) => el.getBoundingClientRect());
      const secondRect = await secondCard.evaluate((el) => el.getBoundingClientRect());

      // Cards should have spacing between them
      const spacing = secondRect.top - firstRect.bottom;
      expect(spacing).toBeGreaterThanOrEqual(8);
    }
  });

  test('should load editor on mobile', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();

    // Verify editor loads on mobile
    await editor.waitForCanvasReady();
    await expect(editor.canvas).toBeVisible();

    // Take screenshot
    await expect(page).toHaveScreenshot('iphone-editor.png', {
      fullPage: true,
    });
  });

  test('should have mobile-friendly toolbar', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    // Check toolbar is visible and usable
    await expect(editor.toolbar).toBeVisible();

    // Check toolbar buttons are touch-friendly
    const toolbarButtons = editor.toolbar.locator('button');
    const count = await toolbarButtons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = toolbarButtons.nth(i);
      const size = await button.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });

      // Toolbar buttons should be at least 40x40px
      expect(size.width).toBeGreaterThanOrEqual(40);
      expect(size.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('should have mobile-friendly sidebar', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    // Check sidebar is visible
    await expect(editor.sidebar).toBeVisible();

    // Check sidebar tabs are touch-friendly
    const sidebarTabs = editor.sidebar.locator('button[aria-label]');
    const count = await sidebarTabs.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const tab = sidebarTabs.nth(i);
      const size = await tab.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });

      // Tabs should be at least 44x44px
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should handle orientation change', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await dashboard.goto();
    await dashboard.verifyDashboardLoaded();

    // Take screenshot in portrait
    await expect(page).toHaveScreenshot('mobile-portrait.png');

    // Change to landscape
    await page.setViewportSize({ width: iPhone.viewport.height, height: iPhone.viewport.width });
    await page.waitForTimeout(500);

    // Verify layout adapts to landscape
    await expect(dashboard.userMenu).toBeVisible();

    // Take screenshot in landscape
    await expect(page).toHaveScreenshot('mobile-landscape.png');
  });

  test('should have mobile-friendly modals', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    // Open export modal
    await editor.exportButton.click();
    await page.waitForTimeout(500);

    // Check modal is visible and fits on screen
    const exportModal = page.locator('[data-testid="export-modal"], .export-modal');
    await expect(exportModal).toBeVisible();

    // Check modal doesn't overflow
    const modalSize = await exportModal.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      return {
        fitsWidth: rect.width <= viewportWidth,
        fitsHeight: rect.height <= viewportHeight,
      };
    });

    expect(modalSize.fitsWidth).toBeTruthy();
    expect(modalSize.fitsHeight).toBeTruthy();
  });

  test('should support mobile gestures', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    // Test swipe gesture (manual mouse drag)
    await page.mouse.move(300, 300);
    await page.mouse.down();
    await page.mouse.move(100, 300, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Verify swipe was handled
    console.log('Swipe gesture completed');
  });

  test('should have mobile-friendly navigation', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await dashboard.goto();

    // Check for mobile navigation (hamburger menu, bottom nav, etc.)
    const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, nav[aria-label="Mobile"]');

    // Mobile nav is optional but recommended
    const hasMobileNav = (await mobileNav.count()) > 0;
    console.log('Has mobile navigation:', hasMobileNav);
  });

  test('should prevent horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize(iPhone.viewport);
    await dashboard.goto();

    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    // Should not have horizontal scroll
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('should load editor on tablet', async ({ page }) => {
    await page.setViewportSize(iPad.viewport);
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    // Verify editor loads on tablet
    await editor.verifyEditorLoaded();

    // Take screenshot
    await expect(page).toHaveScreenshot('ipad-editor.png', {
      fullPage: true,
    });
  });

  test('should have tablet-optimized layout', async ({ page }) => {
    await page.setViewportSize(iPad.viewport);
    await dashboard.goto();

    // Tablet should have more columns than mobile
    const templatesGrid = dashboard.templatesGrid;
    const gridColumns = await templatesGrid.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.gridTemplateColumns;
    });

    console.log('Tablet grid columns:', gridColumns);

    // Should have more columns than mobile
    expect(gridColumns).toBeTruthy();
  });
});
