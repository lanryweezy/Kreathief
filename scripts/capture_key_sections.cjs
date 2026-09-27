const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function run() {
  const outDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  console.log('Opening http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 1. Hero
  console.log('Capturing Hero...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '01_hero.png') });

  // 2. 3D Studio Canvas Preview in Hero
  console.log('Capturing Studio Canvas Preview...');
  await page.evaluate(() => window.scrollTo(0, 750));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '02_studio_preview.png') });

  // 3. Problem Solution
  console.log('Capturing Problem vs Solution...');
  const problemEl = await page.$('#problem');
  if (problemEl) {
    await problemEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, '03_problem_solution.png') });
  }

  // 4. Features Bento
  console.log('Capturing Features Bento...');
  const featuresEl = await page.$('#features');
  if (featuresEl) {
    await featuresEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, '04_features_bento.png') });
  }

  // 5. Scroll Showcase (Marquee Stream of Real Posters)
  console.log('Capturing Marquee Showcase...');
  const showcaseEl = await page.$('#showcase');
  if (showcaseEl) {
    await showcaseEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, '05_poster_marquee.png') });
  }

  // 6. Template Gallery with Real Downloaded Artworks
  console.log('Capturing Template Gallery...');
  const templateEl = await page.$('#templates');
  if (templateEl) {
    await templateEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '06_template_gallery.png') });
  }

  // 7. Testimonials Wall of Love
  console.log('Capturing Testimonials...');
  const testimonialsEl = await page.$('section:has-text("Wall of Love")');
  if (testimonialsEl) {
    await testimonialsEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, '07_testimonials.png') });
  }

  // 8. Pricing & Final CTA
  console.log('Capturing Pricing & CTA...');
  const pricingEl = await page.$('#pricing');
  if (pricingEl) {
    await pricingEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, '08_pricing.png') });
  }

  console.log('Done capturing all key landing page sections!');
  await browser.close();
}

run().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
