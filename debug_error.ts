import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem(
      'kreathief_user',
      JSON.stringify({
        id: 'test-user',
        name: 'Test Tester',
        email: 'test@example.com',
        plan: 'pro',
      })
    );
    localStorage.setItem('kreathief_onboarding_seen', 'true');
  });

  try {
    console.log('Navigating to root...');
    await page.goto('http://localhost:5175/');

    console.log('Waiting for Start Fresh...');
    await page.waitForSelector('text=Start Fresh', { timeout: 5000 });
    console.log('Found Start Fresh. Clicking...');
    await page.click('text=Start Fresh');

    console.log('Waiting for canvas...');
    await page.waitForSelector('canvas', { timeout: 10000 });
    console.log('Canvas found!');

    // Check sidebar buttons
    const sidebarButtons = await page.locator('#sidebar button').count();
    console.log(`Found ${sidebarButtons} sidebar buttons.`);

    // Find Text button
    const textBtn = page.getByRole('button', { name: 'Text' });
    if (await textBtn.isVisible()) {
      console.log('Text button visible. Clicking...');
      await textBtn.click();

      // Wait for panel content
      try {
        await page.waitForSelector('text=Typography', { timeout: 5000 });
        console.log('Text Panel loaded (Typography header found).');

        // Check for "Add a heading"
        if (await page.isVisible('text=Add a heading')) {
          console.log('"Add a heading" button visible.');
        } else {
          console.log('"Add a heading" button NOT visible.');
          const panelContent = await page.locator('.w-\\[320px\\]').innerText();
          fs.writeFileSync('error_dump.txt', 'PANEL CONTENT:\n' + panelContent);
        }
      } catch (e) {
        console.log('Text Panel did not load typography header.');
        const body = await page.locator('body').innerText();
        fs.writeFileSync('error_dump.txt', 'BODY AFTER TEXT CLICK:\n' + body);
      }
    } else {
      console.log('Text button NOT visible.');
      const sidebarText = await page.locator('#sidebar').innerText();
      fs.writeFileSync('error_dump.txt', 'SIDEBAR CONTENT:\n' + sidebarText);
    }
  } catch (e: any) {
    console.log('Error or Timeout:', e.message);
    const body = await page.locator('body').innerText();
    fs.writeFileSync('error_dump.txt', 'ERROR/TIMEOUT BODY:\n' + body);
  }
  await browser.close();
})().catch((e) => {
  // Ignore cleanup errors - eslint-disable-next-line no-empty
  console.debug('Cleanup error:', e);
});
