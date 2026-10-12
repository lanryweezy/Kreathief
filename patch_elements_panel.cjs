const fs = require('fs');
const content = fs.readFileSync('components/panels/ElementsPanel.tsx', 'utf8');

// Add an ID to the button to make it easy to find in E2E tests
const newContent = content.replace(
  /onClick=\{\(\) => internalAddShape\(item.type, \{ \.\.\.item\.props, name: item\.name \}, item\.name\)\}/g,
  (match, offset) => {
    // We want to add an ID based on the item name to the button
    return match + `\n                    id={\`shape-btn-\${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}\`}`;
  }
);

fs.writeFileSync('components/panels/ElementsPanel.tsx', newContent);
