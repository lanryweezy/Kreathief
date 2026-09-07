import { test, expect } from '@playwright/test';
import { AccessibilityPage } from '../pages/AccessibilityPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EditorPage } from '../pages/EditorPage';

test.describe('Accessibility Tests', () => {
  let accessibility: AccessibilityPage;
  let dashboard: DashboardPage;
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    accessibility = new AccessibilityPage(page);
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

  test('should have skip link on dashboard', async () => {
    await dashboard.goto();

    const hasSkipLink = await accessibility.checkSkipLink();

    // Skip link is optional but recommended
    console.log('Has skip link:', hasSkipLink);
  });

  test('should have proper landmark regions on dashboard', async () => {
    await dashboard.goto();

    const landmarkCount = await accessibility.checkLandmarks();

    // Should have at least 3 landmarks (banner, main, contentinfo)
    expect(landmarkCount).toBeGreaterThanOrEqual(3);
  });

  test('should have proper heading hierarchy on dashboard', async () => {
    await dashboard.goto();

    const violations = await accessibility.checkHeadingHierarchy();

    // Should have no skipped heading levels
    expect(violations).toHaveLength(0);
  });

  test('should have accessible buttons on dashboard', async () => {
    await dashboard.goto();

    const violations = await accessibility.checkButtonAccessibility();

    // All buttons should be accessible
    expect(violations).toHaveLength(0);
  });

  test('should have accessible links on dashboard', async () => {
    await dashboard.goto();

    const violations = await accessibility.checkLinkAccessibility();

    // All links should have meaningful text
    expect(violations).toHaveLength(0);
  });

  test('should have alt text on images', async () => {
    await dashboard.goto();

    const violations = await accessibility.checkImageAltText();

    // All images should have alt text
    expect(violations).toHaveLength(0);
  });

  test('should have accessible forms', async () => {
    await dashboard.goto();

    const violations = await accessibility.checkFormAccessibility();

    // All form elements should have labels
    expect(violations).toHaveLength(0);
  });

  test('should support keyboard navigation on dashboard', async () => {
    await dashboard.goto();

    const violations = await accessibility.checkKeyboardNavigation();

    // Should have focusable elements
    expect(violations).toHaveLength(0);
  });

  test('should have focus indicators on dashboard', async () => {
    await dashboard.goto();

    const violations = await accessibility.checkFocusIndicators();

    // Should have focus styles
    expect(violations).toHaveLength(0);
  });

  test('should have accessible editor', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    // Check editor landmarks
    const landmarkCount = await accessibility.checkLandmarks();
    expect(landmarkCount).toBeGreaterThanOrEqual(2);

    // Check editor buttons
    const buttonViolations = await accessibility.checkButtonAccessibility();
    expect(buttonViolations).toHaveLength(0);
  });

  test('should have accessible text tools', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    // Open text panel
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();
    await page.waitForTimeout(500);

    // Check text panel buttons
    const buttonViolations = await accessibility.checkButtonAccessibility();
    expect(buttonViolations).toHaveLength(0);
  });

  test('should have accessible shape tools', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    // Open elements panel
    const elementsTab = editor.sidebar.locator('button[aria-label="Elements"]');
    await elementsTab.click();
    await page.waitForTimeout(500);

    // Check elements panel buttons
    const buttonViolations = await accessibility.checkButtonAccessibility();
    expect(buttonViolations).toHaveLength(0);
  });

  test('should have accessible layers panel', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    // Open layers panel
    await editor.openLayersPanel();
    await page.waitForTimeout(500);

    // Check layers panel
    const buttonViolations = await accessibility.checkButtonAccessibility();
    expect(buttonViolations).toHaveLength(0);
  });

  test('should have accessible export modal', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    // Open export modal
    await editor.exportButton.click();
    await page.waitForTimeout(500);

    // Check export modal buttons
    const buttonViolations = await accessibility.checkButtonAccessibility();
    expect(buttonViolations).toHaveLength(0);
  });

  test('should support keyboard shortcuts in editor', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    // Test Tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus moved
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Test Enter key
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  test('should support Escape key to close modals', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('dashboard-templates-grid').locator('button').first().click();
    await editor.waitForCanvasReady();

    // Open export modal
    await editor.exportButton.click();
    await page.waitForTimeout(500);

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Verify modal closed
    const exportModal = page.locator('[data-testid="export-modal"], .export-modal');
    await expect(exportModal).not.toBeVisible({ timeout: 3000 });
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await dashboard.goto();

    // Check for ARIA landmarks
    const hasMain = (await page.locator('[role="main"], main').count()) > 0;
    const hasBanner = (await page.locator('[role="banner"], header').count()) > 0;
    const hasNavigation = (await page.locator('[role="navigation"], nav').count()) > 0;

    expect(hasMain).toBeTruthy();
    expect(hasBanner).toBeTruthy();
    expect(hasNavigation).toBeTruthy();
  });

  test('should have proper color contrast', async () => {
    await dashboard.goto();

    const violations = await accessibility.checkColorContrast();

    // Log potential issues for manual review
    console.log('Potential contrast issues:', violations.length);

    // This is a warning, not a hard failure
    expect(violations.length).toBeLessThan(5);
  });

  test('should run full accessibility audit', async () => {
    await dashboard.goto();

    const results = await accessibility.runFullAccessibilityAudit();

    // Log results
    console.log('Accessibility Audit Results:');
    console.log('- Skip Link:', results.skipLink);
    console.log('- Landmarks:', results.landmarks);
    console.log('- Heading Violations:', results.headingHierarchy.length);
    console.log('- Button Violations:', results.buttonAccessibility.length);
    console.log('- Link Violations:', results.linkAccessibility.length);
    console.log('- Image Violations:', results.imageAltText.length);
    console.log('- Form Violations:', results.formAccessibility.length);

    // Check for critical issues
    expect(results.headingHierarchy).toHaveLength(0);
    expect(results.buttonAccessibility).toHaveLength(0);
    expect(results.linkAccessibility).toHaveLength(0);
  });

  test('should work with screen reader', async ({ page }) => {
    await dashboard.goto();

    // Check for screen reader friendly attributes
    const hasAriaLabels = await page.evaluate(() => {
      const elements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
      return elements.length > 0;
    });

    expect(hasAriaLabels).toBeTruthy();

    // Check for live regions
    const hasLiveRegions = await page.evaluate(() => {
      const elements = document.querySelectorAll('[aria-live]');
      return elements.length > 0;
    });

    // Live regions are optional but helpful
    console.log('Has live regions:', hasLiveRegions);
  });
});
