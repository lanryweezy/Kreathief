import { test, expect } from '@playwright/test';
import { EditorPage } from '../pages/EditorPage';
import { ExportPage } from '../pages/ExportPage';
import { LayersPanelPage } from '../pages/LayersPanelPage';

test.describe('Export Features', () => {
  let editor: EditorPage;
  let exportPage: ExportPage;
  let layersPanel: LayersPanelPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    exportPage = new ExportPage(page);
    layersPanel = new LayersPanelPage(page);

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
    await page.getByTestId('nav-templates').click();
    await page.waitForLoadState('networkidle');
    await page.getByTestId(/dashboard-template-btn-/).first().click();
    await editor.waitForCanvasReady();
  });

  test('should open export modal', async () => {
    await exportPage.openExportModal();
    await expect(exportPage.exportModal).toBeVisible();
  });

  test('should display all export format options', async () => {
    await exportPage.verifyExportOptions();
  });

  test('should export as PNG', async () => {
    await exportPage.exportPNG();

    // Wait for download
    const download = await exportPage.waitForDownload();

    // Verify file downloaded
    expect(download.suggestedFilename()).toContain('.png');
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should export as JPEG', async () => {
    await exportPage.exportJPEG();

    // Wait for download
    const download = await exportPage.waitForDownload();

    // Verify file downloaded
    expect(download.suggestedFilename()).toMatch(/\.jpg|\.jpeg/);
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should export as WEBP', async () => {
    await exportPage.exportWEBP();

    // Wait for download
    const download = await exportPage.waitForDownload();

    // Verify file downloaded
    expect(download.suggestedFilename()).toContain('.webp');
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should export as PDF', async () => {
    await exportPage.exportPDF();

    // Wait for download
    const download = await exportPage.waitForDownload();

    // Verify file downloaded
    expect(download.suggestedFilename()).toContain('.pdf');
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should export as PSD', async () => {
    await exportPage.exportPSD();

    // Wait for download
    const download = await exportPage.waitForDownload();

    // Verify file downloaded
    expect(download.suggestedFilename()).toContain('.psd');
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should adjust export quality', async ({ page }) => {
    await exportPage.openExportModal();

    // Set quality to 50%
    await exportPage.setQuality(50);
    await page.waitForTimeout(300);

    // Verify quality setting applied (check if slider value changed)
    const qualityValue = await exportPage.qualitySlider.evaluate((el) => (el as HTMLInputElement).value);
    expect(qualityValue).toBe('50');
  });

  test('should cancel export', async () => {
    await exportPage.openExportModal();
    await exportPage.closeExportModal();

    // Verify modal closed
    await expect(exportPage.exportModal).not.toBeVisible({ timeout: 3000 });
  });

  test('should export with multiple layers', async ({ page }) => {
    // Add text layer
    const textTab = page.getByTestId('sidebar-tab-text');
    await textTab.click();
    const addHeading = page.getByTestId('add-heading-btn');
    await addHeading.click();
    await page.waitForTimeout(500);

    // Add shape
    const elementsTab = page.getByTestId('sidebar-tab-elements');
    await elementsTab.click();
    const shapeBtn = page.getByTestId(/shape-btn-/).first();
    if (await shapeBtn.isVisible()) {
      await shapeBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify multiple layers exist
    const layerCount = await layersPanel.getLayerCount();
    expect(layerCount).toBeGreaterThan(1);

    // Export
    await exportPage.exportPNG();

    // Wait for download
    const download = await exportPage.waitForDownload();
    expect(download.suggestedFilename()).toContain('.png');
  });

  test('should export after editing', async ({ page }) => {
    // Make edits
    await editor.setProjectTitle('Export Test Design');

    // Add text
    const textTab = page.getByTestId('sidebar-tab-text');
    await textTab.click();
    await page.getByTestId('add-heading-btn').click();
    await page.waitForTimeout(500);

    // Save first
    await editor.save();
    await page.waitForTimeout(1000);

    // Export
    await exportPage.exportPNG();

    // Verify download
    const download = await exportPage.waitForDownload();
    expect(download.suggestedFilename()).toContain('.png');
  });

  test('should handle multiple exports', async () => {
    // Export as PNG
    await exportPage.exportPNG();
    const download1 = await exportPage.waitForDownload();
    expect(download1.suggestedFilename()).toContain('.png');

    // Export as JPEG
    await exportPage.exportJPEG();
    const download2 = await exportPage.waitForDownload();
    expect(download2.suggestedFilename()).toMatch(/\.jpg|\.jpeg/);

    // Export as PDF
    await exportPage.exportPDF();
    const download3 = await exportPage.waitForDownload();
    expect(download3.suggestedFilename()).toContain('.pdf');
  });

  test('should export with custom filename', async ({ page }) => {
    // Set project title
    await editor.setProjectTitle('My Custom Export');
    await page.waitForTimeout(500);

    // Export
    await exportPage.exportPNG();

    // Wait for download
    const download = await exportPage.waitForDownload();

    // Verify filename contains project title
    expect(download.suggestedFilename()).toContain('my-custom-export');
  });
});
