import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const manifestPath = resolve(root, 'public/manifest.webmanifest');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const requiredFields = ['id', 'name', 'short_name', 'start_url', 'scope', 'display', 'icons'];
const failures = [];

for (const field of requiredFields) {
  if (!(field in manifest)) failures.push(`Manifest is missing required field: ${field}`);
}

if (manifest.display !== 'standalone' && !manifest.display_override?.includes('standalone')) {
  failures.push('Manifest must provide standalone display mode.');
}

const referencedAssets = [
  ...(manifest.icons ?? []).map((icon) => icon.src),
  ...(manifest.screenshots ?? []).map((screenshot) => screenshot.src),
  '/offline.html',
];

for (const asset of referencedAssets) {
  const assetPath = resolve(root, 'public', asset.replace(/^\//, ''));
  if (!existsSync(assetPath)) failures.push(`Manifest asset is missing: ${asset}`);
}

const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');
if (!indexHtml.includes('manifest.webmanifest')) {
  failures.push('index.html does not link to /manifest.webmanifest.');
}

if (failures.length) {
  console.error('PWA Store validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PWA Store validation passed: ${referencedAssets.length} manifest/offline assets checked.`);
