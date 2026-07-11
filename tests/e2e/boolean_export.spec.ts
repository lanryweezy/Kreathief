import { test, expect } from '@playwright/test';

test('Boolean operations and Export pipeline exploration', async ({ page }) => {
  // Capture console logs from the beginning
  page.on('console', msg => {
    const text = msg.text();
    console.log(`BROWSER [${msg.type()}]: ${text}`);
    if (text.includes('Maximum update depth exceeded') || text.includes('error #185')) {
       console.error('CRITICAL: DETECTED INFINITE LOOP ERROR (#185)');
    }
  });

  // Use bypass to reach editor directly
  console.log('Injecting QA session and navigating to editor...');
  await page.addInitScript(() => {
    const mockUser = {
      id: 'qa-user-id',
      email: 'qa@example.com',
      name: 'QA User',
      plan: 'pro'
    };
    window.localStorage.setItem('kreathief_qa_session', JSON.stringify(mockUser));
    window.localStorage.setItem('kreathief_onboarding_seen', 'true');
  });

  await page.goto('http://localhost:5173/editor');

  try {
    console.log('Waiting for editor root or intent overlay...');
    await page.waitForSelector('#editor-root, h1', { timeout: 15000 });

    const skipIntentBtn = page.getByRole('button', { name: 'Skip — I\'ll figure it out' });
    if (await skipIntentBtn.isVisible()) {
      console.log('Clicking Skip on CreativeIntentMode overlay');
      await skipIntentBtn.click({ force: true });
    }

    await expect(page.locator('#editor-root')).toBeVisible({ timeout: 15000 });
    console.log('Editor loaded successfully');
  } catch (err) {
    console.error('Editor failed to load within timeout');
    const crash = await page.evaluate(() => localStorage.getItem('kreathief_crash'));
    if (crash) {
      console.error('DETECTED CRASH IN LOCALSTORAGE:', JSON.parse(crash));
    }
    await page.screenshot({ path: 'test-results/load-failure.png' });
    throw err;
  }

  // 1. Create two overlapping shapes (Paths)
  console.log('Opening Draw tab in Sidebar');
  const drawTab = page.getByRole('button', { name: 'Draw' });
  if (!(await drawTab.isVisible())) {
      console.log('Draw tab not visible, clicking All Tools');
      await page.getByLabel('Toggle All Tools').click();
  }
  await drawTab.click();

  console.log('Selecting Vector Pen tool in Draw panel');
  const vectorPenBtn = page.getByRole('button', { name: 'Vector Pen' });
  await vectorPenBtn.click();

  const startBtn = page.getByRole('button', { name: 'Start', exact: true });
  if (await startBtn.isVisible()) {
      console.log('Confirming start drawing');
      await startBtn.click();
  }

  const canvasContainer = page.locator('.canvas-container');
  await canvasContainer.waitFor({ state: 'visible' });
  const box = await canvasContainer.boundingBox();
  if (!box) throw new Error('Canvas container box not found');

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  console.log('Drawing first path...');
  await page.mouse.click(startX, startY);
  await page.mouse.click(startX + 100, startY);
  await page.mouse.click(startX + 50, startY + 100);
  await page.mouse.click(startX, startY); // Close

  console.log('Finishing first path');
  const doneBtn = page.getByTitle('Done');
  await expect(doneBtn).toBeVisible({ timeout: 5000 });
  await doneBtn.click();

  console.log('Drawing second path...');
  // Re-select tool if it was auto-deselected
  await vectorPenBtn.click();
  if (await startBtn.isVisible()) {
      await startBtn.click();
  }

  const startX2 = startX + 30;
  const startY2 = startY + 30;
  await page.mouse.click(startX2, startY2);
  await page.mouse.click(startX2 + 100, startY2);
  await page.mouse.click(startX2 + 50, startY2 + 100);
  await page.mouse.click(startX2, startY2);
  await expect(doneBtn).toBeVisible({ timeout: 5000 });
  await doneBtn.click();

  // 2. Select both paths
  console.log('Selecting both paths via evaluate (force state)');
  await page.evaluate(() => {
      const s = (window as any).useStore.getState();
      const ab = s.artboards.find((a: any) => a.id === s.activeArtboardId);
      const ids = ab.layers.map((l: any) => l.id);
      s.setSelectedLayerIds(ids);
  });

  // Verify selection
  const appState = await page.evaluate(() => {
      const s = (window as any).useStore.getState();
      const ab = s.artboards.find((a: any) => a.id === s.activeArtboardId);
      return {
          layerCount: ab?.layers?.length || 0,
          selectedCount: s.selectedLayerIds?.length || 0,
          layers: ab?.layers?.map((l: any) => ({ id: l.id, type: l.type }))
      };
  });
  console.log('App State after force selection:', appState);

  // 3. Hover over Boolean Union and verify preview
  console.log('Hovering over Boolean Union');
  const unionBtn = page.getByTitle('Union', { exact: true });

  try {
      await unionBtn.waitFor({ state: 'visible', timeout: 5000 });
      console.log('Union button found, hovering');
      await unionBtn.hover();

      // Take screenshot of preview
      await page.screenshot({ path: 'screenshots/boolean_preview_hover.png' });

      // 4. Perform Boolean Union
      console.log('Performing Boolean Union');
      await unionBtn.click();

      await page.screenshot({ path: 'screenshots/boolean_result.png' });
  } catch (e) {
      console.warn('Union button not found despite selection');
      await page.screenshot({ path: 'screenshots/union_button_missing.png' });
  }

  // 5. Trigger Export Modal
  console.log('Triggering Export Modal');
  await page.keyboard.down('Control');
  await page.keyboard.press('e');
  await page.keyboard.up('Control');

  const exportModal = page.locator('[data-testid="export-modal"]');
  try {
      await expect(exportModal).toBeVisible({ timeout: 5000 });

      // Change format to JPEG
      console.log('Changing format to JPEG');
      await page.locator('[data-testid="export-jpeg-btn"]').click();

      // Adjust quality slider
      console.log('Adjusting quality slider');
      const qualitySlider = page.locator('[data-testid="export-quality-slider"]');
      await qualitySlider.fill('80');

      // 6. Perform Export
      console.log('Clicking Download');
      const downloadBtn = page.locator('[data-testid="download-btn"]');

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        downloadBtn.click(),
      ]);

      if (download) {
        console.log('Download started:', download.suggestedFilename());
      } else {
        console.log('Download event not caught, checking for errors');
      }
  } catch (e) {
      console.warn('Export modal not visible or failed');
      await page.screenshot({ path: 'screenshots/export_failed.png' });
  }

  await page.screenshot({ path: 'screenshots/post_export.png' });

  // Check if "Something went wrong" is visible
  const errorMsg = page.locator('text=Something went wrong');
  const isErrorVisible = await errorMsg.isVisible();
  if (isErrorVisible) {
    console.error('CRITICAL: "Something went wrong" visible after export');
    const crashAfter = await page.evaluate(() => localStorage.getItem('kreathief_crash'));
    if (crashAfter) {
      console.error('CRASH DETAILS:', JSON.parse(crashAfter));
    }
  } else {
    console.log('No visible error after export');
  }

  console.log('Exploration complete');
});
