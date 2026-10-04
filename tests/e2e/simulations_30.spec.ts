import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.use({
  viewport: { width: 1920, height: 1080 },
});

test.describe('Premium Pro User: 30 Visual Simulation Stress Scenarios', () => {
  test.setTimeout(600000); // 10 minutes timeout for 30 runs

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      const userPayload = {
        id: 'qa-agentic-designer',
        email: 'designer-observer@kreathief.app',
        name: 'AI Designer & Observer',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=designer',
        plan: 'pro',
      };
      window.localStorage.setItem('kreathief_qa_session', JSON.stringify(userPayload));
      window.localStorage.setItem('kreathief_user', JSON.stringify(userPayload));
      window.localStorage.setItem('kreathief_onboarding_seen', 'true');
      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
      localStorage.setItem('kreathief_editor_tour_seen', 'true');
    });
  });

  test('Execute 30 visual setups and compile telemetry', async ({ page }) => {
    fs.mkdirSync('verification/screenshots/simulations', { recursive: true });
    await page.goto('/editor');

    // Dismiss CreativeIntentMode overlay if present
    const skipIntentBtn = page.getByRole('button', { name: "Skip — I'll figure it out" });
    await page.waitForTimeout(1000);
    if (await skipIntentBtn.isVisible()) {
      await skipIntentBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    await page.waitForSelector('.design-artboard', { state: 'visible', timeout: 30000 });
    await page.waitForTimeout(1000);

    const simulationResults: any[] = [];

    for (let simIndex = 1; simIndex <= 30; simIndex++) {
      console.log(`--- Running Simulation Scenario ${simIndex}/30 ---`);

      // Determine dimensions, colors, and node counts per index
      const width = 1000 + simIndex * 80;
      const height = 800 + simIndex * 40;
      const shapesCount = 20 + simIndex * 3;
      const baseHue = (simIndex * 12) % 360;
      const themeColor = `hsl(${baseHue}, 85%, 60%)`;
      const ambientGlowColor = `hsl(${(baseHue + 120) % 360}, 90%, 50%)`;

      const renderMetrics = await page.evaluate(
        ({ index, w, h, sc, col, glowCol }) => {
          const store = (window as any).useStore.getState();
          const activeId = store.activeArtboardId || store.artboards[0]?.id;
          const artboard = store.artboards.find((a: any) => a.id === activeId);

          if (artboard) {
            artboard.layers = [];
            store.updateArtboard(artboard.id, { backgroundColor: '#03030F' });
          }

          // Change artboard size dynamically
          store.setCanvasSize({ width: w, height: h, name: `Simulation Canvas ${index}` });

          // Add backdrop layer
          store.addShapeLayer('rectangle', {
            x: 0,
            y: 0,
            width: w,
            height: h,
            name: `Void ${index}`,
            color: '#03030F',
          });

          // Add ambient light source
          store.addShapeLayer('circle', {
            x: w / 3,
            y: h / 3,
            width: Math.min(w, h) * 0.8,
            height: Math.min(w, h) * 0.8,
            name: `Ambient Glow ${index}`,
            color: glowCol,
            opacity: 0.15,
            blur: 300,
          });

          // Draw multiple geometric components to simulate high layout workload
          for (let i = 0; i < sc; i++) {
            const type = i % 2 === 0 ? 'circle' : 'rectangle';
            const size = 50 + i * 12;
            store.addShapeLayer(type, {
              x: w / 2 + Math.sin(i * 0.4) * (w * 0.3) - size / 2,
              y: h / 2 + Math.cos(i * 0.4) * (h * 0.3) - size / 2,
              width: size,
              height: size,
              name: `Shape ${i}`,
              color: col,
              opacity: 0.3 + i * 0.01,
            });
          }

          // Write title info
          store.addTextLayer({
            x: 50,
            y: h - 120,
            width: w - 100,
            height: 60,
            text: `STRESS SCENARIO ${index}: ${w}x${h}px`,
            fontSize: 32,
            fontWeight: 'bold',
            color: '#FFFFFF',
            fontFamily: 'Outfit',
          });

          return {
            layersCount: store.artboards.find((a: any) => a.id === store.activeArtboardId)?.layers?.length || 0,
          };
        },
        { index: simIndex, w: width, h: height, sc: shapesCount, col: themeColor, glowCol: ambientGlowColor }
      );

      // Let rendering pipeline commit changes
      await page.waitForTimeout(1000);

      const shotPath = `verification/screenshots/simulations/scenario_${simIndex}.png`;
      await page.screenshot({ path: shotPath });

      simulationResults.push({
        scenario: simIndex,
        dimensions: `${width}x${height}`,
        shapesCount,
        actualLayersCount: renderMetrics.layersCount,
        screenshot: shotPath,
        status: 'SUCCESS',
      });
    }

    // Save final visual simulation batch metrics
    const resultsJsonPath = 'verification/screenshots/simulations/results.json';
    fs.writeFileSync(resultsJsonPath, JSON.stringify(simulationResults, null, 2));
    console.log(`Saved batch simulation results file to: ${resultsJsonPath}`);
  });
});
