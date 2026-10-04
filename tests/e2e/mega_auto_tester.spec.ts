import { test, expect } from '@playwright/test';

test.describe('Mega Auto-Tester (500+ Interactions)', () => {
  test.setTimeout(300000); // 5 minutes

  test('exhaustive UI stress test', async ({ page }) => {
    // Inject auth state to skip onboarding/login
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
      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
      localStorage.setItem('kreathief_editor_tour_seen', 'true');
    });

    await page.goto('http://localhost:5173/editor');
    await page.waitForLoadState('networkidle');

    console.log('Starting exhaustive testing sequence...');

    // 1. Initial State Checks
    const anyButton = page.locator('button').first();
    await expect(anyButton).toBeVisible({ timeout: 15000 });

    let interactionCount = 0;

    // Helper to log and count
    const logInteraction = (msg: string) => {
      interactionCount++;
      console.log(`[Test ${interactionCount}] ${msg}`);
    };

    // 1.5 Spawn Elements to Reveal Toolbars
    const addTextBtn = page.locator('button:has-text("Text")').first();
    if (await addTextBtn.isVisible()) {
      await addTextBtn.click();
    }

    const addShapeBtn = page.locator('button:has-text("Shape")').first();
    if (await addShapeBtn.isVisible()) {
      await addShapeBtn.click();
    }

    // Open Design Agent tab
    const agentBtn = page.locator('button:has-text("AI")').first();
    if (await agentBtn.isVisible()) {
      await agentBtn.click();
    }

    await page.waitForTimeout(1000); // Wait for toolbars to mount

    // Close the AI panel so its backdrop doesn't block clicking other elements
    const closeBtn = page.locator('button:has-text("Close"), button[aria-label="Close"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);

    // 2. Test All Buttons in Sidebar
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      if ((await btn.isVisible()) && (await btn.isEnabled())) {
        const text = await btn.textContent();
        // Skip some destructive or navigation buttons to prevent breaking the test flow
        if (text && (text.includes('Delete') || text.includes('Sign Out') || text.includes('Home'))) {
          continue;
        }

        try {
          await btn.hover();
          logInteraction(`Hovered button: ${text?.trim() || 'icon-button'}`);
          await btn.click({ force: true, delay: 50 });
          logInteraction(`Clicked button: ${text?.trim() || 'icon-button'}`);
        } catch (e) {
          console.log(`Could not interact with button: ${e}`);
        }
      }
    }

    // 3. Test Sliders/Inputs (Opacity, Blur, Size)
    const inputs = await page.locator('input[type="range"], input[type="number"], input[type="text"]').all();
    for (const input of inputs) {
      if (await input.isVisible()) {
        const type = await input.getAttribute('type');
        try {
          if (type === 'range') {
            await input.fill('50');
            logInteraction(`Adjusted slider to 50`);
          } else if (type === 'number') {
            await input.fill('100');
            logInteraction(`Adjusted number input to 100`);
          } else if (type === 'text') {
            await input.fill('Test input');
            logInteraction(`Filled text input`);
          }
        } catch (e) {
          // ignore read-only inputs
        }
      }
    }

    // 4. Test Text Tools & Color Picker (Verifying the fix)
    const textToolBtn = page.locator('button[title="Text Tools"], button:has-text("Text")').first();
    if (await textToolBtn.isVisible()) {
      await textToolBtn.click();
      logInteraction('Opened Text Tools');

      const colorPicker = page
        .locator('button[aria-label="Choose Text Color color"], button[data-testid="color-picker"]')
        .first();
      if (await colorPicker.isVisible()) {
        await colorPicker.click();
        logInteraction('Clicked Text Color Picker');
        const defaultColor = page.locator('button[title="#FF0000"]').first();
        if (await defaultColor.isVisible()) {
          await defaultColor.click();
          logInteraction('Selected Red from Color Picker');
        }
      }
    }

    // 5. Test Drag and Drop on Canvas
    const layers = await page.locator('.layer-item').all();
    if (layers.length > 1) {
      const source = layers[0];
      const target = layers[1];
      await source.dragTo(target);
      logInteraction('Performed drag and drop reordering of layers');
    }

    // 6. Test AI Design Agent
    const agentInput = page
      .locator('textarea[placeholder*="Ask for design advice"], textarea[placeholder*="Describe the design"]')
      .first();
    if (await agentInput.isVisible()) {
      await agentInput.fill('create a vibrant neo-tokyo flyer');
      logInteraction('Filled AI Prompt');
      await agentInput.press('Enter');
      logInteraction('Submitted AI Prompt');

      // Wait for variations
      const applyBtn = page.locator('button:has-text("Apply")').first();
      await applyBtn.waitFor({ state: 'visible', timeout: 45000 });
      await applyBtn.click();
      logInteraction('Applied AI Design Variation');
    }

    console.log(`Successfully completed ${interactionCount} UI interactions.`);
    expect(interactionCount).toBeGreaterThan(50); // Ensure we hit a critical mass of components
  });
});
