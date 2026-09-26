import { test, expect } from '@playwright/test';
import * as path from 'path';
const SCREENSHOT_DIR = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\0d435f57-6a76-4232-a7a3-b3635d61c2c6\\';
test('Audit 2026 Trends', async ({ page }) => {
  test.setTimeout(120000);
  const trends = [ { name: '1_tactile_grunge', prompt: 'Raw edge distorted cut imperfect broken anti-design punk poster' }, { name: '2_kinetic_aurora', prompt: 'Liquid glass ethereal glowing gradient kinetic stretch calm ui' }, { name: '3_bento_grid', prompt: 'Apple keynote bento grid modular card layout' } ];
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  for (const trend of trends) {
    console.log('Testing 2026 trend: ' + trend.name);
    await page.fill('textarea[placeholder*="Describe your vision"]', trend.prompt);
    await page.click('button:has-text("Generate")');
    await page.waitForSelector('.artboard', { state: 'visible', timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.locator('.artboard').first().screenshot({ path: path.join(SCREENSHOT_DIR, 'trend_' + trend.name + '.png') });
  }
});
