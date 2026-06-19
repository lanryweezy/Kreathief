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
    this.elementsTab = page.getByTestId('sidebar-tab-elements');
    this.shapesPanel = page.getByTestId('elements-panel');
    this.rectangleBtn = this.shapesPanel.getByTestId('shape-btn-square');
    this.circleBtn = this.shapesPanel.getByTestId('shape-btn-circle');
    this.triangleBtn = this.shapesPanel.getByTestId('shape-btn-triangle');
    this.starBtn = this.shapesPanel.getByTestId('shape-btn-star-5');
    this.colorPicker = this.shapesPanel.locator('input[type="color"], [data-testid="color-picker"]');
    this.opacitySlider = this.shapesPanel.locator(
      'input[type="range"][aria-label*="Opacity"], input[aria-label*="opacity"]'
    );
  }

  async openElementsPanel() {
    const isVisible = await this.shapesPanel.isVisible();
    if (!isVisible) {
      await this.elementsTab.click();
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
    await this.starBtn.waitFor({ state: 'visible' });
    await this.starBtn.click({ force: true });
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
