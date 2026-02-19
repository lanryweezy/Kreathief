import { test, expect } from '@playwright/test';
import { EditorPage } from '../pages/EditorPage';
import { TextToolsPage } from '../pages/TextToolsPage';

test.describe('Text Tools Features', () => {
  let editor: EditorPage;
  let textTools: TextToolsPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    textTools = new TextToolsPage(page);

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

  test('should add heading text', async ({ page }) => {
    await textTools.addHeading('Test Heading');
    await textTools.verifyTextAdded();

    // Verify text is on canvas
    const textLayer = page.locator('.canvas-container .text-layer').last();
    await expect(textLayer).toContainText('Test Heading');
  });

  test('should add subheading text', async ({ page }) => {
    await textTools.addSubheading('Test Subheading');
    await textTools.verifyTextAdded();

    // Verify text content
    const textLayer = page.locator('.canvas-container .text-layer').last();
    await expect(textLayer).toContainText('Test Subheading');
  });

  test('should add body text', async ({ page }) => {
    await textTools.addBodyText('Test body text content');
    await textTools.verifyTextAdded();

    // Verify text content
    const textLayer = page.locator('.canvas-container .text-layer').last();
    await expect(textLayer).toContainText('Test body text content');
  });

  test('should change font family', async ({ page }) => {
    await textTools.addHeading('Font Test');

    // Change font
    await textTools.changeFontFamily('Arial');

    // Verify font applied (check computed style)
    const textLayer = page.locator('.canvas-container .text-layer').last();
    const fontFamily = await textLayer.evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(fontFamily).toContain('Arial');
  });

  test('should toggle bold formatting', async ({ page }) => {
    await textTools.addHeading('Bold Test');

    // Toggle bold
    await textTools.toggleBold();

    // Verify bold applied
    const textLayer = page.locator('.canvas-container .text-layer').last();
    const fontWeight = await textLayer.evaluate((el) => window.getComputedStyle(el).fontWeight);
    expect(parseInt(fontWeight)).toBeGreaterThan(400);
  });

  test('should toggle italic formatting', async ({ page }) => {
    await textTools.addHeading('Italic Test');

    // Toggle italic
    await textTools.toggleItalic();

    // Verify italic applied
    const textLayer = page.locator('.canvas-container .text-layer').last();
    const fontStyle = await textLayer.evaluate((el) => window.getComputedStyle(el).fontStyle);
    expect(fontStyle).toBe('italic');
  });

  test('should toggle underline formatting', async ({ page }) => {
    await textTools.addHeading('Underline Test');

    // Toggle underline
    await textTools.toggleUnderline();

    // Verify underline applied
    const textLayer = page.locator('.canvas-container .text-layer').last();
    const textDecoration = await textLayer.evaluate((el) => window.getComputedStyle(el).textDecoration);
    expect(textDecoration).toContain('underline');
  });

  test('should change font size', async ({ page }) => {
    await textTools.addHeading('Size Test');

    // Get initial font size
    const textLayer = page.locator('.canvas-container .text-layer').last();
    const initialSize = await textLayer.evaluate((el) => parseInt(window.getComputedStyle(el).fontSize));

    // Change font size
    await textTools.changeFontSize(48);

    // Verify size changed
    const newSize = await textLayer.evaluate((el) => parseInt(window.getComputedStyle(el).fontSize));
    expect(newSize).not.toBe(initialSize);
  });

  test('should add multiple text layers', async ({ page }) => {
    // Add heading
    await textTools.addHeading('Heading 1');
    await page.waitForTimeout(500);

    // Add subheading
    await textTools.addSubheading('Subheading 2');
    await page.waitForTimeout(500);

    // Add body text
    await textTools.addBodyText('Body 3');
    await page.waitForTimeout(500);

    // Verify all layers exist
    const textLayers = page.locator('.canvas-container .text-layer');
    await expect(textLayers).toHaveCount(3);
  });

  test('should delete text layer', async ({ page }) => {
    // Add text
    await textTools.addHeading('To Delete');
    await page.waitForTimeout(500);

    // Get initial layer count
    await editor.openLayersPanel();
    const initialCount = await editor.getLayerCount();

    // Delete the layer
    await editor.deleteLayer('To Delete');

    // Verify layer count decreased
    const finalCount = await editor.getLayerCount();
    expect(finalCount).toBeLessThan(initialCount);

    // Verify text no longer on canvas
    const textLayers = page.locator('.canvas-container .text-layer:has-text("To Delete")');
    await expect(textLayers).toHaveCount(0);
  });

  test('should apply text color', async ({ page }) => {
    await textTools.addHeading('Color Test');

    // Change color (if color picker available)
    if (await textTools.colorPicker.isVisible()) {
      await textTools.colorPicker.fill('#ff0000');

      // Verify color applied
      const textLayer = page.locator('.canvas-container .text-layer').last();
      const color = await textLayer.evaluate((el) => window.getComputedStyle(el).color);
      // RGB for red
      expect(color).toMatch(/rgb\(255,\s*0,\s*0\)/);
    }
  });
});
