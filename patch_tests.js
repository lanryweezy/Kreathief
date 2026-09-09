import fs from 'fs';
import path from 'path';

function findFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, ext));
    } else if (fullPath.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findFiles('tests/e2e', '.ts');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // We need to find page.addInitScript or context.addInitScript blocks
  // and make sure they include the required localStorage keys.

  if (content.includes('addInitScript')) {
    let newContent = content;
    if (!newContent.includes('kreathief_onboarding_seen_v2')) {
      newContent = newContent.replace(
        /(setItem\('kreathief_onboarding_seen', 'true'\);)/,
        "$1\n      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');\n      localStorage.setItem('kreathief_editor_tour_seen', 'true');"
      );
      newContent = newContent.replace(
        /(setItem\("kreathief_onboarding_seen", "true"\);)/,
        "$1\n      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');\n      localStorage.setItem('kreathief_editor_tour_seen', 'true');"
      );
    }

    // Fallback if the specific replace didn't work but we have addInitScript
    if (!newContent.includes('kreathief_onboarding_seen_v2')) {
      // Just append it inside the addInitScript function body
      newContent = newContent.replace(
        /addInitScript\(\s*(?:async\s*)?\(\)\s*=>\s*\{/,
        "addInitScript(() => {\n      localStorage.setItem('kreathief_onboarding_seen', 'true');\n      localStorage.setItem('kreathief_onboarding_seen_v2', 'true');\n      localStorage.setItem('kreathief_editor_tour_seen', 'true');"
      );
    }

    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Patched ${file}`);
    }
  }
}
