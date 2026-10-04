import { test, expect } from '@playwright/test';
import * as path from 'path';
const SCREENSHOT_DIR = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\0d435f57-6a76-4232-a7a3-b3635d61c2c6\\';
test('Audit 2026 Trends', async ({ page }) => {
  test.setTimeout(120000);
  const trends = [ { name: '1_tactile_grunge', prompt: 'Raw edge distorted cut imperfect broken anti-design punk poster' }, { name: '2_kinetic_aurora', prompt: 'Liquid glass ethereal glowing gradient kinetic stretch calm ui' }, { name: '3_bento_grid', prompt: 'Apple keynote bento grid modular card layout' } ];
  await page.addInitScript(() => {
    localStorage.setItem(
      'kreathief_qa_session',
      JSON.stringify({
        id: 'test-user',
        name: 'PH Demo User',
        email: 'demo@kreathief.com',
        plan: 'pro',
      })
    );
    localStorage.setItem('kreathief_onboarding_seen', 'true');
    localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
    localStorage.setItem('kreathief_editor_tour_seen', 'true');
  });
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  for (const trend of trends) {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    console.log('Testing 2026 trend: ' + trend.name);
    await page.fill('textarea[placeholder*="A bold fitness gym ad"]', trend.prompt);
    await page.click('button:has-text("Generate")');
    await page.waitForSelector('.design-artboard', { state: 'visible', timeout: 30000 });
    await page.waitForTimeout(5000);
    await page.locator('.design-artboard').first().screenshot({ path: path.join(SCREENSHOT_DIR, 'trend_' + trend.name + '.png') });
  }
});
