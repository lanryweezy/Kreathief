# Local Setup Guide - Kreathief

## Overview
This guide explains how to run Kreathief completely locally without depending on external CDNs for Tailwind CSS and Google Fonts.

## Changes Made

### 1. **Tailwind CSS** ✅
Tailwind CSS is already installed as a local dev dependency. No changes needed.

**Configuration:**
- `tailwind.config.js` - Updated with proper content paths and local font families
- `index.css` - Contains `@tailwind` directives that compile to full CSS during build

### 2. **Google Fonts** ✅
Downloaded core fonts locally to eliminate CDN dependency:

**Downloaded Fonts:**
- Inter (300, 400, 500, 600, 700)
- Space Grotesk (300, 400, 500, 600, 700)
- Outfit (300, 400, 500, 600, 700, 800)

**Location:** `public/fonts/`

**Files:**
- `Inter-*.ttf` (5 files)
- `Space-Grotesk-*.ttf` (5 files)
- `Outfit-*.ttf` (6 files)
- `fonts.css` - @font-face declarations

### 3. **Font Loader Service** ✅
Updated `services/FontLoader.ts` to:
- Try loading local fonts first using FontFace API
- Fall back to Google Fonts CDN if local fonts fail
- Maintain compatibility with custom user-uploaded fonts

### 4. **Index.html** ✅
- Removed Google Fonts CDN links
- Added reference to local `/fonts/fonts.css`

### 5. **GlyphPalette Component** ✅
Updated to try local fonts first before falling back to CDN for font glyph extraction.

## How to Run Locally

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Download Fonts (if not already present):**
   ```bash
   node scripts/download-fonts.js
   ```
   This script downloads the core fonts from Google Fonts and places them in `public/fonts/`.

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

4. **Build for Production:**
   ```bash
   npm run build
   ```
   Production files will be in the `dist/` directory.

5. **Preview Production Build:**
   ```bash
   npm run preview
   ```

## File Structure

```
kreathief/
├── public/
│   └── fonts/                    # Local font files
│       ├── Inter-300.ttf
│       ├── Inter-400.ttf
│       ├── Inter-500.ttf
│       ├── Inter-600.ttf
│       ├── Inter-700.ttf
│       ├── Space-Grotesk-300.ttf
│       ├── Space-Grotesk-400.ttf
│       ├── Space-Grotesk-500.ttf
│       ├── Space-Grotesk-600.ttf
│       ├── Space-Grotesk-700.ttf
│       ├── Outfit-300.ttf
│       ├── Outfit-400.ttf
│       ├── Outfit-500.ttf
│       ├── Outfit-600.ttf
│       ├── Outfit-700.ttf
│       ├── Outfit-800.ttf
│       └── fonts.css             # @font-face declarations
├── scripts/
│   └── download-fonts.js         # Script to download fonts
├── src/
│   └── services/
│       └── FontLoader.ts         # Updated to use local fonts
├── index.html                    # Updated to use local fonts
├── tailwind.config.js            # Updated with local font config
└── index.css                     # Tailwind directives
```

## Network Independence

With this setup:
- ✅ **Tailwind CSS** - 100% local, no CDN dependency
- ✅ **Core Fonts** - Inter, Space Grotesk, Outfit loaded locally
- ✅ **Custom Fonts** - User-uploaded fonts work locally
- ⚠️ **Other Google Fonts** - Will fall back to CDN if not available locally

For complete offline operation with additional fonts:
1. Add font family to `CORE_FONTS` in `scripts/download-fonts.js`
2. Run `node scripts/download-fonts.js`
3. Update `services/FontLoader.ts` if needed

## Troubleshooting

### Fonts Not Loading

1. **Check browser console** for 404 errors on font files
2. **Verify font files exist** in `public/fonts/`
3. **Check fonts.css paths** - should be `/fonts/FontName-Weight.ttf`

### Tailwind Styles Not Applying

1. **Ensure index.css contains:**
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
2. **Rebuild the app:** `npm run build`
3. **Clear browser cache**

### Build Errors

Some TypeScript errors may exist in the codebase. These are pre-existing and don't affect runtime:
- Run `npm run dev` instead of build for development
- Fix type errors as needed for your use case

## Performance Benefits

- **Faster Initial Load** - No external HTTP requests for fonts/CSS
- **Better Privacy** - No Google Fonts tracking
- **Offline Support** - Works without internet (for core features)
- **Consistent Rendering** - Fonts always available, no FOUT

## Maintenance

### Adding New Fonts

1. Edit `scripts/download-fonts.js` and add to `CORE_FONTS` array
2. Run `node scripts/download-fonts.js`
3. Update `tailwind.config.js` if needed:
   ```js
   fontFamily: {
     'new-font': ['New Font', 'system-ui', 'sans-serif'],
   }
   ```

### Updating Fonts

Re-run the download script:
```bash
node scripts/download-fonts.js
```

## Security Notes

- All assets are now served from your own domain
- No third-party CDN dependencies for core functionality
- Custom user fonts are stored in IndexedDB (local storage)

## License

Fonts are subject to their respective licenses:
- Inter: SIL Open Font License 1.1
- Space Grotesk: SIL Open Font License 1.1
- Outfit: SIL Open Font License 1.1

See https://fonts.google.com/ for detailed font licenses.
