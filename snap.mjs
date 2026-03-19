import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000); // Wait for animations
  await page.screenshot({ path: '/tmp/landing-desktop.png', fullPage: true });

  const mobilePage = await browser.newPage({ viewport: { width: 375, height: 667 } });
  await mobilePage.goto('http://localhost:5173');
  await mobilePage.waitForTimeout(2000); // Wait for animations
  await mobilePage.screenshot({ path: '/tmp/landing-mobile.png', fullPage: true });
  
  await browser.close();
})();
