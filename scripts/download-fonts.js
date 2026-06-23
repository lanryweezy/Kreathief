/**
 * Download Google Fonts locally
 * Downloads font files from Google Fonts CDN
 */

import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FONTS_DIR = join(__dirname, 'public', 'fonts');

// Core fonts to download with correct Google Fonts API format
const CORE_FONTS = [
  {
    family: 'Inter',
    apiName: 'Inter',
    weights: ['300', '400', '500', '600', '700'],
  },
  {
    family: 'Space Grotesk',
    apiName: 'Space+Grotesk',
    weights: ['300', '400', '500', '600', '700'],
  },
  {
    family: 'Outfit',
    apiName: 'Outfit',
    weights: ['300', '400', '500', '600', '700', '800'],
  },
];

async function downloadFont(family, apiName, weight) {
  const filename = `${family.replace(/\s+/g, '-')}-${weight}.ttf`;
  const filePath = join(FONTS_DIR, filename);

  try {
    // Fetch CSS from Google Fonts
    const cssUrl = `https://fonts.googleapis.com/css2?family=${apiName}:wght@${weight}&display=swap`;

    const cssResponse = await fetch(cssUrl);
    if (!cssResponse.ok) {
      throw new Error(`Failed to fetch CSS: ${cssResponse.statusText}`);
    }
    const cssText = await cssResponse.text();

    // Extract the .ttf URL from the CSS
    const urlMatch = cssText.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf[^)]*)\)/);

    if (!urlMatch) {
      throw new Error('No .ttf URL found in CSS');
    }

    const fontUrl = urlMatch[1];

    // Download the font file
    const fontResponse = await fetch(fontUrl);
    if (!fontResponse.ok) {
      throw new Error(`Failed to download font: ${fontResponse.statusText}`);
    }

    const buffer = Buffer.from(await fontResponse.arrayBuffer());
    await writeFile(filePath, buffer);
    console.log(`✓ Downloaded: ${filename}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to download ${filename}: ${error.message}`);
    return false;
  }
}

async function generateFontCSS() {
  let css = `/* Google Fonts - Local */\n`;
  css += `/* Downloaded from fonts.google.com */\n`;
  css += `/* Core UI Fonts: Inter, Space Grotesk, Outfit */\n\n`;

  for (const font of CORE_FONTS) {
    css += `/* ===== ${font.family} ===== */\n`;

    for (const weight of font.weights) {
      const filename = `${font.family.replace(/\s+/g, '-')}-${weight}.ttf`;
      css += `@font-face {\n`;
      css += `  font-family: '${font.family}';\n`;
      css += `  font-style: normal;\n`;
      css += `  font-weight: ${weight};\n`;
      css += `  font-display: swap;\n`;
      css += `  src: url('/fonts/${filename}') format('truetype');\n`;
      css += `  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n`;
      css += `}\n\n`;
    }
  }

  const cssPath = join(FONTS_DIR, 'fonts.css');
  await writeFile(cssPath, css);
  console.log(`✓ Generated: fonts.css`);
}

async function main() {
  console.log('🚀 Downloading Google Fonts locally...\n');

  // Ensure directory exists
  await mkdir(FONTS_DIR, { recursive: true });

  let successCount = 0;
  let failCount = 0;

  for (const font of CORE_FONTS) {
    console.log(`\n📥 Downloading ${font.family}...`);
    for (const weight of font.weights) {
      const success = await downloadFont(font.family, font.apiName, weight);
      if (success) successCount++;
      else failCount++;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  // Generate the CSS file
  await generateFontCSS();

  console.log(`\n✅ Download complete!`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\n📝 Alternative: Download fonts manually');
    console.log('1. Visit: https://fonts.google.com/download?family=Inter|Space+Grotesk|Outfit');
    console.log('2. Extract the .ttf files to public/fonts/\n');
  } else {
    console.log('\n✨ All fonts downloaded successfully!');
    console.log('   Fonts are located in: public/fonts/\n');
  }
}

main().catch(console.error);
