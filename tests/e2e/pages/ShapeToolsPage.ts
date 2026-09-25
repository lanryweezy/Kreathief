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
    this.elementsTab = page.locator('button[aria-label="Elements"]').first();
    this.shapesPanel = page.locator('[data-testid="elements-panel"]');
    this.rectangleBtn = page.locator('button[title*="Rectangle"], button[title*="Square"]').first();
    this.circleBtn = page.locator('button[title*="Circle"]').first();
    this.triangleBtn = page.locator('button[title*="Triangle"]').first();
    this.starBtn = page.locator('button[title*="Star"]').first();
    this.colorPicker = page.locator('input[type="color"], [data-testid="color-picker"]');
    this.opacitySlider = page.locator(
      'input[type="range"][aria-label*="Opacity"], input[aria-label*="opacity"]'
    );
  }

  async openElementsPanel() {
    const isVisible = await this.shapesPanel.isVisible();
    if (!isVisible) {
      await this.elementsTab.click();
      await this.page.waitForTimeout(500);
    }
    await expect(this.shapesPanel).toBeVisible({ timeout: 10000 });
  }

  async addRectangle() {
    await this.openElementsPanel();
    await this.rectangleBtn.waitFor({ state: 'visible' });
    await this.rectangleBtn.click({ force: true });
    await this.page.waitForTimeout(1000);
  }

  async addCircle() {
    await this.openElementsPanel();
    await this.circleBtn.waitFor({ state: 'visible' });
    await this.circleBtn.click({ force: true });
    await this.page.waitForTimeout(1000);
  }

  async addTriangle() {
    await this.openElementsPanel();
    await this.triangleBtn.waitFor({ state: 'visible' });
    await this.triangleBtn.click({ force: true });
    await this.page.waitForTimeout(1000);
  }

  async addStar() {
    await this.openElementsPanel();
    const shapesFilter = this.page.locator('button:has-text("Shapes & Frames")').first();
    if (await shapesFilter.isVisible()) {
      await shapesFilter.click();
      await this.page.waitForTimeout(300);
    }
    const starBtn = this.page.locator('button[title*="Star"]').first();
    await starBtn.waitFor({ state: 'visible' });
    await starBtn.click({ force: true });
    await this.page.waitForTimeout(1000);
  }

  async changeColor(color: string) {
    await this.page.evaluate((c) => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      if (selectedId) {
        store.updateLayer(selectedId, { color: c });
      }
    }, color);
  }

  async changeOpacity(opacity: number) {
    await this.page.evaluate((o) => {
      const store = (window as any).useStore.getState();
      const selectedId = store.selectedLayerIds[0];
      if (selectedId) {
        store.updateLayer(selectedId, { opacity: o / 100 });
      }
    }, opacity);
  }

  async verifyShapeAdded() {
    const hasLayer = await this.page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const artboard = store.artboards.find((a: any) => a.id === store.activeArtboardId);
      return artboard && artboard.layers.length > 0;
    });
    expect(hasLayer).toBeTruthy();
  }

  async getShapeCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const store = (window as any).useStore.getState();
      const artboard = store.artboards.find((a: any) => a.id === store.activeArtboardId);
      return artboard ? artboard.layers.length : 0;
    });
  }
}
