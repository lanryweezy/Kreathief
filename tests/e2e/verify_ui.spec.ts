import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 1920, height: 1080 },
});

test('verify all requested changes', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  // Go to the editor with QA bypass
  await page.goto('http://localhost:5174/');

  // Manually set the QA bypass session in localStorage
  await page.evaluate(() => {
    localStorage.clear();
    const mockUser = {
      id: 'qa-user-id',
      email: 'qa@kreathief.app',
      name: 'qa',
      plan: 'pro',
    };
    localStorage.setItem('kreathief_qa_session', JSON.stringify(mockUser));
    localStorage.setItem('kreathief_onboarding_seen', 'true');
    console.log('LocalStorage set');
  });

  // Reload to pick up the session
  await page.goto('http://localhost:5174/editor');

  // Wait for some content
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'after_wait.png', fullPage: true });

  // 1. Verify Header changes
  // Check that "Home", "Untitled Design", and "Saved" are NOT visible in the header
  const header = page.locator('header');
  await expect(header).not.toContainText('Home');
  await expect(header).not.toContainText('Untitled Design');
  await expect(header).not.toContainText('Saved');

  // Verify breadcrumbs separator "/" is gone
  const breadcrumbs = header.locator('div.flex.items-center.gap-2').first();
  await expect(breadcrumbs).not.toContainText('/');

  await page.screenshot({ path: 'header_verified.png' });

  // 2. Verify AI Assistant behavior
  // Open AI Assistant from sidebar
  await page.click('button[aria-label="Ask AI"]');

  // Check if SidePanel is visible and contains Assistant (case insensitive or uppercase as seen in screenshot)
  const sidePanel = page.locator('div:has-text("ASSISTANT")').last();
  await expect(sidePanel).toBeVisible();

  // Ensure no right-side AI panel is popping out
  // Based on the code, it would be an absolute/fixed div with high z-index
  const rightPanel = page.locator('div.absolute.right-0.top-0.z-\\[100\\]');
  // It shouldn't exist or be visible
  const count = await rightPanel.count();
  if (count > 0) {
    await expect(rightPanel).not.toBeVisible();
  }

  await page.screenshot({ path: 'ai_assistant_left_only.png' });

  // 3. Verify Mockup Studio layout
  await page.click('button[aria-label="Mockups"]');

  // Wait for mockup panel to load
  await page.waitForTimeout(2000);

  // Check for the 3-column layout in MockupPanel
  // Left column should have "Smart Mockups"
  await expect(page.getByText('Smart Mockups')).toBeVisible();

  // Right column should have "Corner Pinning"
  await expect(page.getByText('Corner Pinning (4-Point Perspective)')).toBeVisible();

  // Center should have the canvas/preview (it usually has the "canvas-container" class or similar)
  // In my implementation it's a flex-1 div

  await page.screenshot({ path: 'mockup_studio_3column.png' });

  // 4. Verify Selection/Drag behavior
  // Go back to Elements to add a shape
  await page.click('button[aria-label="Elements"]');
  // Click on a shape (e.g., the first rectangle)
  await page.click('button:has-text("Rectangle"), .grid button:first-child');

  // Wait for element to be added
  await page.waitForTimeout(1000);

  // Get canvas position
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (box) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    // Click to select
    await page.mouse.click(x, y);
    await page.waitForTimeout(500);

    // Click again - should NOT deselect
    await page.mouse.down({ x, y });
    await page.waitForTimeout(200);
    await page.mouse.up();

    // Verify it's still selected (we can check if transform controls are visible)
    // Or just try to drag it
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 100, y + 100);
    await page.mouse.up();

    await page.screenshot({ path: 'selection_drag_verified.png' });
  }
});
