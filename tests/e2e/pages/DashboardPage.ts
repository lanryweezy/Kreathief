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
    this.templatesGrid = page.getByTestId('dashboard-templates-grid');
    this.projectsList = page.locator('.grid-cols-1, .grid-cols-2, .grid-cols-3, .grid-cols-4');
    this.searchInput = page.getByTestId('dashboard-search-input');
    this.userMenu = page.locator('[data-testid="profile-menu-btn"], header button[aria-label="Open account menu"], header img[alt="Profile"]').first();
    this.logoutButton = page.locator('[data-testid="logout-btn"], button[role="menuitem"]:has-text("Sign Out"), button:has-text("Sign Out")');
    this.templatesTab = page.locator('[data-testid="nav-templates"], button:has-text("Templates")');
  }

  async goto() {
    await this.page.goto('/dashboard');
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
    await this.page.evaluate(() => {
      localStorage.removeItem('kreathief_guest_session');
      localStorage.removeItem('kreathief_qa_session');
    });
    const profileBtn = this.page.locator('[data-testid="profile-menu-btn"], header button[aria-label="Open account menu"]').first();
    if (await profileBtn.isVisible()) {
      await profileBtn.click();
      await this.page.waitForTimeout(200);
      const signOutBtn = this.page.locator('[data-testid="logout-btn"], button:has-text("Sign Out")').first();
      if (await signOutBtn.isVisible()) {
        await signOutBtn.click();
        return;
      }
    }
    await this.page.goto('/auth', { waitUntil: 'domcontentloaded' });
  }

  async verifyDashboardLoaded() {
    await expect(this.createProjectButton).toBeVisible();
  }

  async switchToTemplates() {
    await this.templatesGrid.scrollIntoViewIfNeeded();
    await expect(this.templatesGrid).toBeVisible({ timeout: 10000 });
  }

  async searchTemplates(query: string) {
    await this.switchToTemplates();
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async getTemplateCount(): Promise<number> {
    return await this.templatesGrid.locator('button, [role="button"]').count();
  }
}
