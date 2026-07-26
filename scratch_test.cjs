const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to editor...');
    await page.goto('http://localhost:5174/editor/test-123', { waitUntil: 'networkidle' });
    
    // Dump HTML
    const html = await page.content();
    fs.writeFileSync('page_dump.html', html);
    console.log('Saved page_dump.html');
    
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await browser.close();
  }
})();
