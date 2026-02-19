import { Page, Locator, expect } from '@playwright/test';

export class BrandKitPage {
  readonly page: Page;
  readonly brandTab: Locator;
  readonly brandPanel: Locator;
  readonly addBrandKitBtn: Locator;
  readonly brandColors: Locator;
  readonly brandFonts: Locator;
  readonly applyColorsBtn: Locator;
  readonly applyFontsBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.brandTab = page.locator('#sidebar button[aria-label="Brand"], button:has-text("Brand")');
    this.brandPanel = page.locator('[data-testid="brand-panel"], .brand-panel');
    this.addBrandKitBtn = this.brandPanel.locator('button:has-text("Add Brand Kit"), button:has-text("New Brand")');
    this.brandColors = this.brandPanel.locator('[data-testid="brand-colors"], .brand-colors');
    this.brandFonts = this.brandPanel.locator('[data-testid="brand-fonts"], .brand-fonts');
    this.applyColorsBtn = this.brandPanel.locator(
      'button:has-text("Apply Colors"), button:has-text("Apply Brand Colors")'
    );
    this.applyFontsBtn = this.brandPanel.locator(
      'button:has-text("Apply Fonts"), button:has-text("Apply Brand Fonts")'
    );
  }

  async openBrandPanel() {
    await this.brandTab.click();
    await expect(this.brandPanel).toBeVisible({ timeout: 5000 });
  }

  async addBrandKit(name: string) {
    await this.openBrandPanel();
    await this.addBrandKitBtn.click();

    // Fill in brand kit name
    const nameInput = this.page.locator('input[placeholder*="Brand Name"], input[aria-label="Brand Name"]');
    await nameInput.fill(name);

    // Save
    const saveBtn = this.page.locator('button:has-text("Save"), button:has-text("Create")');
    await saveBtn.click();
    await this.page.waitForTimeout(500);
  }

  async addBrandColor(color: string) {
    await this.openBrandPanel();
    const colorInput = this.brandColors.locator('input[type="color"]').first();
    await colorInput.fill(color);
  }

  async addBrandFont(fontName: string) {
    await this.openBrandPanel();
    const fontSelect = this.brandFonts.locator('select').first();
    await fontSelect.selectOption(fontName);
  }

  async applyBrandColors() {
    await this.openBrandPanel();
    await this.applyColorsBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async applyBrandFonts() {
    await this.openBrandPanel();
    await this.applyFontsBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async verifyBrandKitExists(name: string) {
    await this.openBrandPanel();
    const brandKit = this.brandPanel.locator(`text="${name}"`).first();
    await expect(brandKit).toBeVisible({ timeout: 3000 });
  }

  async deleteBrandKit(name: string) {
    await this.openBrandPanel();
    const brandKit = this.brandPanel.locator(`text="${name}"`).first();
    await brandKit.hover();

    const deleteBtn = brandKit.locator('button[aria-label="Delete"], button:has-text("Delete")');
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();

      // Confirm deletion
      const confirmBtn = this.page.locator('button:has-text("Delete"), button:has-text("Confirm")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }
  }
}
