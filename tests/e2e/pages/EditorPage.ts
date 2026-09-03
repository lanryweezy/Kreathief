import { Page, Locator, expect } from '@playwright/test';

export class EditorPage {
  readonly page: Page;
  readonly canvas: Locator;
  readonly canvasContainer: Locator;
  readonly projectTitleInput: Locator;
  readonly projectTitleDisplay: Locator;
  readonly exportButton: Locator;
  readonly layersPanel: Locator;
  readonly sidebar: Locator;
  readonly toolbar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator('.design-artboard, canvas').first();
    this.canvasContainer = page.locator('#canvas-container, .canvas-container, [data-testid="canvas-container"]');
    this.projectTitleInput = page.getByTestId('project-title-input');
    this.projectTitleDisplay = page.getByTestId('project-title-display');
    this.exportButton = page.getByRole('button', { name: 'Export' });
    this.layersPanel = page.getByTestId('layers-panel');
    this.sidebar = page.locator('#sidebar, [data-testid="sidebar"]').first();
    this.toolbar = page.getByTestId('toolbar').first();
  }

  async goto() {
    await this.page.goto('/editor');
    await this.waitForCanvasReady();
  }

  async waitForCanvasReady() {
    await expect(this.canvas).toBeVisible({ timeout: 15000 });
    // Wait for the artboard to be fully rendered
    await this.page.waitForSelector('.design-artboard', { state: 'visible', timeout: 15000 });
  }

  async setProjectTitle(title: string) {
    await expect(this.projectTitleDisplay).toBeVisible({ timeout: 5000 });
    await this.projectTitleDisplay.click();
    await this.projectTitleInput.fill(title);
    await this.page.keyboard.press('Enter');
    await expect(this.projectTitleDisplay).toHaveText(title);
  }

  async openLayersPanel() {
    const layersTab = this.page.getByRole('button', { name: 'Layers' });
    await layersTab.click();
    await this.page.waitForTimeout(500);
  }

  async getLayerCount(): Promise<number> {
    await this.openLayersPanel();
    // Wait for at least one layer to potentially exist, or just wait for the list to be stable
    await this.page.waitForTimeout(1000);
    return await this.page.locator('[data-testid="layer-item"]').count();
  }

  async export(format: 'png' | 'jpeg' | 'webp') {
    await this.exportButton.click();
    await this.page.waitForTimeout(500);
    const formatBtn = this.page.getByTestId(`export-${format}-btn`);
    await formatBtn.click();
    const downloadBtn = this.page.getByTestId('download-btn');
    await downloadBtn.click();
  }

  async verifyEditorLoaded() {
    await expect(this.canvas).toBeVisible();
    await expect(this.sidebar).toBeVisible();
  }

  async save() {
    await this.page.evaluate(async () => {
      await (window as any).useStore.getState().saveProject();
    });
  }
}
