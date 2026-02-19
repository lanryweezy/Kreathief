import { Page, Locator, expect } from '@playwright/test';

export class LayersPanelPage {
  readonly page: Page;
  readonly layersTab: Locator;
  readonly layersPanel: Locator;
  readonly layerItems: Locator;
  readonly addLayerBtn: Locator;
  readonly deleteLayerBtn: Locator;
  readonly duplicateLayerBtn: Locator;
  readonly lockLayerBtn: Locator;
  readonly hideLayerBtn: Locator;
  readonly layerVisibilityToggles: Locator;

  constructor(page: Page) {
    this.page = page;
    this.layersTab = page.locator('#sidebar button[aria-label="Layers"], button:has-text("Layers")');
    this.layersPanel = page.locator('[data-testid="layers-panel"], .layers-panel');
    this.layerItems = this.layersPanel.locator('[data-testid="layer-item"], .layer-item');
    this.addLayerBtn = this.layersPanel.locator('button[aria-label="Add Layer"], button:has-text("Add Layer")');
    this.deleteLayerBtn = this.layersPanel.locator('button[aria-label="Delete"], button:has-text("Delete")');
    this.duplicateLayerBtn = this.layersPanel.locator('button[aria-label="Duplicate"], button:has-text("Duplicate")');
    this.lockLayerBtn = this.layersPanel.locator('button[aria-label="Lock"], button[title*="Lock"]');
    this.hideLayerBtn = this.layersPanel.locator('button[aria-label="Hide"], button[title*="Hide"]');
    this.layerVisibilityToggles = this.layersPanel.locator('[data-testid="layer-visibility"], .layer-visibility');
  }

  async openLayersPanel() {
    await this.layersTab.click();
    await expect(this.layersPanel).toBeVisible({ timeout: 5000 });
  }

  async getLayerCount(): Promise<number> {
    await this.openLayersPanel();
    return this.layerItems.count();
  }

  async getLayerNames(): Promise<string[]> {
    await this.openLayersPanel();
    const layers = this.layerItems;
    const names: string[] = [];
    const count = await layers.count();
    for (let i = 0; i < count; i++) {
      const name = await layers.nth(i).textContent();
      if (name) {
        names.push(name.trim());
      }
    }
    return names;
  }

  async selectLayer(layerName: string) {
    await this.openLayersPanel();
    const layer = this.layersPanel.locator(`text="${layerName}"`).first();
    await layer.click();
  }

  async deleteLayer(layerName: string) {
    await this.selectLayer(layerName);
    await this.deleteLayerBtn.click();
  }

  async duplicateLayer(layerName: string) {
    await this.selectLayer(layerName);
    await this.duplicateLayerBtn.click();
    await this.page.waitForTimeout(500);
  }

  async lockLayer(layerName: string) {
    await this.selectLayer(layerName);
    await this.lockLayerBtn.click();
  }

  async hideLayer(layerName: string) {
    await this.selectLayer(layerName);
    await this.hideLayerBtn.click();
  }

  async toggleLayerVisibility(layerIndex: number) {
    await this.openLayersPanel();
    const toggle = this.layerVisibilityToggles.nth(layerIndex);
    await toggle.click();
  }

  async reorderLayer(layerName: string, direction: 'up' | 'down') {
    await this.selectLayer(layerName);
    const moveBtn =
      direction === 'up'
        ? this.layersPanel.locator('button[aria-label="Move Up"], button[title*="Up"]')
        : this.layersPanel.locator('button[aria-label="Move Down"], button[title*="Down"]');
    await moveBtn.click();
  }

  async verifyLayerExists(layerName: string) {
    await this.openLayersPanel();
    const layer = this.layersPanel.locator(`text="${layerName}"`).first();
    await expect(layer).toBeVisible({ timeout: 3000 });
  }

  async verifyLayerDeleted(layerName: string) {
    await this.openLayersPanel();
    const layer = this.layersPanel.locator(`text="${layerName}"`).first();
    await expect(layer).not.toBeVisible();
  }

  async verifyLayerCount(expected: number) {
    const count = await this.getLayerCount();
    expect(count).toBe(expected);
  }

  async verifyLayerOrder(expectedOrder: string[]) {
    const names = await this.getLayerNames();
    expectedOrder.forEach((name, index) => {
      expect(names[index]).toContain(name);
    });
  }
}
