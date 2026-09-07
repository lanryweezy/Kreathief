import { test, expect } from '@playwright/test';

test.describe('AI Studio Capabilities E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.addInitScript(() => {
      const userSession = JSON.stringify({
        id: 'qa-user',
        email: 'qa@kreathief.app',
        name: 'QA Engineer',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qa',
        plan: 'pro',
      });
      window.localStorage.setItem('kreathief_guest_session', userSession);
      window.localStorage.setItem('kreathief_qa_session', userSession);
      window.localStorage.setItem('kreathief_onboarding_seen', 'true');
      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
      localStorage.setItem('kreathief_editor_tour_seen', 'true');
      window.localStorage.setItem('kreathief_onboarding_seen_v2', 'true');
    });

    await page.goto('/editor', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.canvas-container, .design-artboard').first()).toBeVisible({ timeout: 15000 });
  });

  test('should allow selecting prompt archetypes, inspiration tags, and negative prompt chips', async ({ page }) => {
    // Ensure no layer is selected so Magic Studio opens in Imagine mode
    await page.keyboard.press('Escape');

    // Open Magic Studio panel via Header AI button
    const aiButton = page.locator('button[aria-label="Open AI tools"]').first();
    await expect(aiButton).toBeVisible({ timeout: 8000 });
    await aiButton.click();

    // Locate the AI dialog modal
    const aiDialog = page.locator('div[aria-label="AI Tools"]');
    await expect(aiDialog).toBeVisible({ timeout: 8000 });

    // Ensure Image Gen tab is active
    const imageGenTab = aiDialog.locator('button:has-text("Image Gen")').first();
    await expect(imageGenTab).toBeVisible();
    await imageGenTab.click();

    // Verify Prompt Mode Archetype buttons exist inside AI dialog
    const cinematicBtn = aiDialog.locator('button:has-text("Cinematic")').first();
    await expect(cinematicBtn).toBeVisible({ timeout: 10000 });

    const vectorBtn = aiDialog.locator('button:has-text("Vector")').first();
    await expect(vectorBtn).toBeVisible();
    await vectorBtn.click();

    // Verify Prompt Input and Inspiration Tags
    const promptInput = aiDialog.locator('textarea[data-testid="magic-prompt-input"]').first();
    await expect(promptInput).toBeVisible({ timeout: 10000 });

    // Click an Inspiration Tag
    const inspirationTag = aiDialog
      .locator('button:has-text("+ Volumetric Lighting"), button:has-text("+ Neon Rim Light")')
      .first();
    if (await inspirationTag.isVisible()) {
      await inspirationTag.click();
      const value = await promptInput.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }

    // Toggle Negative Prompt
    const toggleNegativeBtn = aiDialog.locator('button:has-text("Negative Prompt")').first();
    await expect(toggleNegativeBtn).toBeVisible();
    await toggleNegativeBtn.click();

    // Click negative chips
    const blurryChip = aiDialog.locator('button:has-text("blurry")').first();
    await expect(blurryChip).toBeVisible();
    await blurryChip.click();

    // Verify Curated Style Presets
    const browsePresetsBtn = aiDialog.locator('button:has-text("Browse Presets")').first();
    await expect(browsePresetsBtn).toBeVisible();
    await browsePresetsBtn.click();

    // Verify presets grid shows presets
    const cyberpunkPreset = aiDialog.locator('button:has-text("Cyberpunk Neon")').first();
    await expect(cyberpunkPreset).toBeVisible();
    await cyberpunkPreset.click();

    // Verify Style Reference preview card appears with influence and palette
    await expect(aiDialog.locator('text=Cyberpunk Neon').first()).toBeVisible({ timeout: 5000 });

    // Verify Influence buttons
    const strongBtn = aiDialog.locator('button:has-text("strong")').first();
    await expect(strongBtn).toBeVisible();
    await strongBtn.click();
  });
});
