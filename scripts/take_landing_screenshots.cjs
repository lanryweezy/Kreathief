const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function capture() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1.5,
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  const sections = [
    { name: '01_hero_cinematic.png', scroll: 0 },
    { name: '02_showcase_marquee.png', scroll: 900 },
    { name: '03_bento_features_ai.png', scroll: 1800 },
    { name: '04_bento_features_tools.png', scroll: 2700 },
    { name: '05_templates_gallery.png', scroll: 3800 },
    { name: '06_problem_vs_solution.png', scroll: 4900 },
    { name: '07_testimonials_wall.png', scroll: 5900 },
    { name: '08_pricing_and_cta.png', scroll: 6900 },
  ];

  for (const sec of sections) {
    console.log(`Capturing ${sec.name} at scrollY=${sec.scroll}...`);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), sec.scroll);
    await page.waitForTimeout(1200); // allow framer-motion animations to settle
    await page.screenshot({
      path: path.join(screenshotsDir, sec.name),
    });
  }

  console.log('All 8 section screenshots captured successfully!');
  await browser.close();
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
