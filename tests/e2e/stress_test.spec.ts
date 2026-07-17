import { test, expect } from '@playwright/test';

test('Aggressive Stress Test - Long Duration Simulation', async ({ page }) => {
  // Capture console logs and watch for Error #185
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Maximum update depth exceeded') || text.includes('error #185')) {
      console.error('CRITICAL: DETECTED INFINITE LOOP ERROR (#185)');
    } else if (text.includes('Encountered two children with the same key')) {
      // Just log it, don't fail unless it causes a crash
      console.warn('REACT WARNING: Duplicate Keys detected');
    } else {
      console.log(`BROWSER [${msg.type()}]: ${text.substring(0, 100)}`);
    }
  });

  // 1. Auth & Environment Setup
  console.log('Injecting QA session and navigating to editor...');
  await page.addInitScript(() => {
    const mockUser = {
      id: 'stress-tester-id',
      email: 'stress@example.com',
      name: 'Stress Bot',
      plan: 'pro',
    };
    window.localStorage.setItem('kreathief_qa_session', JSON.stringify(mockUser));
    window.localStorage.setItem('kreathief_onboarding_seen', 'true');
  });

  await page.goto('http://localhost:5173/editor');

  // 2. Wait for Editor & Bypass overlays
  console.log('Waiting for workspace...');
  await page.waitForSelector('#editor-root, h1', { timeout: 15000 });
  const skipIntentBtn = page.getByRole('button', { name: "Skip — I'll figure it out" });
  if (await skipIntentBtn.isVisible()) {
    await skipIntentBtn.click({ force: true });
  }
  await expect(page.locator('#editor-root')).toBeVisible({ timeout: 15000 });

  const canvasContainer = page.locator('.canvas-container');
  const box = await canvasContainer.boundingBox();
  if (!box) throw new Error('Canvas not found');

  const randomPoint = () => ({
    x: box.x + 100 + Math.random() * (box.width - 200),
    y: box.y + 100 + Math.random() * (box.height - 200),
  });

  // 3. Stress Loop
  const ITERATIONS = 100; // Aggressive loop
  console.log(`Starting aggressive stress test loop (${ITERATIONS} iterations)...`);

  for (let i = 0; i < ITERATIONS; i++) {
    console.log(`--- Iteration ${i + 1}/${ITERATIONS} ---`);

    // ACTION A: Add Random Shape via Keyboard Shortcuts
    if (Math.random() > 0.3) {
      console.log('Action: Adding random shape');
      const shapeKey = ['r', 'o', 't'][Math.floor(Math.random() * 3)];
      await page.keyboard.press(shapeKey);
    }

    // ACTION B: Draw random vector path
    if (Math.random() > 0.6) {
      console.log('Action: Drawing vector path');
      await page.keyboard.press('p');
      const start = randomPoint();
      await page.mouse.click(start.x, start.y);
      for (let j = 0; j < 2; j++) {
        const next = randomPoint();
        await page.mouse.click(next.x, next.y);
      }
      await page.mouse.click(start.x, start.y); // Close
      const doneBtn = page.getByTitle('Done');
      if (await doneBtn.isVisible()) await doneBtn.click();
    }

    // ACTION C: Multi-Selection Stress
    if (i % 3 === 0) {
      console.log('Action: Selecting all');
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');

      // Random Nudge
      const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      for (let j = 0; j < 3; j++) {
        await page.keyboard.press(arrows[Math.floor(Math.random() * arrows.length)]);
      }
    }

    // ACTION D: Boolean Union
    if (i % 7 === 0) {
      console.log('Action: Boolean Union');
      // Force select all layers first to ensure we have paths
      await page.evaluate(() => {
        const s = (window as any).useStore.getState();
        const ab = s.artboards.find((a: any) => a.id === s.activeArtboardId);
        if (ab) s.setSelectedLayerIds(ab.layers.map((l: any) => l.id));
      });
      const unionBtn = page.getByTitle('Union', { exact: true });
      if (await unionBtn.isVisible()) {
        await unionBtn.click();
      }
    }

    // ACTION E: Undo / Redo
    if (Math.random() > 0.8) {
      console.log('Action: Undo/Redo');
      await page.keyboard.down('Control');
      await page.keyboard.press('z');
      await page.keyboard.up('Control');
    }

    // ACTION F: Export pipeline
    if (i % 20 === 0) {
      console.log('Action: Export Trigger');
      await page.keyboard.down('Control');
      await page.keyboard.press('e');
      await page.keyboard.up('Control');
      const exportModal = page.locator('[data-testid="export-modal"]');
      if (await exportModal.isVisible()) {
        await page.locator('[data-testid="export-jpeg-btn"]').click();
        await page.locator('[data-testid="close-export-modal"]').click();
      }
    }

    // Small delay
    await page.waitForTimeout(100);

    // Health check
    const crash = await page.evaluate(() => {
      const c = localStorage.getItem('kreathief_crash');
      const d = localStorage.getItem('kreathief_debug_error');
      return c || d;
    });
    if (crash) {
      console.error('STRESS TEST FAILED AT ITERATION', i, JSON.parse(crash));
      await page.screenshot({ path: `screenshots/stress_failure_${i}.png` });
      throw new Error('Crashed during stress test');
    }
  }

  await page.screenshot({ path: 'screenshots/stress_test_final.png' });
  console.log('Stress test loop complete. Stable.');
});
