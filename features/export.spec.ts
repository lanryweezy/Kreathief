import { test, expect } from '@playwright/test';

test.describe('Export System', () => {
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

  test('should open export modal from header download button', async ({ page }) => {
    const downloadBtn = page.locator('header').getByRole('button', { name: /download/i }).or(
      page.locator('[data-testid="open-export"]')
    ).first();

    if (await downloadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await downloadBtn.click();
    } else {
      await page.keyboard.press('Control+e');
    }

    await expect(page.getByText('Export Design')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('export-modal')).toBeVisible();
  });

  test('should close export modal with close button', async ({ page }) => {
    await page.keyboard.press('Control+e');
    await expect(page.getByText('Export Design')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('close-export-modal').click();
    await expect(page.getByText('Export Design')).not.toBeVisible({ timeout: 5000 });
  });

  test('should close export modal with Escape key', async ({ page }) => {
    await page.keyboard.press('Control+e');
    await expect(page.getByText('Export Design')).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Escape');
    await expect(page.getByText('Export Design')).not.toBeVisible({ timeout: 5000 });
  });

  test('should display PNG format as default', async ({ page }) => {
    await page.keyboard.press('Control+e');
    await expect(page.getByText('Export Design')).toBeVisible({ timeout: 10000 });

    const pngBtn = page.getByTestId('export-png-btn');
    await expect(pngBtn).toBeVisible();
    await expect(pngBtn).toHaveClass(/bg-brand-600/);
  });

  test('should select JPG format', async ({ page }) => {
    await page.keyboard.press('Control+e');
    await expect(page.getByText('Export Design')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('export-jpeg-btn').click();
    await expect(page.getByTestId('export-jpeg-btn')).toHaveClass(/bg-brand-600/);

    await expect(page.getByText('Quality')).toBeVisible();
  });

  test('should select WebP format', async ({ page }) => {
    await page.keyboard.press('Control+e');
    await expect(page.getByText('Export Design')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('export-webp-btn').click();
    await expect(page.getByTestId('export-webp-btn')).toHaveClass(/bg-brand-600/);

    await expect(page.getByText('Quality')).toBeVisible();
  });

  test('should show quality slider for JPEG format', async ({ page }) => {
    await page.keyboard.press('Control+e');
    await expect(page.getByText('Export Design')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('export-jpeg-btn').click();
    await page.waitForTimeout(300);

    const qualitySlider = page.getByTestId('export-quality-slider');
    await expect(qualitySlider).toBeVisible();
  });

  test('should show transparent background toggle for PNG format', async ({ page }) => {
    await page.keyboard.press('Control+e');
    await expect(page.getByText('Export Design')).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Transparent Background')).toBeVisible();
    await expect(page.getByText('Export with alpha channel')).toBeVisible();
  });

  test('should show export scale options', async ({ page }) => {
    await page.keyboard.press('Control+e');
    await expect(page.getByText('Export Design')).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Export Scale')).toBeVisible();
    await expect(page.getByText('1x')).toBeVisible();
    await expect(page.getByText('2x')).toBeVisible();
    await expect(page.getByText('3x')).toBeVisible();
  });

  test('should show DPI options', async ({ page }) => {
    await page.keyboard.press('Control+e');
    await expect(page.getByText('Export Design')).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('DPI (Print Resolution)')).toBeVisible();
    await expect(page.getByText('72')).toBeVisible();
    await expect(page.getByText('150')).toBeVisible();
    await expect(page.getByText('300')).toBeVisible();
    await expect(page.getByText('600')).toBeVisible();
  });
});
