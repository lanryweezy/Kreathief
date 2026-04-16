import { Page, Locator, expect } from '@playwright/test';

export class TemplatesPage {
  readonly page: Page;
  readonly templatesTab: Locator;
  readonly templatesPanel: Locator;
  readonly templatesGrid: Locator;
  readonly searchInput: Locator;
  readonly categoryFilters: Locator;

  // Dashboard specific locators
  readonly dashboardTemplatesTab: Locator;
  readonly dashboardTemplatesGrid: Locator;
  readonly dashboardSearchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    // Editor Side Panel
    this.templatesTab = page.getByTestId('sidebar-tab-templates');
    this.templatesPanel = page.getByTestId('templates-panel');
    this.templatesGrid = page.getByTestId('template-panel-grid');
    this.searchInput = page.getByTestId('template-panel-search-input');
    this.categoryFilters = page.getByTestId('template-panel-category-filters');

    // Dashboard
    this.dashboardTemplatesTab = page.getByTestId('nav-templates');
    this.dashboardTemplatesGrid = page.getByTestId('dashboard-templates-grid');
    this.dashboardSearchInput = page.getByTestId('dashboard-search-input');
  }

  async openTemplatesPanel() {
    const isVisible = await this.templatesPanel.isVisible();
    if (!isVisible) {
      await this.templatesTab.click();
    }
    await expect(this.templatesPanel).toBeVisible({ timeout: 10000 });
  }

  async searchTemplates(query: string) {
    await this.openTemplatesPanel();
    await this.searchInput.fill(query, { force: true });
    await this.page.waitForTimeout(500);
  }

  async dashboardSearch(query: string) {
    await this.dashboardTemplatesTab.click();
    await this.dashboardSearchInput.fill(query, { force: true });
    await this.page.waitForTimeout(500);
  }

  async filterByCategory(category: string) {
    await this.openTemplatesPanel();

    // Check if we need to go back to "All" first to see the category buttons
    const backBtn = this.page.getByTestId('template-panel-back-btn');
    if (await backBtn.isVisible()) {
        await backBtn.click();
        await expect(this.page.getByTestId('template-panel-category-filters')).toBeVisible();
    }

    const categoryBtn = this.page.getByTestId(`template-panel-category-btn-${category.toLowerCase()}`);
    await expect(categoryBtn).toBeVisible({ timeout: 5000 });
    await categoryBtn.click();
    await this.page.waitForTimeout(500);
  }

  async getTemplateCount(): Promise<number> {
    const templates = this.templatesGrid.locator('button, [role="button"]');
    return templates.count();
  }

  async getDashboardTemplateCount(): Promise<number> {
    const templates = this.dashboardTemplatesGrid.locator('button, [role="button"]');
    return templates.count();
  }

  async selectTemplate(templateName: string) {
    // If we're on dashboard
    if (await this.dashboardTemplatesGrid.isVisible()) {
      const template = this.dashboardTemplatesGrid.locator(`button:has-text("${templateName}")`).first();
      await template.click();
    } else {
      await this.openTemplatesPanel();
      const template = this.templatesGrid.locator(`button:has-text("${templateName}")`).first();
      await template.click();
    }
  }

  async verifyTemplateExists(templateName: string) {
    // If we're on dashboard
    if (await this.dashboardTemplatesGrid.isVisible()) {
      const template = this.dashboardTemplatesGrid.locator(`button:has-text("${templateName}")`).first();
      await expect(template).toBeVisible({ timeout: 10000 });
    } else {
      await this.openTemplatesPanel();
      const template = this.templatesGrid.locator(`button:has-text("${templateName}")`).first();
      await expect(template).toBeVisible({ timeout: 10000 });
    }
  }

  async verifyTemplatesLoaded() {
    await this.openTemplatesPanel();
    const templateCount = await this.getTemplateCount();
    expect(templateCount).toBeGreaterThan(0);
  }

  async verifyCategoryFilter(category: string) {
    await this.openTemplatesPanel();
    const categoryTitle = this.page.getByTestId('template-panel-category-title');
    await expect(categoryTitle).toContainText(category, { ignoreCase: true });
  }
}
