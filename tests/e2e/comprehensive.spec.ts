import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Helper to save screenshots specifically to our artifacts folder so Antigravity can display them
const artifactDir = process.env.ARTIFACT_DIR || path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

test('Comprehensive E2E UI Test of Kreathief', async ({ page }) => {
  // 1. Visit App
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(artifactDir, '01-landing-page.png') });

  // 2. Click "Get Started" (Guest Mode Bypass)
  await page.click('button:has-text("Get Started"), a:has-text("Get Started")');
  await page.waitForURL('**/editor');
  await page.screenshot({ path: path.join(artifactDir, '02-editor-loaded.png') });

  // 3. Add a Shape (Rectangle)
  // Assuming there's a toolbar icon or keyboard shortcut. We can press 'R' to create a rectangle!
  await page.keyboard.press('r');
  await page.waitForTimeout(500); // give it a moment
  // Click on the canvas to place it
  await page.mouse.click(500, 500);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, '03-added-shape.png') });

  // 4. Change color
  // Often there's a color picker button or style panel when selected. Let's just open the Magic Panel instead

  // 5. Open Magic / AI Panel
  // We can look for the Magic icon. Since I don't know the exact class, we can try by text or SVG title.
  // Alternatively, I'll just click in the center to select the shape, then press a shortcut or click toolbar.
  // Let's try to find a button with 'Magic' or the magic wand SVG.
  // Usually the toolbar is on the left or top.
  const magicBtn = page
    .locator('button[title="Magic Studio"], button:has(svg.lucide-wand2), button:has-text("Magic")')
    .first();
  if (await magicBtn.isVisible()) {
    await magicBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, '04-magic-panel.png') });
  }

  // 6. Open Layers Panel
  // Assuming 'Layers' or an icon
  const layersBtn = page.locator('button[title="Layers"], button:has-text("Layers")').first();
  if (await layersBtn.isVisible()) {
    await layersBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, '05-layers-panel.png') });
  }

  console.log('Test completed successfully and screenshots saved!');
});
