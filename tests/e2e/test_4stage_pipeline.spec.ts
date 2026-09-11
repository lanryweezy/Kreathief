import { test } from '@playwright/test';

test('Test 4-Stage Pipeline (Strategy -> Creative -> Critic -> Performance)', async ({ page }) => {
  test.setTimeout(240000);

  const artifactDir = 'C:/Users/USER/.gemini/antigravity-ide/brain/18645210-f350-4e18-a0b7-258a86646446';

  // Capture ALL console logs to diagnose strategy response
  page.on('console', (msg) => {
    const text = msg.text();
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${text}`);
  });

  await page.addInitScript(() => {
    localStorage.setItem(
      'kreathief_guest_session',
      JSON.stringify({
        id: 'pro-test-user',
        name: 'Pro Designer',
        email: 'pro@example.com',
        plan: 'pro',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pro',
      })
    );
    localStorage.setItem('kreathief_onboarding_seen', 'true');
    localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
    localStorage.setItem('kreathief_editor_tour_seen', 'true');
  });

  console.log('Navigating to editor...');
  await page.goto('/editor');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Close modals
  try {
    const skipBtn = page.getByRole('button', { name: /Skip/i }).first();
    if (await skipBtn.isVisible({ timeout: 2000 })) {
      await skipBtn.click();
    }
  } catch (e) {}
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  await page.screenshot({ path: `${artifactDir}/e2e_1_editor.png` });

  // Open the Design Agent tab
  const designAgentTab = page.locator('button:has-text("Design Agent")').first();
  if (await designAgentTab.isVisible()) {
    await designAgentTab.click();
    await page.waitForTimeout(1000);
  } else {
    const aiBtn = page.locator('button:has-text("AI")').first();
    if (await aiBtn.isVisible()) {
      await aiBtn.click();
    }
    await page.waitForTimeout(500);
    const tab2 = page.locator('button:has-text("Design Agent")').first();
    if (await tab2.isVisible()) {
      await tab2.click();
    }
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: `${artifactDir}/e2e_2_design_agent_panel.png` });

  const prompt = 'Luxury skincare brand launch poster — minimalist elegance for affluent women 35-55';
  const textarea = page
    .locator('textarea[placeholder*="Ask for design advice"], textarea[placeholder*="Describe"], textarea')
    .first();
  await textarea.fill(prompt);
  await page.waitForTimeout(500);

  const generateBtn = page
    .locator('button:has-text("Generate"), button[aria-label="Start AI Design Workflow"]')
    .first();
  const genStart = Date.now();
  await generateBtn.click();
  console.log('Pipeline started — monitoring stage transitions...');

  // Poll for stage transitions using actual CSS class / data attributes
  let lastStage = '';
  const stagesDetected: string[] = [];

  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(3000);
    const elapsed = Math.round((Date.now() - genStart) / 1000);

    // Read the current orchestration step that is ACTIVE (pulsing / highlighted)
    const activeStageText = await page.evaluate(() => {
      // Find the element with animate-pulse which is the currently active pipeline step
      const active = document.querySelector('.animate-pulse')?.closest('[class*="relative"]');
      return active?.querySelector('h4')?.textContent?.trim() || '';
    });

    // Also check if done/error
    const bodyText = await page.innerText('body').catch(() => '');
    const hasDone = bodyText.includes('Apply Variant') || bodyText.includes('Apply This Variant');
    const hasError = bodyText.includes('Neural Link Severed') || bodyText.includes('Retry Loop');

    if (activeStageText && activeStageText !== lastStage) {
      console.log(`[${elapsed}s] Stage transition: "${lastStage}" → "${activeStageText}"`);
      stagesDetected.push(activeStageText);
      lastStage = activeStageText;
      await page.screenshot({
        path: `${artifactDir}/e2e_stage_${i}_${activeStageText.replace(/\s/g, '_').toLowerCase()}.png`,
      });
    } else {
      console.log(`[${elapsed}s] Active stage: "${activeStageText || 'none/done'}" | Variants ready: ${hasDone}`);
    }

    if (hasDone || hasError) {
      console.log(`Pipeline ${hasDone ? 'COMPLETED' : 'ERRORED'} at ${elapsed}s`);
      break;
    }
  }

  console.log('\nStages detected:', stagesDetected.join(' → '));

  await page.screenshot({ path: `${artifactDir}/e2e_3_pipeline_results.png` });

  const applyBtn = page.locator('button:has-text("Apply Variant"), button:has-text("Apply This Variant")').first();
  if (await applyBtn.isVisible({ timeout: 10000 })) {
    await applyBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${artifactDir}/e2e_4_applied_to_canvas.png` });
    console.log('Design applied to canvas!');
  } else {
    console.log('No apply button found — check e2e_3_pipeline_results.png');
  }
});
