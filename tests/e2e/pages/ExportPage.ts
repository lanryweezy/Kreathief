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
    this.exportBtn = page.locator('button:has-text("Export"), [data-testid="export-btn"]');
    this.exportModal = page.locator('[data-testid="export-modal"], .export-modal');
    this.pngBtn = page.locator('button:has-text("PNG"), [data-testid="export-png"]');
    this.jpegBtn = page.locator('button:has-text("JPG"), button:has-text("JPEG"), [data-testid="export-jpeg"]');
    this.webpBtn = page.locator('button:has-text("WEBP"), [data-testid="export-webp"]');
    this.pdfBtn = page.locator('button:has-text("PDF"), [data-testid="export-pdf"]');
    this.psdBtn = page.locator('button:has-text("PSD"), [data-testid="export-psd"]');
    this.qualitySlider = page.locator('input[type="range"][aria-label*="Quality"], input[aria-label*="quality"]');
    this.downloadBtn = page.locator('button:has-text("Download"), button:has-text("Export")');
  }

  async openExportModal() {
    await this.exportBtn.click();
    await expect(this.exportModal).toBeVisible({ timeout: 5000 });
  }

  async closeExportModal() {
    const closeBtn = this.exportModal.locator('button[aria-label="Close"], button:has-text("Cancel")');
    await closeBtn.click();
  }

  async exportPNG() {
    await this.openExportModal();
    await this.pngBtn.click();
    await this.downloadBtn.click();
  }

  async exportJPEG() {
    await this.openExportModal();
    await this.jpegBtn.click();
    await this.downloadBtn.click();
  }

  async exportWEBP() {
    await this.openExportModal();
    await this.webpBtn.click();
    await this.downloadBtn.click();
  }

  async exportPDF() {
    await this.openExportModal();
    await this.pdfBtn.click();
    await this.downloadBtn.click();
  }

  async exportPSD() {
    await this.openExportModal();
    await this.psdBtn.click();
    await this.downloadBtn.click();
  }

  async setQuality(quality: number) {
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
