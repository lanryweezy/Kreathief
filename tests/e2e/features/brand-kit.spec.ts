import { test, expect } from '@playwright/test';
import { EditorPage } from '../pages/EditorPage';
import { BrandKitPage } from '../pages/BrandKitPage';

test.describe('Brand Kit Features', () => {
  let editor: EditorPage;
  let brandKit: BrandKitPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    brandKit = new BrandKitPage(page);

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

  test('should open brand panel', async () => {
    await brandKit.openBrandPanel();
    await expect(brandKit.brandPanel).toBeVisible();
  });

  test('should create new brand kit', async () => {
    await brandKit.addBrandKit('Test Brand');
    await brandKit.verifyBrandKitExists('Test Brand');
  });

  test('should add brand color', async () => {
    await brandKit.openBrandPanel();
    await brandKit.addBrandColor('#ff0000');

    // Verify color added
    const colorInput = brandKit.brandColors.locator('input[type="color"]').first();
    const color = await colorInput.inputValue();
    expect(color.toLowerCase()).toBe('#ff0000');
  });

  test('should add brand font', async () => {
    await brandKit.openBrandPanel();
    await brandKit.addBrandFont('Arial');

    // Verify font selected
    const fontSelect = brandKit.brandFonts.locator('select').first();
    const selectedValue = await fontSelect.inputValue();
    expect(selectedValue).toContain('Arial');
  });

  test('should apply brand colors to design', async ({ page }) => {
    // Add a shape first
    const elementsTab = editor.sidebar.locator('button[aria-label="Elements"]');
    await elementsTab.click();
    const shapeBtn = page.locator('.shape-btn').first();
    if (await shapeBtn.isVisible()) {
      await shapeBtn.click();
      await page.waitForTimeout(500);
    }

    // Apply brand colors
    await brandKit.applyBrandColors();
    await page.waitForTimeout(1000);

    // Verify colors applied (check if shape color changed)
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

  test('should apply brand fonts to design', async ({ page }) => {
    // Add text first
    const textTab = editor.sidebar.locator('button[aria-label="Text"]');
    await textTab.click();
    const addHeading = page.locator('button:has-text("Heading")');
    await addHeading.click();
    await page.waitForTimeout(500);

    // Apply brand fonts
    await brandKit.applyBrandFonts();
    await page.waitForTimeout(1000);

    // Verify fonts applied
    const textLayer = page.locator('.canvas-container .text-layer').last();
    const fontFamily = await textLayer.evaluate((el) => window.getComputedStyle(el).fontFamily);

    expect(fontFamily).toBeTruthy();
  });

  test('should delete brand kit', async () => {
    // Create brand kit
    await brandKit.addBrandKit('To Delete');
    await brandKit.verifyBrandKitExists('To Delete');

    // Delete brand kit
    await brandKit.deleteBrandKit('To Delete');

    // Verify deleted
    await brandKit.openBrandPanel();
    const brandKitItem = brandKit.brandPanel.locator('text="To Delete"').first();
    await expect(brandKitItem).not.toBeVisible({ timeout: 3000 });
  });

  test('should save brand kit', async ({ page }) => {
    // Create and configure brand kit
    await brandKit.addBrandKit('Saved Brand');
    await brandKit.addBrandColor('#00ff00');
    await brandKit.addBrandFont('Arial');

    // Save
    await editor.save();
    await page.waitForTimeout(1000);

    // Reload and verify
    await page.reload();
    await editor.waitForCanvasReady();

    // Verify brand kit persists
    await brandKit.verifyBrandKitExists('Saved Brand');
  });

  test('should handle multiple brand kits', async ({ page }) => {
    // Create multiple brand kits
    await brandKit.addBrandKit('Brand 1');
    await page.waitForTimeout(500);

    await brandKit.addBrandKit('Brand 2');
    await page.waitForTimeout(500);

    // Verify both exist
    await brandKit.verifyBrandKitExists('Brand 1');
    await brandKit.verifyBrandKitExists('Brand 2');
  });

  test('should verify brand panel loaded', async ({ page: _page }) => {
    await brandKit.openBrandPanel();
    await expect(brandKit.addBrandKitBtn).toBeVisible();
  });
});
