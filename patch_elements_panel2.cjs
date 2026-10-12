const fs = require('fs');
let content = fs.readFileSync('components/panels/ElementsPanel.tsx', 'utf8');

// Also explicitly add aria-label to the buttons rendering the shape presets
content = content.replace(
  /id=\{\`shape-btn-\$\{item\.name\.toLowerCase\(\)\.replace\(\/\[\^a-z0-9\]\+\/g, '-'\)\}\`\}/g,
  `id={\`shape-btn-\${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}\`}
                    aria-label={item.name}`
);

fs.writeFileSync('components/panels/ElementsPanel.tsx', content);
