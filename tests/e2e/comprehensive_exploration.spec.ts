import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Comprehensive Editor Exploration', async ({ page }) => {
  // Use a longer timeout for this exploration
  test.setTimeout(120000);

  // Helper to take screenshots
  const takeScreenshot = async (name: string) => {
    await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  };

  // 1. Load the app
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await takeScreenshot('01_initial_load');

  // 2. Select Creative Intent (if present)
  try {
    const intentButton = page.locator('button:has-text("Creative Drawing"), .creative-intent-button').first();
    if (await intentButton.isVisible()) {
      await intentButton.click();
      await page.waitForTimeout(1000);
      await takeScreenshot('02_intent_selected');
    }
  } catch (e) {
    console.log('Creative intent selection skipped or not found');
  }

  // 3. Add Various Shapes
  console.log('Adding shapes...');
  await page.keyboard.press('r'); // Rectangle
  await page.waitForTimeout(500);
  await page.keyboard.press('o'); // Oval/Circle
  await page.waitForTimeout(500);
  await page.keyboard.press('t'); // Text
  await page.waitForTimeout(500);
  await takeScreenshot('03_shapes_added');

  // 4. Test Selection and Transformation
  console.log('Testing transformations...');
  // Select all
  await page.keyboard.press('Control+a');
  await page.waitForTimeout(500);

  // Move them
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
  }
  await page.waitForTimeout(500);
  await takeScreenshot('04_moved_layers');

  // 5. Test Zooming
  console.log('Testing zoom...');
  await page.keyboard.press('Control+='); // Zoom in
  await page.keyboard.press('Control+=');
  await page.waitForTimeout(500);
  await takeScreenshot('05_zoom_in');
  await page.keyboard.press('Control+-'); // Zoom out
  await page.waitForTimeout(500);
  await takeScreenshot('06_zoom_out');

  // 6. Explore Panels
  console.log('Exploring panels...');
  const panels = ['Layers', 'Brand', 'Magic', 'Draw', 'Media'];
  for (const panel of panels) {
    const btn = page.locator(`button[aria-label*="${panel}"i], button:has-text("${panel}")`).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(800);
      await takeScreenshot(`07_panel_${panel}`);
    }
  }

  // 7. Test Vector Pen Tool (as mentioned in IMPLEMENTATION_SUMMARY.md)
  console.log('Testing Pen Tool...');
  await page.keyboard.press('p'); // Activate Pen tool
  await page.waitForTimeout(1000);

  // Draw a triangle
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (box) {
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.click(centerX, centerY);
    await page.mouse.click(centerX + 100, centerY);
    await page.mouse.click(centerX + 50, centerY - 100);
    await page.mouse.click(centerX, centerY); // Close path

    await page.waitForTimeout(500);
    await takeScreenshot('08_pen_tool_triangle');

    await page.keyboard.press('Enter'); // Finish path
  }

  // 8. Test Export Modal
  console.log('Testing Export Modal...');
  const exportBtn = page.locator('button:has-text("Export")').first();
  if (await exportBtn.isVisible()) {
    await exportBtn.click();
    await page.waitForTimeout(1000);
    await takeScreenshot('09_export_modal');

    // Close modal (assuming there's a close button or clicking backdrop)
    await page.keyboard.press('Escape');
  }

  // 9. Check for Errors in Console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`PAGE ERROR: "${msg.text()}"`);
    }
  });

  console.log('Exploration complete.');
}, {
  // Config
});
