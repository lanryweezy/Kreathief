import { test, expect } from '@playwright/test';

test('Test 5 diverse Design Agent prompts', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes timeout
  test.setTimeout(180000); // 3 minutes timeout
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    } else {
      console.log(`BROWSER LOG: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => console.log(`BROWSER PAGE ERROR: ${err.message}`));
  
  await page.addInitScript(() => {
    localStorage.setItem(
      'kreathief_guest_session',
      JSON.stringify({
        id: 'test-user',
        name: 'Test Designer',
        email: 'test@example.com',
        plan: 'free',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      })
    );
    localStorage.setItem('kreathief_onboarding_seen', 'true');
  });

  // Navigate to editor directly
  await page.goto('/editor');
  await page.waitForLoadState('load');
  await page.waitForTimeout(3000);
  
  // Close any modals
  try {
    const skipBtn = page.getByRole('button', { name: /Skip/i }).first();
    if (await skipBtn.isVisible({ timeout: 2000 })) {
      await skipBtn.click();
    }
  } catch (e) {}

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Open Design Agent tab (AI button in header)
  const agentBtn = page.getByRole('button', { name: /^AI$/i }).first();
  if (await agentBtn.isVisible()) {
    await agentBtn.click();
  } else {
    await page.locator('button:has-text("AI")').first().click();
  }
  await page.waitForTimeout(1000);

  // Switch to the Design Agent tab inside the panel
  const tabBtn = page.locator('button:has-text("Design Agent")').last();
  if (await tabBtn.isVisible()) {
    await tabBtn.click();
  }
  await page.waitForTimeout(500);

  const prompts = [
    "gritty streetwear brand poster with brutalist elements and acid graphics",
    "rap music artist album art cover with focal point imagery and high contrast",
    "skateboarder magazine cover with grunge aesthetics and dynamic typography",
    "neon party club flyer with y2k 3d chrome and maximalist composition",
    "clean modern corporate fashion lookbook cover with pastel colors",
    "cyberpunk futuristic tech startup landing page hero graphic",
    "elegant luxury jewelry brand advertisement with minimal whitespace",
    "retro 80s synthwave arcade game poster with neon grids",
    "organic eco-friendly sustainable coffee shop menu board",
    "high fashion editorial magazine spread with bold red typography"
  ];

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    
    // Find the textarea inside the AI panel
    const input = page.locator('textarea, input').filter({ hasText: '' }).last(); // Fallback if placeholder doesn't match
    const actualInput = page.locator('textarea[placeholder*="Describe"], input[placeholder*="Describe"]').first();
    
    console.log(`Generating prompt: ${prompt}`);
    
    // Type in the search box
    const targetInput = page.locator('textarea[placeholder*="Ask for design advice"], textarea[placeholder*="Ask a question"], textarea').first();
    await targetInput.fill(prompt);
    
    // Press enter or click button
    const generateBtn = page.getByRole('button', { name: /Start AI Design Workflow/i, exact: false }).first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
    } else {
      await targetInput.press('Enter');
    }
    
    // Wait for variants to appear
    try {
      await page.waitForSelector('button:has-text("Apply This Variant"), button:has-text("Apply this variant")', { timeout: 120000 });
    } catch (e) {
      console.log(`Timeout waiting for variant for prompt: ${prompt}`);
    }
    
    await page.waitForTimeout(2000); // let animations settle
    
    // Click Apply
    const applyBtn = page.locator('button:has-text("Apply This Variant"), button:has-text("Apply this variant")').first();
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of whole canvas with unique name in artifacts directory
      await page.screenshot({ path: `C:/Users/USER/.gemini/antigravity-ide/brain/8643b4c2-fa0b-4d3e-8ce5-6501c7f1cd5a/applied_design_${i}.png` });
    }

    console.log(`Finished prompt: ${prompt}`);
    
    // Wait 10 seconds to avoid API rate limits
    await page.waitForTimeout(10000);
  }
});
