import { Page, Locator, expect } from '@playwright/test';

export class ExportPage {
  readonly page: Page;
  readonly exportBtn: Locator;
  readonly exportModal: Locator;
  readonly pngBtn: Locator;
  readonly jpegBtn: Locator;
  readonly webpBtn: Locator;
  readonly pdfBtn: Locator;
  readonly psdBtn: Locator;
  readonly qualitySlider: Locator;
  readonly downloadBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.exportBtn = page.getByTestId('export-btn');
    this.exportModal = page.getByTestId('export-modal');
    this.pngBtn = page.getByTestId('export-png-btn');
    this.jpegBtn = page.getByTestId('export-jpeg-btn');
    this.webpBtn = page.getByTestId('export-webp-btn');
    this.pdfBtn = page.getByTestId('export-pdf-btn');
    this.psdBtn = page.getByTestId('export-psd-btn');
    this.qualitySlider = page.getByTestId('export-quality-slider');
    this.downloadBtn = page.getByTestId('download-btn');
  }

  async openExportModal() {
    const isVisible = await this.exportModal.isVisible();
    if (!isVisible) {
      await this.exportBtn.click();
    }
    await expect(this.exportModal).toBeVisible({ timeout: 10000 });
    // Wait for animation
    await this.page.waitForTimeout(500);
  }

  async closeExportModal() {
    const closeBtn = this.page.getByTestId('close-export-modal');
    await closeBtn.click();
  }

  async exportPNG() {
    await this.openExportModal();
    await this.pngBtn.click();
    await this.downloadBtn.click();
    await expect(this.exportModal).not.toBeVisible({ timeout: 10000 });
  }

  async exportJPEG() {
    await this.openExportModal();
    await this.jpegBtn.click();
    await this.downloadBtn.click();
    await expect(this.exportModal).not.toBeVisible({ timeout: 10000 });
  }

  async exportWEBP() {
    await this.openExportModal();
    await this.webpBtn.click();
    await this.downloadBtn.click();
    await expect(this.exportModal).not.toBeVisible({ timeout: 10000 });
  }

  async exportPDF() {
    await this.openExportModal();
    await this.pdfBtn.click();
    await this.downloadBtn.click();
    await expect(this.exportModal).not.toBeVisible({ timeout: 10000 });
  }

  async exportPSD() {
    await this.openExportModal();
    await this.psdBtn.click();
    await this.downloadBtn.click();
    await expect(this.exportModal).not.toBeVisible({ timeout: 10000 });
  }

  async setQuality(quality: number) {
    // Quality slider only appears for JPEG and WEBP
    await this.jpegBtn.click();
    await expect(this.qualitySlider).toBeVisible();
    await this.qualitySlider.fill(quality.toString());
  }

  async waitForDownload() {
    const download = await this.page.waitForEvent('download', { timeout: 30000 });
    return download;
  }

  async verifyExportOptions() {
    await this.openExportModal();
    await expect(this.pngBtn).toBeVisible();
    await expect(this.jpegBtn).toBeVisible();
    await expect(this.webpBtn).toBeVisible();
    await expect(this.pdfBtn).toBeVisible();
    await expect(this.psdBtn).toBeVisible();
  }
}
