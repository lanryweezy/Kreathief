import { test, expect } from '@playwright/test';

test('verify final UI state', async ({ page }) => {
  // Set larger viewport to accommodate 3-column layout
  await page.setViewportSize({ width: 1600, height: 900 });

  // Go to the app
  console.log('Navigating to app...');
  await page.goto('http://localhost:5174/');

  // Wait for loading to complete
  await page.waitForSelector('text=Loading Kreathief...', { state: 'hidden', timeout: 30000 });

  // If on landing page, click Start Free
  if (page.url().includes('5174/') || page.url().endsWith('5174')) {
    console.log('On landing page, clicking START FREE');
    await page.click('text=START FREE');
    await page.waitForURL('**/auth');
  }

  console.log('On auth page, filling login...');
  // Handle Login
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("Sign In")');

  // Should be on dashboard
  console.log('Waiting for dashboard...');
  await page.waitForURL('**/dashboard', { timeout: 30000 });

  // Handle Welcome Modal
  console.log('Checking for welcome modal...');
  // The "I'll figure it out myself" button
  const skipTourBtn = page.getByRole('button', { name: "I'll figure it out myself" });

  try {
    await skipTourBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Clicking skip tour...');
    await skipTourBtn.click({ force: true });
  } catch (e) {
    console.log('Welcome modal not found or already closed.');
  }

  // Create new project
  console.log('Creating project...');
  const createBtn = page.locator('#create-btn');
  await createBtn.click({ force: true });
  await page.waitForURL('**/editor', { timeout: 30000 });

  console.log('In editor, verifying changes...');

  // 1. Verify Header Cleanup
  const homeLink = page.locator('a:has-text("Home")');
  const projectTitleInput = page.locator('input[value="Untitled Design"]');
  const savedText = page.locator('text=Saved');

  await expect(homeLink).not.toBeVisible();
  await expect(projectTitleInput).not.toBeVisible();
  await expect(savedText).not.toBeVisible();

  // 2. Verify Canvas Toolbar Removal
  const topToolbarContainer = page.locator('div.absolute.top-4.left-1\\/2.-translate-x-1\\/2.z-10');
  await expect(topToolbarContainer).not.toBeVisible();

  // 3. Verify AI Assistant Location
  console.log('Verifying AI Assistant...');
  await page.click('button[title="AI Assistant"]');
  const leftSidePanel = page.locator('aside.border-r');
  await expect(leftSidePanel.locator('h2:has-text("AI Assistant")')).toBeVisible();

  // 4. Verify Selection/Drag Logic
  console.log('Verifying selection logic...');
  await page.click('button[title="Shapes"]');
  await page.click('button:has-text("Rectangle")');

  const rectLayer = page.locator('span:has-text("Rectangle")').first();
  await expect(rectLayer).toBeVisible();

  // Click on canvas
  await page.mouse.click(800, 450);

  const selectedLayer = page.locator('div.bg-white\\/10.border-l-2.border-\\[\\#7d2ae8\\]');
  await expect(selectedLayer).toBeVisible();

  // Drag - should stay selected
  await page.mouse.move(800, 450);
  await page.mouse.down();
  await page.mouse.move(900, 550);
  await page.mouse.up();
  await expect(selectedLayer).toBeVisible();

  // 5. Verify Mockup Studio 3-Column Layout
  console.log('Verifying Mockup Studio layout...');
  await page.click('button[title="Mockup Studio"]');

  // Left column
  await expect(page.locator('input[placeholder*="Search mockups"]')).toBeVisible();

  // Center column
  await expect(page.locator('div:has-text("Preview")').filter({ hasText: /^Preview$/ })).toBeVisible();

  // Right column
  await expect(page.locator('text=Corner Pinning (4-Point Perspective)')).toBeVisible();
  await expect(page.locator('text=Position (X / Y)')).toBeVisible();

  // Final Screenshot
  await page.screenshot({ path: 'final_ui_verification_full.png', fullPage: true });
  console.log('Verification complete.');
});
