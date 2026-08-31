import { test } from '@playwright/test';

test('Master Stress-Test: NOVA AFRICA AI — Full Pipeline Execution', async ({ page }) => {
  test.setTimeout(300000); // 5 minute budget for full reasoning pipeline

  const artifactDir = 'C:/Users/USER/.gemini/antigravity-ide/brain/18645210-f350-4e18-a0b7-258a86646446';

  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('[Vercel Web Analytics]')) {
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${text}`);
    }
  });

  await page.addInitScript(() => {
    localStorage.setItem(
      'kreathief_guest_session',
      JSON.stringify({
        id: 'principal-designer-user',
        name: 'Principal Creative Director',
        email: 'director@novaafrica.ai',
        plan: 'pro',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nova',
      })
    );
    localStorage.setItem('kreathief_onboarding_seen', 'true');
  });

  console.log('Master Stress-Test: Launching Kreathief Editor...');
  await page.goto('/editor');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Dismiss onboarding/dialogs
  try {
    const skipBtn = page.getByRole('button', { name: /Skip/i }).first();
    if (await skipBtn.isVisible({ timeout: 2000 })) await skipBtn.click();
  } catch (e) {}
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Switch to Instagram Portrait (1080x1350) or set canvas size
  const sizeSelector = page.locator('button:has-text("Square"), button:has-text("CANVAS SIZE"), button:has-text("1080")').first();
  if (await sizeSelector.isVisible()) {
    console.log('Adjusting canvas preset...');
  }

  // Open Design Agent Panel
  const designAgentTab = page.locator('button:has-text("Design Agent")').first();
  if (await designAgentTab.isVisible()) {
    await designAgentTab.click();
    await page.waitForTimeout(1000);
  } else {
    const aiBtn = page.locator('button:has-text("AI")').first();
    if (await aiBtn.isVisible()) await aiBtn.click();
    await page.waitForTimeout(500);
    const tab2 = page.locator('button:has-text("Design Agent")').first();
    if (await tab2.isVisible()) await tab2.click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: `${artifactDir}/master_test_1_agent_panel.png` });

  const masterPrompt = `Create a premium, production-ready promotional campaign for a fictional Nigerian technology company called "NOVA AFRICA AI".

Design a 1080x1350 Instagram portrait poster announcing:
"THE NEXT BILLION BUILDERS"

Supporting headline:
"Africa is not waiting for the future. We are building it."

Event details:
NOVA AFRICA AI SUMMIT 2026
Lagos • Abuja • Nairobi • Accra
September 26, 2026
Landmark Event Centre, Lagos | 9:00 AM - 6:00 PM

CTA:
REGISTER NOW -> novaafrica.ai

Content blocks:
1. AI & INDUSTRY: Building intelligent businesses for Africa.
2. CREATORS & DESIGNERS: Turning imagination into products.
3. FOUNDERS & ENGINEERS: Building the infrastructure of tomorrow.

Art direction:
Futuristic African visual identity (Apple x Stripe x Futuristic African Tech). Deep violet, electric indigo, subtle cyan illumination, warm restrained highlights. Strong editorial hierarchy, gigantic headline, clear card containers, high contrast, WCAG compliant.`;

  const textarea = page.locator('textarea[placeholder*="Ask for design advice"], textarea[placeholder*="Describe"], textarea').first();
  await textarea.fill(masterPrompt);
  await page.waitForTimeout(500);

  const generateBtn = page.locator('button:has-text("Generate"), button[aria-label="Start AI Design Workflow"]').first();
  const genStart = Date.now();
  await generateBtn.click();
  console.log('Master Stress-Test: Pipeline initiated. Monitoring Strategy -> Creative -> Critic -> Performance...');

  let completed = false;
  for (let i = 0; i < 35; i++) {
    await page.waitForTimeout(3000);
    const elapsed = Math.round((Date.now() - genStart) / 1000);

    const activeStage = await page.evaluate(() => {
      const active = document.querySelector('.animate-pulse')?.closest('[class*="relative"]');
      return active?.querySelector('h4')?.textContent?.trim() || '';
    });

    const bodyText = await page.innerText('body').catch(() => '');
    const hasVariants = bodyText.includes('Apply Variant') || bodyText.includes('Apply This Variant');

    console.log(`[${elapsed}s] Active Pipeline Stage: "${activeStage || 'Processing'}" | Variants ready: ${hasVariants}`);

    if (hasVariants) {
      completed = true;
      console.log(`Master Stress-Test: Variants successfully generated at ${elapsed}s!`);
      break;
    }
  }

  await page.screenshot({ path: `${artifactDir}/master_test_2_variants_overview.png` });

  // Apply the highest rated variant
  const applyBtn = page.locator('button:has-text("Apply Variant"), button:has-text("Apply This Variant")').first();
  if (await applyBtn.isVisible({ timeout: 10000 })) {
    await applyBtn.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${artifactDir}/master_test_3_applied_canvas.png` });
    console.log('Master Stress-Test: Variant applied to Canvas successfully!');
  }

  // Inspect the Canvas layer tree structure
  const layersReport = await page.evaluate(() => {
    const store = (window as any).useStore?.getState?.();
    if (!store) return { error: 'Store not accessible' };
    const layers = store.layers || [];
    return {
      totalLayers: layers.length,
      layerSummary: layers.map((l: any) => ({
        id: l.id,
        name: l.name,
        type: l.type,
        text: l.type === 'text' ? l.text : undefined,
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height,
        color: l.color,
      })),
      canvasBg: store.canvasBackgroundColor,
      variants: store.agentVariants?.map((v: any) => ({
        id: v.id,
        name: v.name,
        rationale: v.rationale,
        criticScore: v.criticScore,
        growthScore: v.growthScore,
      })),
    };
  });

  console.log('=== MASTER TEST LAYER TREE AUDIT ===');
  console.log(JSON.stringify(layersReport, null, 2));

  await page.screenshot({ path: `${artifactDir}/master_test_4_final_state.png` });
});
