import { Page, Locator, expect } from '@playwright/test';

export class TextToolsPage {
  readonly page: Page;
  readonly textTab: Locator;
  readonly textPanel: Locator;
  readonly addHeadingBtn: Locator;
  readonly addSubheadingBtn: Locator;
  readonly addBodyTextBtn: Locator;
  readonly fontFamilySelect: Locator;
  readonly fontSizeInput: Locator;
  readonly colorPicker: Locator;
  readonly boldBtn: Locator;
  readonly italicBtn: Locator;
  readonly underlineBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.textTab = page.locator('#sidebar button[aria-label="Text"], button:has-text("Text")');
    this.textPanel = page.locator('[data-testid="text-panel"], .text-panel');
    this.addHeadingBtn = this.textPanel.locator('button:has-text("Heading"), button:has-text("Add a heading")');
    this.addSubheadingBtn = this.textPanel.locator('button:has-text("Subheading")');
    this.addBodyTextBtn = this.textPanel.locator('button:has-text("Body text")');
    this.fontFamilySelect = this.textPanel.locator('select[aria-label="Font family"]');
    this.fontSizeInput = this.textPanel.locator('input[aria-label="Font size"]');
    this.colorPicker = this.textPanel.locator('input[type="color"], [data-testid="color-picker"]');
    this.boldBtn = this.textPanel.locator('button[aria-label="Bold"], button[title="Bold"]');
    this.italicBtn = this.textPanel.locator('button[aria-label="Italic"]');
    this.underlineBtn = this.textPanel.locator('button[aria-label="Underline"]');
  }

  async openTextPanel() {
    await this.textTab.click();
    await expect(this.addHeadingBtn).toBeVisible({ timeout: 5000 });
  }

  async addHeading(text?: string) {
    await this.openTextPanel();
    await this.addHeadingBtn.click();
    if (text) {
      await this.page.locator('.canvas-container .text-layer:last-child').fill(text);
    }
  }

  async addSubheading(text?: string) {
    await this.openTextPanel();
    await this.addSubheadingBtn.click();
    if (text) {
      await this.page.locator('.canvas-container .text-layer:last-child').fill(text);
    }
  }

  async addBodyText(text?: string) {
    await this.openTextPanel();
    await this.addBodyTextBtn.click();
    if (text) {
      await this.page.locator('.canvas-container .text-layer:last-child').fill(text);
    }
  }

  async changeFontFamily(fontName: string) {
    await this.fontFamilySelect.selectOption(fontName);
  }

  async changeFontSize(size: number) {
    await this.fontSizeInput.fill(size.toString());
  }

  async toggleBold() {
    await this.boldBtn.click();
  }

  async toggleItalic() {
    await this.italicBtn.click();
  }

  async toggleUnderline() {
    await this.underlineBtn.click();
  }

  async verifyTextAdded() {
    const textLayer = this.page.locator('.canvas-container .text-layer, .text-layer-item').last();
    await expect(textLayer).toBeVisible({ timeout: 5000 });
  }
}
