import { Page, Locator, expect } from '@playwright/test';

export class AIMagicPage {
  readonly page: Page;
  readonly magicTab: Locator;
  readonly magicPanel: Locator;
  readonly promptInput: Locator;
  readonly generateBtn: Locator;
  readonly styleSelect: Locator;
  readonly aspectRatioSelect: Locator;
  readonly generatedImages: Locator;

  constructor(page: Page) {
    this.page = page;
    this.magicTab = page.locator(
      '#sidebar button[aria-label="Magic"], button:has-text("Magic"), button:has-text("AI")'
    );
    this.magicPanel = page.locator('[data-testid="magic-panel"], .magic-panel');
    this.promptInput = this.magicPanel.locator(
      'textarea[placeholder*="Describe"], textarea[aria-label*="Prompt"], input[aria-label*="Prompt"]'
    );
    this.generateBtn = this.magicPanel.locator(
      'button:has-text("Generate"), button:has-text("Create"), button:has-text("Magic Generate")'
    );
    this.styleSelect = this.magicPanel.locator('select[aria-label*="Style"], select[aria-label*="style"]');
    this.aspectRatioSelect = this.magicPanel.locator('select[aria-label*="Aspect"], select[aria-label*="ratio"]');
    this.generatedImages = this.magicPanel.locator('[data-testid="generated-images"], .generated-images, .ai-images');
  }

  async openMagicPanel() {
    const isVisible = await this.magicPanel.isVisible();
    if (!isVisible) {
      await this.magicTab.click();
    }
    await expect(this.magicPanel).toBeVisible({ timeout: 5000 });
  }

  async enterPrompt(prompt: string) {
    await this.openMagicPanel();
    await this.promptInput.fill(prompt);
  }

  async selectStyle(style: string) {
    await this.openMagicPanel();
    await this.styleSelect.selectOption(style);
  }

  async selectAspectRatio(ratio: string) {
    await this.openMagicPanel();
    await this.aspectRatioSelect.selectOption(ratio);
  }

  async generateImage(prompt: string) {
    await this.enterPrompt(prompt);
    await this.generateBtn.click();
    // Wait for generation to complete (may take time)
    await this.page.waitForTimeout(10000);
  }

  async getGeneratedImageCount(): Promise<number> {
    await this.openMagicPanel();
    const images = this.generatedImages.locator('img, [data-testid="generated-image"]');
    return images.count();
  }

  async verifyImageGenerated() {
    await this.openMagicPanel();
    const images = this.generatedImages.locator('img, [data-testid="generated-image"]');
    await expect(images.first()).toBeVisible({ timeout: 15000 });
  }

  async applyGeneratedImage(index: number = 0) {
    await this.openMagicPanel();
    const images = this.generatedImages.locator('img, [data-testid="generated-image"]');
    const applyBtn = images.nth(index);
    await applyBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async verifyMagicPanelLoaded() {
    await this.openMagicPanel();
    await expect(this.promptInput).toBeVisible();
    await expect(this.generateBtn).toBeVisible();
  }
}
