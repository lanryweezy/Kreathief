import { test, expect } from '@playwright/test';
import * as path from 'path';

const SCREENSHOT_DIR = 'C:/Users/USER/.gemini/antigravity/brain/0d435f57-6a76-4232-a7a3-b3635d61c2c6';

test.describe('Live Design Generation Audit — 5 Distinct Design Types', () => {
  test('Generate and Capture 5 Distinct Design Styles', async ({ page }) => {
    test.setTimeout(300000);
    await page.setViewportSize({ width: 1600, height: 1000 });

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[AI]') || text.includes('[Agent]') || text.includes('error')) {
        console.log('BROWSER LOG:', text);
      }
    });

    await page.addInitScript(() => {
      const userSession = JSON.stringify({
        id: 'qa-pro-tester',
        email: 'audit@kreathief.app',
        name: 'Design Director',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=director',
        plan: 'pro',
      });
      window.localStorage.setItem('kreathief_guest_session', userSession);
      window.localStorage.setItem('kreathief_qa_session', userSession);
      window.localStorage.setItem('kreathief_onboarding_seen', 'true');
      window.localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
      window.localStorage.setItem('kreathief_editor_tour_seen', 'true');
    });

    await page.goto('http://localhost:5173/editor', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).useStore !== undefined, { timeout: 25000 });
    await expect(page.locator('.canvas-container, .design-artboard').first()).toBeVisible({ timeout: 15000 });

    // Open AI Assistant panel on the right
    await page.evaluate(() => {
      const store = (window as any).useStore;
      if (store) {
        store.getState().setShowAIOverlay(true, 'assistant');
      }
    });
    await page.waitForTimeout(1000);

    const testPrompts = [
      {
        id: 'audit_design_1_afrobeats',
        name: 'Afrobeats Concert & Festival',
        prompt: 'Afrobeats Music Festival 2026 Lagos Night Live with Burna Boy style energy',
      },
      {
        id: 'audit_design_2_streetwear',
        name: 'Cyberpunk Streetwear Merch Drop',
        prompt: 'Cyberpunk Streetwear Oversized Boxy Hoodie Limited Edition Fashion Drop',
      },
      {
        id: 'audit_design_3_saas_analytics',
        name: 'SaaS Cloud Analytics Dashboard',
        prompt: 'Modular Cloud AI Analytics Command Center SaaS Dashboard Banner',
      },
      {
        id: 'audit_design_4_food_fest',
        name: 'Naija Food Fest & Grill Promo',
        prompt: 'Smokey Jollof Rice and Suya Weekend Food Fest Lagos Nigeria',
      },
      {
        id: 'audit_design_5_luxury_editorial',
        name: 'Minimalist Luxury Architectural Editorial',
        prompt: 'Minimalist Architectural Luxury Fragrance Studio Editorial Exhibition',
      },
    ];

    for (let i = 0; i < testPrompts.length; i++) {
      const item = testPrompts[i];
      console.log('----------------------------------------');
      console.log('Starting: ' + item.name);
      console.log('Prompt: ' + item.prompt);

      // 1. Trigger agentic workflow via store — wait for store to be ready
      await page.waitForFunction(() => !!(window as any).useStore?.getState, { timeout: 15000 });
      await page.evaluate((promptText) => {
        const store = (window as any).useStore;
        if (store?.getState) store.getState().runAgenticWorkflow(promptText);
      }, item.prompt);

      // 2. Wait until agentStatus becomes 'done' or 'error'
      const startTime = Date.now();
      let finalStatus = 'pending';
      while (Date.now() - startTime < 90000) {
        const s = await page.evaluate(() => {
          const store = (window as any).useStore;
          return store?.getState ? store.getState().agentStatus : 'pending';
        });
        if (s === 'done' || s === 'error') {
          finalStatus = s;
          break;
        }
        await page.waitForTimeout(1000);
      }
      console.log('Agent status reached: ' + finalStatus + ' in ' + Math.round((Date.now() - startTime) / 1000) + 's');

      const status = await page.evaluate(() => {
        const store = (window as any).useStore;
        return store?.getState ? store.getState().agentStatus : 'unknown';
      });
      console.log('Agent status: ' + status);

      // 3. Check variants
      const variantsCount = await page.evaluate(() => {
        const store = (window as any).useStore;
        return store?.getState ? (store.getState().agentVariants?.length || 0) : 0;
      });
      console.log('Generated variants: ' + variantsCount);

      if (variantsCount > 0) {
        await page.evaluate(() => {
          const store = (window as any).useStore;
          if (!store?.getState) return;
          const variants = store.getState().agentVariants;
          if (variants && variants.length > 0) {
            store.getState().applyAgentVariant(variants[0].id);
          }
        });
      }

      await page.waitForTimeout(1500);

      // 4. Capture screenshot of canvas with design applied
      const screenshotPath = path.join(SCREENSHOT_DIR, item.id + '.png');
      await page.screenshot({ path: screenshotPath });
      console.log('Saved screenshot: ' + screenshotPath);

      // 5. Gather layer metadata
      const count = await page.evaluate(() => {
        const store = (window as any).useStore;
        if (!store?.getState) return 0;
        const artboard = store.getState().artboards?.find((a: any) => a.id === store.getState().activeArtboardId);
        return artboard ? artboard.layers.length : 0;
      });
      console.log('Layer count for ' + item.name + ': ' + count);
    }
  });
});
