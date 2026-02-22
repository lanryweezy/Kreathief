import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly createProjectButton: Locator;
  readonly templatesGrid: Locator;
  readonly projectsList: Locator;
  readonly searchInput: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly templatesTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createProjectButton = page.locator('button#create-btn, button:has-text("New Design")');
    this.templatesGrid = page.locator('#templates-grid');
    this.projectsList = page.locator('.grid-cols-1, .grid-cols-2, .grid-cols-3, .grid-cols-4');
    this.searchInput = page.locator('input[placeholder*="Search designs"]');
    this.userMenu = page.locator('header .profile-section, header .flex.items-center.gap-3.group');
    this.logoutButton = page.locator('button:has-text("Sign Out")');
    this.templatesTab = page.locator('button[role="tab"]:has-text("Templates")');
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.createProjectButton).toBeVisible({ timeout: 10000 });
  }

  async createNewProject() {
    await this.createProjectButton.click();
  }

  async openTemplate(templateName: string) {
    const template = this.templatesGrid.locator(`button:has-text("${templateName}")`).first();
    await template.click();
  }

  async openProject(projectName: string) {
    const project = this.projectsList.locator(`[data-testid="project-${projectName}"], text="${projectName}"`).first();
    await project.click();
  }

  async searchProjects(query: string) {
    await this.searchInput.fill(query);
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async verifyDashboardLoaded() {
    await expect(this.createProjectButton).toBeVisible();
    await expect(this.templatesGrid).toBeVisible();
  }
}
