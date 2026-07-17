import { test, expect } from '@playwright/test';

test.describe('AI Generate Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'kreathief_qa_session',
        JSON.stringify({
          id: 'qa-user',
          email: 'qa@kreathief.app',
          name: 'QA Engineer',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qa',
          plan: 'pro',
        })
      );
      window.localStorage.setItem('kreathief_onboarding_seen', 'true');
    });
    await page.goto('/editor');
    await page.waitForFunction(() => (window as any).useStore !== undefined);
  });

  test('should open AI Generate modal from toolbar', async ({ page }) => {
    const aiBtn = page.getByRole('button', { name: /AI Generate/i });
    await expect(aiBtn).toBeVisible();
    await aiBtn.click();

    await expect(page.getByRole('heading', { name: 'AI Generate' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('What do you want to create?')).toBeVisible();
  });

  test('should close AI Generate modal', async ({ page }) => {
    await page.getByRole('button', { name: /AI Generate/i }).click();
    await expect(page.getByRole('heading', { name: 'AI Generate' })).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'AI Generate' })).not.toBeVisible({ timeout: 5000 });
  });

  test('should display quick start presets', async ({ page }) => {
    await page.getByRole('button', { name: /AI Generate/i }).click();
    await expect(page.getByRole('heading', { name: 'AI Generate' })).toBeVisible();

    await expect(page.getByText('Quick start')).toBeVisible();
    const presets = page.locator('.grid.grid-cols-3.gap-2 > button');
    const count = await presets.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should select a quick start preset', async ({ page }) => {
    await page.getByRole('button', { name: /AI Generate/i }).click();
    await expect(page.getByRole('heading', { name: 'AI Generate' })).toBeVisible();

    const firstPreset = page.locator('.grid.grid-cols-3.gap-2 > button').first();
    await expect(firstPreset).toBeVisible({ timeout: 10000 });
    await firstPreset.click();

    await expect(firstPreset).toHaveClass(/bg-\[#7D2AE8\]\/10/);
  });

  test('should type a prompt', async ({ page }) => {
    await page.getByRole('button', { name: /AI Generate/i }).click();
    await expect(page.getByRole('heading', { name: 'AI Generate' })).toBeVisible();

    const textarea = page.getByPlaceholder('What do you want to create?');
    await expect(textarea).toBeVisible();
    await textarea.fill('A futuristic cityscape at sunset');

    await expect(textarea).toHaveValue('A futuristic cityscape at sunset');
  });

  test('should disable Generate button without prompt', async ({ page }) => {
    await page.getByRole('button', { name: /AI Generate/i }).click();
    await expect(page.getByRole('heading', { name: 'AI Generate' })).toBeVisible();

    const generateBtn = page.getByRole('button', { name: 'Generate' });
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toBeDisabled();
  });

  test('should enable Generate button when prompt is entered', async ({ page }) => {
    await page.getByRole('button', { name: /AI Generate/i }).click();
    await expect(page.getByRole('heading', { name: 'AI Generate' })).toBeVisible();

    const textarea = page.getByPlaceholder('What do you want to create?');
    await textarea.fill('A beautiful sunset');

    const firstPreset = page.locator('.grid.grid-cols-3.gap-2 > button').first();
    await firstPreset.click();

    const generateBtn = page.getByRole('button', { name: 'Generate' });
    await expect(generateBtn).toBeEnabled();
  });

  test('should close modal when clicking backdrop', async ({ page }) => {
    await page.getByRole('button', { name: /AI Generate/i }).click();
    await expect(page.getByRole('heading', { name: 'AI Generate' })).toBeVisible();

    await page.locator('.absolute.inset-0.bg-black\\/60').click({ force: true });
    await expect(page.getByRole('heading', { name: 'AI Generate' })).not.toBeVisible({ timeout: 5000 });
  });

  test('should close modal with Escape key', async ({ page }) => {
    await page.getByRole('button', { name: /AI Generate/i }).click();
    await expect(page.getByRole('heading', { name: 'AI Generate' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'AI Generate' })).not.toBeVisible({ timeout: 5000 });
  });
});
