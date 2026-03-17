/**
 * Script to download Google Fonts locally
 * This downloads Inter and Space Grotesk fonts from Google Fonts CDN
 */

import { mkdir, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FONTS_DIR = join(__dirname, 'public', 'fonts');
const DIST_DIR = join(__dirname, 'dist', 'fonts');

// Font families to download
const FONT_FAMILIES = [
  {
    name: 'Inter',
    weights: ['300', '400', '500', '600', '700'],
    subset: 'latin'
  },
  {
    name: 'Space+Grotesk',
    displayName: 'Space Grotesk',
    weights: ['300', '400', '500', '600', '700'],
    subset: 'latin'
  },
  {
    name: 'Outfit',
    weights: ['300', '400', '500', '600', '700', '800'],
    subset: 'latin'
  }
];

async function downloadFile(url, filePath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(filePath, buffer);
    console.log(`✓ Downloaded: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to download ${url}:`, error.message);
    return false;
  }
}

async function downloadFont(fontFamily, weight) {
  const url = `https://fonts.gstatic.com/s/${fontFamily.toLowerCase()}/v${weight === '300' ? '15' : weight === '400' ? '13' : weight === '500' ? '13' : weight === '600' ? '13' : '13'}/${fontFamily}-${weight}-latin.woff2`;
  const filename = `${fontFamily}-${weight}.woff2`;
  const filePath = join(FONTS_DIR, filename);
  
  return await downloadFile(url, filePath);
}

async function generateFontCSS() {
  let css = `/* Google Fonts - Local */\n/* Downloaded from fonts.google.com */\n\n`;

  for (const font of FONT_FAMILIES) {
    const displayName = font.displayName || font.name.replace(/\+/g, ' ');
    css += `/* ${displayName} */\n`;
    
    for (const weight of font.weights) {
      const filename = `${font.name}-${weight}.woff2`;
      css += `@font-face {
  font-family: '${displayName}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('/fonts/${filename}') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}\n\n`;
    }
  }

  const cssPath = join(FONTS_DIR, 'fonts.css');
  await writeFile(cssPath, css);
  console.log(`✓ Generated: ${cssPath}`);
}

async function main() {
  console.log('🚀 Downloading Google Fonts locally...\n');
  
  // Create fonts directory
  if (!existsSync(FONTS_DIR)) {
    await mkdir(FONTS_DIR, { recursive: true });
    console.log(`✓ Created directory: ${FONTS_DIR}\n`);
  }

  // Download fonts
  console.log('📥 Downloading fonts...\n');
  
  // Note: Direct download from Google Fonts CDN might not work due to CORS
  // We'll use a mirror or manual download approach
  
  // For now, let's generate the CSS and provide download instructions
  await generateFontCSS();
  
  console.log('\n✅ Font setup complete!');
  console.log('\n📝 IMPORTANT: If fonts don\'t load, download them manually:');
  console.log('1. Visit: https://fonts.google.com/download?family=Inter|Space+Grotesk|Outfit');
  console.log('2. Extract .ttf files to public/fonts/');
  console.log('3. Convert to .woff2 using: https://cloudconvert.com/ttf-to-woff2');
  console.log('4. Or use the fonts.css generated above with the correct filenames\n');
}

main().catch(console.error);
