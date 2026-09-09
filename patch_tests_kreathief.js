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

  if (content.includes('addInitScript')) {
    let newContent = content;
    // Remove if it exists to avoid duplicates
    newContent = newContent.replace(/localStorage\.setItem\('kreathief_editor_tour_seen', 'true'\);\n?/g, '');
    newContent = newContent.replace(/localStorage\.setItem\("kreathief_editor_tour_seen", "true"\);\n?/g, '');
    newContent = newContent.replace(/window\.localStorage\.setItem\('kreathief_editor_tour_seen', 'true'\);\n?/g, '');
    newContent = newContent.replace(/window\.localStorage\.setItem\("kreathief_editor_tour_seen", "true"\);\n?/g, '');

    // Add it after kreathief_onboarding_seen_v2
    newContent = newContent.replace(
      /(setItem\('kreathief_onboarding_seen_v2', 'true'\);)/,
      "$1\n      localStorage.setItem('kreathief_editor_tour_seen', 'true');"
    );

    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Patched ${file}`);
    }
  }
}
