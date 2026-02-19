import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly createProjectButton: Locator;
  readonly templatesGrid: Locator;
  readonly projectsList: Locator;
  readonly searchInput: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createProjectButton = page.locator('button:has-text("New Design"), button:has-text("Create Project")');
    this.templatesGrid = page.locator('#templates-grid');
    this.projectsList = page.locator('#projects-list, [data-testid="projects-list"]');
    this.searchInput = page.locator('input[placeholder*="Search"], input[aria-label*="Search"]');
    this.userMenu = page.locator('[data-testid="user-menu"], button[aria-label*="User"]');
    this.logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
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
