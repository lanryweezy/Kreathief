import { test, expect } from '@playwright/test';

test('debug load', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.addInitScript(() => {
    window.localStorage.setItem('kreathief_qa_session', JSON.stringify({
      id: 'qa-user',
      email: 'qa@kreathief.app',
      name: 'QA Engineer',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qa',
      plan: 'pro'
    }));
    window.localStorage.setItem('kreathief_onboarding_seen', 'true');
  });

  console.log('Navigating to dashboard...');
  await page.goto('/dashboard');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'debug_dashboard.png', fullPage: true });
  console.log('Dashboard screenshot taken.');

  const newDesignBtn = page.getByRole('button', { name: /New Design/i });
  if (await newDesignBtn.isVisible()) {
    console.log('Clicking New Design button...');
    await newDesignBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'debug_modal.png' });

    console.log('Filling design name and launching...');
    await page.getByPlaceholder('My Awesome Design').fill('Debug Project');
    await page.getByRole('button', { name: /Launch Editor/i }).click();

    await page.waitForURL(/.*editor/);
    console.log('Navigated to editor.');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'debug_editor.png', fullPage: true });
    console.log('Editor screenshot taken.');
  } else {
    console.log('New Design button NOT VISIBLE');
  }
});
