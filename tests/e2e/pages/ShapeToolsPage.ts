import { Page, Locator, expect } from '@playwright/test';

export class ShapeToolsPage {
  readonly page: Page;
  readonly elementsTab: Locator;
  readonly shapesPanel: Locator;
  readonly rectangleBtn: Locator;
  readonly circleBtn: Locator;
  readonly triangleBtn: Locator;
  readonly starBtn: Locator;
  readonly colorPicker: Locator;
  readonly opacitySlider: Locator;

  constructor(page: Page) {
    this.page = page;
    this.elementsTab = page.locator('#sidebar button[aria-label="Elements"], button:has-text("Elements")');
    this.shapesPanel = page.locator('[data-testid="elements-panel"], .elements-panel');
    this.rectangleBtn = this.shapesPanel
      .locator('button[aria-label*="Rectangle"], button:has-text("Rectangle"), .shape-btn')
      .first();
    this.circleBtn = this.shapesPanel.locator('button[aria-label*="Circle"], button:has-text("Circle")');
    this.triangleBtn = this.shapesPanel.locator('button[aria-label*="Triangle"], button:has-text("Triangle")');
    this.starBtn = this.shapesPanel.locator('button[aria-label*="Star"], button:has-text("Star")');
    this.colorPicker = this.shapesPanel.locator('input[type="color"], [data-testid="color-picker"]');
    this.opacitySlider = this.shapesPanel.locator(
      'input[type="range"][aria-label*="Opacity"], input[aria-label*="opacity"]'
    );
  }

  async openElementsPanel() {
    await this.elementsTab.click();
    await expect(this.shapesPanel).toBeVisible({ timeout: 5000 });
  }

  async addRectangle() {
    await this.openElementsPanel();
    await this.rectangleBtn.click();
    await this.page.waitForTimeout(500);
  }

  async addCircle() {
    await this.openElementsPanel();
    await this.circleBtn.click();
    await this.page.waitForTimeout(500);
  }

  async addTriangle() {
    await this.openElementsPanel();
    await this.triangleBtn.click();
    await this.page.waitForTimeout(500);
  }

  async addStar() {
    await this.openElementsPanel();
    await this.starBtn.click();
    await this.page.waitForTimeout(500);
  }

  async changeColor(color: string) {
    await this.colorPicker.fill(color);
  }

  async changeOpacity(opacity: number) {
    await this.opacitySlider.fill(opacity.toString());
  }

  async verifyShapeAdded() {
    const shapeLayer = this.page.locator('.canvas-container .shape-layer, [data-testid="shape-layer"]').last();
    await expect(shapeLayer).toBeVisible({ timeout: 5000 });
  }

  async getShapeCount(): Promise<number> {
    await this.openElementsPanel();
    const shapes = this.page.locator('.canvas-container .shape-layer, [data-testid="shape-layer"]');
    return shapes.count();
  }
}
