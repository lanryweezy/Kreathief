import { test, expect } from '@playwright/test';

test.describe('AI Studio GUI Generation Flows', () => {
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

  test('should generate an AI image from GUI and place it onto the canvas', async ({ page }) => {
    await page.keyboard.press('Escape');

    // 1. Open AI Tools dialog from Header
    const aiButton = page.locator('button[aria-label="Open AI tools"]').first();
    await expect(aiButton).toBeVisible({ timeout: 8000 });
    await aiButton.click();

    const aiDialog = page.locator('div[aria-label="AI Tools"]');
    await expect(aiDialog).toBeVisible({ timeout: 8000 });

    // 2. Select Image Gen tab
    const imageGenTab = aiDialog.locator('button:has-text("Image Gen")').first();
    await expect(imageGenTab).toBeVisible();
    await imageGenTab.click();

    // 3. Fill in prompt
    const promptInput = aiDialog.locator('textarea[data-testid="magic-prompt-input"]').first();
    await expect(promptInput).toBeVisible({ timeout: 10000 });
    await promptInput.fill('Cyberpunk neon holographic sphere');

    // 4. Click Generate Image button
    const generateBtn = aiDialog.locator('button:has-text("Generate Image")').first();
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 5. Verify image layer was added on the canvas
    const canvasImages = page.locator('.design-artboard img, .canvas-container img');
    await expect(canvasImages.first()).toBeVisible({ timeout: 15000 });
  });

  test('should generate 3 design variants from Design Agent and apply to canvas', async ({ page }) => {
    await page.keyboard.press('Escape');

    // 1. Open AI Tools dialog from Header
    const aiButton = page.locator('button[aria-label="Open AI tools"]').first();
    await expect(aiButton).toBeVisible({ timeout: 8000 });
    await aiButton.click();

    const aiDialog = page.locator('div[aria-label="AI Tools"]');
    await expect(aiDialog).toBeVisible({ timeout: 8000 });

    // 2. Switch to Design Agent tab
    const agentTab = aiDialog.locator('button:has-text("Design Agent")').first();
    await expect(agentTab).toBeVisible();
    await agentTab.click();

    // 3. Fill in design prompt
    const designInput = aiDialog.locator('textarea').first();
    await expect(designInput).toBeVisible({ timeout: 8000 });
    await designInput.fill('Modern coffee shop discount banner');

    // 4. Click the start workflow button
    const startWorkflowBtn = aiDialog.locator('button[aria-label="Start AI Design Workflow"]').first();
    await expect(startWorkflowBtn).toBeVisible();
    await startWorkflowBtn.click();

    // 5. Wait for curation complete and variant cards to appear
    await expect(aiDialog.locator('text=Curation Complete').first()).toBeVisible({ timeout: 15000 });
    await expect(aiDialog.locator('text=VARIANTS').first()).toBeVisible();

    // 6. Click "Apply to Canvas" on the first variant card
    const applyBtn = aiDialog.locator('button:has-text("Apply to Canvas"), button:has-text("Apply")').first();
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // 7. Verify layers were loaded onto the canvas
    await expect(
      page.locator('.design-artboard [data-layer-id], .canvas-container [data-layer-id]').first()
    ).toBeVisible({ timeout: 8000 });
  });
});
