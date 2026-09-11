import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Verbose Test: Design Agent with Bottleneck Profiling', async ({ page }) => {
  test.setTimeout(240000); // 4 minutes timeout

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    }
  });

  await page.addInitScript(() => {
    localStorage.setItem(
      'kreathief_guest_session',
      JSON.stringify({
        id: 'test-user',
        name: 'Test Designer',
        email: 'test@example.com',
        plan: 'pro',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      })
    );
    localStorage.setItem('kreathief_onboarding_seen', 'true');
    localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
    localStorage.setItem('kreathief_editor_tour_seen', 'true');
  });

  const startTime = Date.now();
  console.log(`[Timer] Navigating to editor...`);

  await page.goto('/editor');
  await page.waitForLoadState('load');
  await page.waitForTimeout(3000);

  console.log(`[Timer] Editor loaded in ${Date.now() - startTime}ms`);

  // Close modals
  try {
    const skipBtn = page.getByRole('button', { name: /Skip/i }).first();
    if (await skipBtn.isVisible({ timeout: 2000 })) {
      await skipBtn.click();
    }
  } catch (e) {}

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Take screenshot of empty editor
  await page.screenshot({
    path: `C:/Users/USER/.gemini/antigravity-ide/brain/8643b4c2-fa0b-4d3e-8ce5-6501c7f1cd5a/step_1_empty_editor.png`,
  });

  // Open Design Agent tab
  const agentBtn = page.getByRole('button', { name: /^AI$/i }).first();
  if (await agentBtn.isVisible()) {
    await agentBtn.click();
  } else {
    await page.locator('button:has-text("AI")').first().click();
  }
  await page.waitForTimeout(1000);

  const tabBtn = page.locator('button:has-text("Design Agent")').last();
  if (await tabBtn.isVisible()) {
    await tabBtn.click();
  }
  await page.waitForTimeout(500);

  // Take screenshot of open AI panel
  await page.screenshot({
    path: `C:/Users/USER/.gemini/antigravity-ide/brain/8643b4c2-fa0b-4d3e-8ce5-6501c7f1cd5a/step_2_ai_panel_open.png`,
  });

  const prompts = ['minimalist tech startup conference banner', 'vibrant tropical summer party invitation'];

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    console.log(`\n--- Starting prompt: ${prompt} ---`);

    const actualInput = page.locator('textarea[placeholder*="Describe"], input[placeholder*="Describe"]').first();
    const targetInput = (await actualInput.isVisible()) ? actualInput : page.locator('textarea').first();

    if (await targetInput.isVisible()) {
      await targetInput.fill('');
      await targetInput.fill(prompt);
      await page.waitForTimeout(500);

      // Screenshot prompt typed
      await page.screenshot({
        path: `C:/Users/USER/.gemini/antigravity-ide/brain/8643b4c2-fa0b-4d3e-8ce5-6501c7f1cd5a/step_3_prompt_typed_${i}.png`,
      });

      const genStartTime = Date.now();
      const generateBtn = page.getByRole('button', { name: /Start AI Design Workflow/i }).first();
      await generateBtn.click();

      await page.waitForTimeout(1000);
      // Screenshot generating state
      await page.screenshot({
        path: `C:/Users/USER/.gemini/antigravity-ide/brain/8643b4c2-fa0b-4d3e-8ce5-6501c7f1cd5a/step_4_generating_${i}.png`,
      });

      console.log(`Waiting for generation to finish...`);
      try {
        await page.waitForSelector('button:has-text("Apply This Variant"), button:has-text("Apply this variant")', {
          timeout: 90000,
        });
        const genTime = Date.now() - genStartTime;
        console.log(`[Bottleneck Profile] Generation took ${genTime}ms`);
      } catch (e) {
        console.log(`[Error] Timeout waiting for variant! Generation took longer than 90s.`);
      }

      await page.waitForTimeout(1000);
      // Screenshot variants ready
      await page.screenshot({
        path: `C:/Users/USER/.gemini/antigravity-ide/brain/8643b4c2-fa0b-4d3e-8ce5-6501c7f1cd5a/step_5_variants_ready_${i}.png`,
      });

      const applyStartTime = Date.now();
      const applyBtn = page
        .locator('button:has-text("Apply This Variant"), button:has-text("Apply this variant")')
        .first();
      if (await applyBtn.isVisible()) {
        await applyBtn.click();

        // Wait for images to load onto canvas
        await page.waitForTimeout(3000);
        console.log(`[Bottleneck Profile] Applying design to canvas took ${Date.now() - applyStartTime}ms`);

        // Screenshot applied design
        await page.screenshot({
          path: `C:/Users/USER/.gemini/antigravity-ide/brain/8643b4c2-fa0b-4d3e-8ce5-6501c7f1cd5a/step_6_applied_design_${i}.png`,
        });
      }
    }
  }
});
