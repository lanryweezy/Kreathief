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
    this.brandTab = page.getByRole('button', { name: 'Brand' });
    this.brandPanel = page.getByTestId('brand-panel');
    this.addBrandKitBtn = page.getByTestId('add-brand-kit-btn');
    this.brandColors = page.getByTestId('brand-colors-display');
    this.brandFonts = page.getByTestId('brand-fonts-display');
    this.applyColorsBtn = page.getByTestId('apply-brand-colors-btn');
    this.applyFontsBtn = page.getByTestId('apply-brand-fonts-btn');
  }

  async openBrandPanel() {
    if (!(await this.brandPanel.isVisible())) {
      await this.brandTab.click();
    }
    await expect(this.brandPanel).toBeVisible({ timeout: 5000 });
  }

  async addBrandKit(name: string) {
    await this.openBrandPanel();

    // Check if we are already in the form for a kit with this name
    const isFormVisible = await this.page.getByTestId('create-brand-kit-form').isVisible();
    if (isFormVisible) {
      const currentName = await this.page
        .getByTestId('brand-kit-name-input')
        .inputValue()
        .catch(() => '');
      if (currentName === name) {
        // Fill in brand kit name anyway to ensure it's set
        await this.page.getByTestId('brand-kit-name-input').fill(name);
      } else {
        // Clear and fill
        await this.page.getByTestId('brand-kit-name-input').fill(name);
      }
    } else {
      await this.addBrandKitBtn.click();
      await expect(this.page.getByTestId('create-brand-kit-form')).toBeVisible();
      await this.page.getByTestId('brand-kit-name-input').fill(name);
    }

    // Save
    const saveBtn = this.page.getByTestId('save-brand-kit-btn');
    await saveBtn.click();

    // Wait for the form to disappear
    await expect(this.page.getByTestId('create-brand-kit-form')).not.toBeVisible({ timeout: 5000 });
    await this.page.waitForTimeout(1000);
  }

  async addBrandColor(color: string) {
    await this.openBrandPanel();
    // Ensure the form is open
    if (!(await this.page.getByTestId('create-brand-kit-form').isVisible())) {
      await this.addBrandKitBtn.click();
    }
    const colorInput = this.page.getByTestId('brand-color-input-0');
    await expect(colorInput).toBeVisible({ timeout: 5000 });
    await colorInput.fill(color);
  }

  async addBrandFont(fontName: string) {
    await this.openBrandPanel();
    // Ensure the form is open
    if (!(await this.page.getByTestId('create-brand-kit-form').isVisible())) {
      await this.addBrandKitBtn.click();
    }
    const fontSelect = this.page.getByTestId('brand-font-heading-select');
    await expect(fontSelect).toBeVisible({ timeout: 5000 });

    // Select option by label/text as fontName might be in options
    await fontSelect.selectOption({ label: fontName });
  }

  async applyBrandColors() {
    await this.openBrandPanel();
    // Scroll into view if needed
    await this.applyColorsBtn.scrollIntoViewIfNeeded();
    await this.applyColorsBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async applyBrandFonts() {
    await this.openBrandPanel();
    // Scroll into view if needed
    await this.applyFontsBtn.scrollIntoViewIfNeeded();
    await this.applyFontsBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async verifyBrandKitExists(name: string) {
    await this.openBrandPanel();
    const testId = `brand-kit-item-${name.toLowerCase().replace(/\s+/g, '-')}`;
    const brandKit = this.page.getByTestId(testId);
    await expect(brandKit).toBeVisible({ timeout: 3000 });
  }

  async deleteBrandKit(name: string) {
    await this.openBrandPanel();
    const testId = `brand-kit-item-${name.toLowerCase().replace(/\s+/g, '-')}`;
    const brandKit = this.page.getByTestId(testId);
    await brandKit.hover();

    const deleteBtn = brandKit.getByTestId('delete-brand-kit-btn');
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await this.page.waitForTimeout(500);
    }
  }
}
