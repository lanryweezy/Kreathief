import { Page, Locator, expect } from '@playwright/test';

export class EditorPage {
  readonly page: Page;
  readonly canvas: Locator;
  readonly canvasContainer: Locator;
  readonly projectTitleInput: Locator;
  readonly exportButton: Locator;
  readonly saveButton: Locator;
  readonly zoomControls: Locator;
  readonly layersPanel: Locator;
  readonly toolbar: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator('#canvas-container, canvas').first();
    this.canvasContainer = page.locator('#canvas-container, .canvas-container, [data-testid="canvas-container"]');
    this.projectTitleInput = page.locator('input#header-title, input[placeholder*="Title"], input[placeholder*="title"]').first();
    this.exportButton = page.locator('button:has-text("Export"), [data-testid="export-btn"]').first();
    this.saveButton = page.locator('button:has-text("Save"), [data-testid="save-btn"]').first();
    this.zoomControls = page.locator('[data-testid="zoom-controls"], .zoom-controls, .h-10.bg-\\[\\#1e1e1e\\]').first();
    this.layersPanel = page.locator('[data-testid="layers-panel"], .layers-panel');
    this.toolbar = page.locator('[data-testid="toolbar"], .toolbar');
    this.sidebar = page.locator('#sidebar, [data-testid="sidebar"]').first();
  }

  async goto(projectId?: string) {
    const url = projectId ? `/editor?project=${projectId}` : '/editor';
    await this.page.goto(url);
    await expect(this.canvasContainer).toBeVisible({ timeout: 15000 });
  }

  async waitForCanvasReady() {
    await expect(this.canvas).toBeVisible({ timeout: 15000 });
    await this.page.waitForTimeout(1000); // Wait for state to settle
  }

  async setProjectTitle(title: string) {
    await this.projectTitleInput.fill(title);
  }

  async zoomIn() {
    const zoomInBtn = this.page.locator('button[aria-label="Zoom In"], button:has-text("+"), .h-10.bg-\\[\\#1e1e1e\\] button').nth(1);
    await zoomInBtn.click();
  }

  async zoomOut() {
    const zoomOutBtn = this.page.locator('button[aria-label="Zoom Out"], button:has-text("-"), .h-10.bg-\\[\\#1e1e1e\\] button').first();
    await zoomOutBtn.click();
  }

  async openLayersPanel() {
    const layersTab = this.sidebar.locator('button[aria-label="Layers"], button:has-text("Layers")');
    await layersTab.click();
  }

  async getLayerCount(): Promise<number> {
    await this.openLayersPanel();
    const layers = this.layersPanel.locator('[data-testid="layer-item"], .layer-item');
    return layers.count();
  }

  async selectLayer(layerName: string) {
    const layer = this.layersPanel.locator(`text="${layerName}"`).first();
    await layer.click();
  }

  async deleteLayer(layerName: string) {
    await this.selectLayer(layerName);
    const deleteBtn = this.layersPanel.locator('button[aria-label="Delete"], button:has-text("Delete")');
    await deleteBtn.click();
  }

  async export(format: 'png' | 'jpeg' | 'webp' | 'pdf' | 'psd') {
    await this.exportButton.click();
    const formatBtn = this.page.locator(`button:has-text("${format.toUpperCase()}"), [data-testid="export-${format}"]`);
    await formatBtn.click();
  }

  async save() {
    await this.saveButton.click();
  }

  async verifyEditorLoaded() {
    await expect(this.canvasContainer).toBeVisible();
    await expect(this.toolbar).toBeVisible();
    await expect(this.sidebar).toBeVisible();
  }
}
