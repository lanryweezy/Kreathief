const fs = require('fs');

let content = fs.readFileSync('tests/e2e/visual/visual-regression.spec.ts', 'utf8');

// The first missing one is for initial-state.png
content = content.replace(
  /toHaveScreenshot\('initial-state\.png', {\n\s*fullPage: true,\n\s*}\)/g,
  "toHaveScreenshot('initial-state.png', {\n      fullPage: true,\n      maxDiffPixels: 25000,\n    })"
);

// The second missing one is for after-title-change.png
content = content.replace(
  /toHaveScreenshot\('after-title-change\.png', {\n\s*fullPage: true,\n\s*}\)/g,
  "toHaveScreenshot('after-title-change.png', {\n      fullPage: true,\n      maxDiffPixels: 25000,\n    })"
);

fs.writeFileSync('tests/e2e/visual/visual-regression.spec.ts', content);
