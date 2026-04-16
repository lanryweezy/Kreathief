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
    this.textTab = page.getByTestId('sidebar-tab-text');
    this.textPanel = page.getByTestId('text-panel');
    this.addHeadingBtn = this.textPanel.getByTestId('add-heading-btn');
    this.addSubheadingBtn = this.textPanel.getByTestId('add-subheading-btn');
    this.addBodyTextBtn = this.textPanel.getByTestId('add-body-text-btn');
    this.fontFamilySelect = page.getByTitle('Font Family');
    this.fontSizeInput = page.getByTestId('compact-input-field');
    this.colorPicker = page.locator('.toolbar-container input[type="color"], .toolbar-container [data-testid="color-picker"], .fixed.bottom-8 [data-testid="color-picker"]');
    this.boldBtn = page.getByTestId('icon-button-bold');
    this.italicBtn = page.getByTestId('icon-button-italic');
    this.underlineBtn = page.getByTestId('icon-button-underline');
  }

  async openTextPanel() {
    const isVisible = await this.textPanel.isVisible();
    if (!isVisible) {
      await this.textTab.click();
    }
    await expect(this.addHeadingBtn).toBeVisible({ timeout: 10000 });
  }

  async addHeading(text?: string) {
    await this.openTextPanel();
    await this.addHeadingBtn.click();
    if (text) {
        await this.page.evaluate((t) => {
            const store = (window as any).useStore.getState();
            const artboard = store.artboards.find((a: any) => a.id === store.activeArtboardId);
            const layer = artboard.layers[artboard.layers.length - 1];
            store.updateLayer(layer.id, { text: t });
        }, text);
    }
  }

  async addSubheading(text?: string) {
    await this.openTextPanel();
    await this.addSubheadingBtn.click();
    if (text) {
        await this.page.evaluate((t) => {
            const store = (window as any).useStore.getState();
            const artboard = store.artboards.find((a: any) => a.id === store.activeArtboardId);
            const layer = artboard.layers[artboard.layers.length - 1];
            store.updateLayer(layer.id, { text: t });
        }, text);
    }
  }

  async addBodyText(text?: string) {
    await this.openTextPanel();
    await this.addBodyTextBtn.click();
    if (text) {
        await this.page.evaluate((t) => {
            const store = (window as any).useStore.getState();
            const artboard = store.artboards.find((a: any) => a.id === store.activeArtboardId);
            const layer = artboard.layers[artboard.layers.length - 1];
            store.updateLayer(layer.id, { text: t });
        }, text);
    }
  }

  async changeFontFamily(fontName: string) {
    await this.page.evaluate((f) => {
        const store = (window as any).useStore.getState();
        const selectedId = store.selectedLayerIds[0];
        if (selectedId) {
            store.updateLayer(selectedId, { fontFamily: f });
        }
    }, fontName);
  }

  async changeFontSize(size: number) {
    await this.page.evaluate((s) => {
        const store = (window as any).useStore.getState();
        const selectedId = store.selectedLayerIds[0];
        if (selectedId) {
            store.updateLayer(selectedId, { fontSize: s });
        }
    }, size);
  }

  async toggleBold() {
    await this.page.evaluate(() => {
        const store = (window as any).useStore.getState();
        const selectedId = store.selectedLayerIds[0];
        if (selectedId) {
            const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
            store.updateLayer(selectedId, { fontWeight: layer.fontWeight === 'bold' ? 'normal' : 'bold' });
        }
    });
  }

  async toggleItalic() {
    await this.page.evaluate(() => {
        const store = (window as any).useStore.getState();
        const selectedId = store.selectedLayerIds[0];
        if (selectedId) {
            const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
            store.updateLayer(selectedId, { fontStyle: layer.fontStyle === 'italic' ? 'normal' : 'italic' });
        }
    });
  }

  async toggleUnderline() {
    await this.page.evaluate(() => {
        const store = (window as any).useStore.getState();
        const selectedId = store.selectedLayerIds[0];
        if (selectedId) {
            const layer = store.artboards.flatMap((a: any) => a.layers).find((l: any) => l.id === selectedId);
            store.updateLayer(selectedId, { textDecoration: layer.textDecoration === 'underline' ? 'none' : 'underline' });
        }
    });
  }

  async verifyTextAdded() {
    const hasTextLayer = await this.page.evaluate(() => {
        const store = (window as any).useStore.getState();
        const artboard = store.artboards.find((a: any) => a.id === store.activeArtboardId);
        return artboard && artboard.layers.some((l: any) => l.type === 'text');
    });
    expect(hasTextLayer).toBeTruthy();
  }
}
