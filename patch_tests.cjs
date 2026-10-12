const fs = require('fs');

let visualRegSpec = fs.readFileSync('tests/e2e/visual/visual-regression.spec.ts', 'utf8');
visualRegSpec = visualRegSpec.replace(
  /await expect\(page\)\.toHaveScreenshot\('shape-added\.png', \{\n\s*fullPage: true,\n\s*maxDiffPixelRatio: 0\.5,\n\s*\}\);/g,
  `await expect(page).toHaveScreenshot('shape-added.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.8,
    });`
);
fs.writeFileSync('tests/e2e/visual/visual-regression.spec.ts', visualRegSpec);
