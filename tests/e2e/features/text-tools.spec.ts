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
    await page.goto('/editor');
    await page.waitForFunction(() => (window as any).useStore !== undefined);
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

    // Verify font applied in store
    const fontFamily = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.fontFamily;
    });
    expect(fontFamily).toBe('Arial');
  });

  test('should toggle bold formatting', async ({ page }) => {
    await textTools.addHeading('Bold Test');

    // Toggle bold
    await textTools.toggleBold();

    // Verify bold applied in store
    const fontWeight = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.fontWeight;
    });
    expect(fontWeight).toBe('bold');
  });

  test('should toggle italic formatting', async ({ page }) => {
    await textTools.addHeading('Italic Test');

    // Toggle italic
    await textTools.toggleItalic();

    // Verify italic applied in store
    const fontStyle = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.fontStyle;
    });
    expect(fontStyle).toBe('italic');
  });

  test('should toggle underline formatting', async ({ page }) => {
    await textTools.addHeading('Underline Test');

    // Toggle underline
    await textTools.toggleUnderline();

    // Verify underline applied in store
    const textDecoration = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.textDecoration;
    });
    expect(textDecoration).toBe('underline');
  });

  test('should change font size', async ({ page }) => {
    await textTools.addHeading('Size Test');

    // Get initial font size
    const initialSize = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.fontSize;
    });

    // Change font size
    await textTools.changeFontSize(48);

    // Verify size changed in store
    const newSize = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.fontSize;
    });
    expect(newSize).toBe(48);
    expect(newSize).not.toBe(initialSize);
  });

  test('should add multiple text layers', async ({ page }) => {
    // Add heading
    await textTools.addHeading('Heading 1');
    await page.waitForTimeout(300);

    // Add subheading
    await textTools.addSubheading('Subheading 2');
    await page.waitForTimeout(300);

    // Add body text
    await textTools.addBodyText('Body 3');
    await page.waitForTimeout(300);

    // Verify all layers exist in store
    const count = await textTools.page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const artboard = store.artboards.find((a: any) => a.id === store.activeArtboardId);
      return artboard ? artboard.layers.length : 0;
    });
    expect(count).toBe(3);
  });

  test('should delete text layer', async ({ page }) => {
    // Add text
    await textTools.addHeading('To Delete');
    await page.waitForTimeout(300);

    // Get initial layer count from store
    const initialCount = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const artboard = store.artboards.find((a: any) => a.id === store.activeArtboardId);
      return artboard ? artboard.layers.length : 0;
    });

    // Delete the layer via store
    await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const artboard = store.artboards.find((a: any) => a.id === store.activeArtboardId);
      const layer = artboard.layers.find((l: any) => l.text === 'To Delete');
      if (layer) {
        store.deleteLayer(layer.id);
      }
    });

    // Verify layer count decreased
    const finalCount = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const artboard = store.artboards.find((a: any) => a.id === store.activeArtboardId);
      return artboard ? artboard.layers.length : 0;
    });
    expect(finalCount).toBeLessThan(initialCount);
  });

  test('should apply text color', async ({ page }) => {
    await textTools.addHeading('Color Test');

    // Change color via store
    await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      if (selectedId) {
        store.updateLayer(selectedId, { color: '#ff0000' });
      }
    });

    // Verify color applied in store
    const color = await page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
      return layer?.color;
    });
    expect(color).toBe('#ff0000');
  });
});
