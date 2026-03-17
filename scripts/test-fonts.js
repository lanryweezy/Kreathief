/**
 * Debug script to see what Google Fonts CSS returns
 */

async function test() {
  const cssUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap';
  
  const response = await fetch(cssUrl);
  const cssText = await response.text();
  
  console.log('CSS Response:');
  console.log('---');
  console.log(cssText);
  console.log('---\n');
  
  // Try to extract URLs
  const urlMatches = [...cssText.matchAll(/url\(([^)]+)\)/g)];
  console.log('Found URLs:');
  urlMatches.forEach((m, i) => {
    console.log(`${i + 1}. ${m[1]}`);
  });
}

test().catch(console.error);
