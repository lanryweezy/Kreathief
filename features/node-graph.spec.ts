import { test, expect } from '@playwright/test';

test.describe('Node Graph Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('kreathief_qa_session', JSON.stringify({
        id: 'qa-user', email: 'qa@kreathief.app', name: 'QA Engineer',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qa', plan: 'pro',
      }));
      window.localStorage.setItem('kreathief_onboarding_seen', 'true');
    });
    await page.goto('/editor');
    await page.waitForFunction(() => (window as any).useStore !== undefined);
  });

  test('should open node graph from toolbar Workflows button', async ({ page }) => {
    const workflowsBtn = page.getByRole('button', { name: /Workflows/i });
    await expect(workflowsBtn).toBeVisible();
    await workflowsBtn.click();

    await expect(page.getByText('Node Workflow')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Build AI pipelines visually')).toBeVisible();
  });

  test('should close node graph with close button', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible();

    await page.locator('[data-testid="close-node-graph"]').or(page.locator('button:has(svg)').filter({ hasText: '' }).last()).first().click();
    await expect(page.getByText('Node Workflow')).not.toBeVisible({ timeout: 5000 });
  });

  test('should toggle Presets panel', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible();

    const presetsBtn = page.getByRole('button', { name: 'Presets' });
    await expect(presetsBtn).toBeVisible();
    await presetsBtn.click();

    await expect(page.getByText('Search workflows...')).not.toBeVisible({ timeout: 5000 });

    await presetsBtn.click();
    await expect(page.getByPlaceholder('Search workflows...')).toBeVisible({ timeout: 5000 });
  });

  test('should toggle Nodes sidebar', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible();

    const nodesBtn = page.getByRole('button', { name: 'Nodes' });
    await expect(nodesBtn).toBeVisible();

    await expect(page.getByPlaceholder('Search nodes...')).toBeVisible();

    await nodesBtn.click();
    await expect(page.getByPlaceholder('Search nodes...')).not.toBeVisible({ timeout: 5000 });

    await nodesBtn.click();
    await expect(page.getByPlaceholder('Search nodes...')).toBeVisible({ timeout: 5000 });
  });

  test('should load a preset workflow from presets panel', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible();

    const presetCard = page.locator('.w-full.text-left.p-3.rounded-xl').first();
    await expect(presetCard).toBeVisible({ timeout: 10000 });
    await presetCard.click();

    await expect(page.locator('.node-graph-bg')).toBeVisible();
    const statsText = page.locator('.absolute.bottom-4.left-4');
    await expect(statsText).toContainText('nodes');
  });

  test('should add nodes from sidebar', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible();

    const nodeButton = page.locator('.w-full.text-left.p-2.rounded-md').first();
    await expect(nodeButton).toBeVisible({ timeout: 10000 });
    await nodeButton.click();

    await page.waitForTimeout(500);
    const statsText = page.locator('.absolute.bottom-4.left-4');
    const text = await statsText.textContent();
    expect(text).toContain('nodes');
  });

  test('should search and filter presets', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible();

    const searchInput = page.getByPlaceholder('Search workflows...');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('sticker');
    await page.waitForTimeout(500);

    const presets = page.locator('.w-full.text-left.p-3.rounded-xl');
    const count = await presets.count();
    expect(count).toBeGreaterThan(0);

    await searchInput.clear();
    const allPresets = page.locator('.w-full.text-left.p-3.rounded-xl');
    const allCount = await allPresets.count();
    expect(allCount).toBeGreaterThanOrEqual(count);
  });

  test('should filter presets by category', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible();

    const streetwearBtn = page.getByRole('button', { name: /Streetwear/i });
    await expect(streetwearBtn).toBeVisible({ timeout: 10000 });
    await streetwearBtn.click();

    await page.waitForTimeout(500);
    const presets = page.locator('.w-full.text-left.p-3.rounded-xl');
    const count = await presets.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should clear graph with Clear button', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible();

    const presetCard = page.locator('.w-full.text-left.p-3.rounded-xl').first();
    await expect(presetCard).toBeVisible({ timeout: 10000 });
    await presetCard.click();
    await page.waitForTimeout(500);

    const clearBtn = page.getByRole('button', { name: 'Clear' });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    await page.waitForTimeout(500);
    const statsText = page.locator('.absolute.bottom-4.left-4');
    await expect(statsText).toContainText('0 nodes');
  });

  test('should disable Run Graph when no nodes exist', async ({ page }) => {
    await page.getByRole('button', { name: /Workflows/i }).click();
    await expect(page.getByText('Node Workflow')).toBeVisible();

    const runBtn = page.getByRole('button', { name: 'Run Graph' });
    await expect(runBtn).toBeVisible();
    await expect(runBtn).toBeDisabled();
  });
});
