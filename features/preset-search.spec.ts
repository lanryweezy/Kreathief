import { test, expect } from '@playwright/test';

test.describe('Preset Search', () => {
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

  test('should filter presets by category', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible({ timeout: 10000 });

    const socialBtn = page.getByRole('button', { name: /Social/i }).first();
    await expect(socialBtn).toBeVisible();
    await socialBtn.click();

    await page.waitForTimeout(500);
    const presets = page.locator('.w-full.text-left.p-3.rounded-xl');
    const count = await presets.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should search presets by keyword', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByPlaceholder('Search workflows...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('logo');

    await page.waitForTimeout(500);
    const presets = page.locator('.w-full.text-left.p-3.rounded-xl');
    const count = await presets.count();
    expect(count).toBeGreaterThan(0);

    const presetText = await presets.first().textContent();
    expect(presetText?.toLowerCase()).toContain('logo');
  });

  test('should clear search and show all presets', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByPlaceholder('Search workflows...');
    await searchInput.fill('logo');
    await page.waitForTimeout(500);

    const filteredPresets = page.locator('.w-full.text-left.p-3.rounded-xl');
    const filteredCount = await filteredPresets.count();

    await searchInput.clear();
    await page.waitForTimeout(500);

    const allPresets = page.locator('.w-full.text-left.p-3.rounded-xl');
    const allCount = await allPresets.count();
    expect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('should show no results for invalid search', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByPlaceholder('Search workflows...');
    await searchInput.fill('xyznonexistent123');

    await page.waitForTimeout(500);
    await expect(page.getByText('No workflows found')).toBeVisible();
  });

  test('should load preset from search results', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByPlaceholder('Search workflows...');
    await searchInput.fill('sticker');
    await page.waitForTimeout(500);

    const presetCard = page.locator('.w-full.text-left.p-3.rounded-xl').first();
    await expect(presetCard).toBeVisible();
    await presetCard.click();

    await page.waitForTimeout(500);
    const statsText = page.locator('.absolute.bottom-4.left-4');
    await expect(statsText).toContainText('nodes');
  });

  test('should display workflow count in footer', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible({ timeout: 10000 });

    const footerText = page.locator('.p-2.border-t.border-white\\/10 .text-\\[9px\\]');
    await expect(footerText).toBeVisible();
    await expect(footerText).toContainText('workflow');
  });

  test('should toggle category filter on/off', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible({ timeout: 10000 });

    const brandBtn = page.getByRole('button', { name: /Brand/i }).first();
    await expect(brandBtn).toBeVisible();
    await brandBtn.click();
    await page.waitForTimeout(500);

    const filteredPresets = page.locator('.w-full.text-left.p-3.rounded-xl');
    const filteredCount = await filteredPresets.count();

    await brandBtn.click();
    await page.waitForTimeout(500);

    const allPresets = page.locator('.w-full.text-left.p-3.rounded-xl');
    const allCount = await allPresets.count();
    expect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });
});
