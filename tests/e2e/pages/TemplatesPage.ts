import { Page, Locator, expect } from '@playwright/test';

export class TemplatesPage {
  readonly page: Page;
  readonly templatesTab: Locator;
  readonly templatesPanel: Locator;
  readonly templatesGrid: Locator;
  readonly searchInput: Locator;
  readonly categoryFilters: Locator;

  constructor(page: Page) {
    this.page = page;
    this.templatesTab = page.locator(
      '#sidebar button[aria-label="Designs"], button:has-text("Templates"), button:has-text("Designs")'
    );
    this.templatesPanel = page.locator('[data-testid="templates-panel"], .templates-panel');
    this.templatesGrid = this.templatesPanel.locator('#templates-grid, [data-testid="templates-grid"]');
    this.searchInput = this.templatesPanel.locator(
      'input[placeholder*="Search templates"], input[aria-label*="Search templates"]'
    );
    this.categoryFilters = this.templatesPanel.locator('[data-testid="category-filters"], .category-filters');
  }

  async openTemplatesPanel() {
    await this.templatesTab.click();
    await expect(this.templatesPanel).toBeVisible({ timeout: 5000 });
  }

  async searchTemplates(query: string) {
    await this.openTemplatesPanel();
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async filterByCategory(category: string) {
    await this.openTemplatesPanel();
    const categoryBtn = this.categoryFilters.locator(
      `button:has-text("${category}"), button[aria-label="${category}"]`
    );
    await categoryBtn.click();
    await this.page.waitForTimeout(500);
  }

  async getTemplateCount(): Promise<number> {
    await this.openTemplatesPanel();
    const templates = this.templatesGrid.locator('button, [role="button"]');
    return templates.count();
  }

  async selectTemplate(templateName: string) {
    await this.openTemplatesPanel();
    const template = this.templatesGrid.locator(`button:has-text("${templateName}")`).first();
    await template.click();
  }

  async verifyTemplateExists(templateName: string) {
    await this.openTemplatesPanel();
    const template = this.templatesGrid.locator(`button:has-text("${templateName}")`).first();
    await expect(template).toBeVisible({ timeout: 5000 });
  }

  async verifyTemplatesLoaded() {
    await this.openTemplatesPanel();
    const templateCount = await this.getTemplateCount();
    expect(templateCount).toBeGreaterThan(0);
  }

  async verifyCategoryFilter(category: string) {
    await this.openTemplatesPanel();
    const activeFilter = this.categoryFilters.locator('button.active, button[aria-pressed="true"]');
    const activeText = await activeFilter.textContent();
    expect(activeText).toContain(category);
  }
}
