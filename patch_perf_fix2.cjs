const fs = require('fs');
let content = fs.readFileSync('tests/e2e/performance/performance.spec.ts', 'utf8');

content = content.replace(
  `const isResponsive = await editor.projectTitleInput.isEnabled();`,
  `const isResponsive = await editor.exportButton.isEnabled();`
);

fs.writeFileSync('tests/e2e/performance/performance.spec.ts', content);
