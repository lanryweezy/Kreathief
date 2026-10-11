const fs = require('fs');

let content = fs.readFileSync('services/aiDesignDirector.ts', 'utf8');

// The git checkout removed the import schema type. Add it back.
if (!content.includes('import { SchemaType')) {
  content = `import { SchemaType } from '@google/generative-ai';\n${content}`;
}

fs.writeFileSync('services/aiDesignDirector.ts', content);
