import JSZip from 'jszip';
import { Artboard, Layer, TextLayer, ShapeLayer, ImageLayer, SiteSettings } from '../types';

/**
 * Heuristic Layout Engine
 * Converts absolute (x,y) layers into Flexbox rows.
 */
function groupLayersIntoRows(layers: Layer[]): Layer[][] {
  const visibleLayers = layers.filter((l) => l.visible !== false);
  // Sort primarily by Y coordinate
  const sorted = [...visibleLayers].sort((a, b) => a.y - b.y);

  const rows: Layer[][] = [];
  let currentRow: Layer[] = [];
  let currentRowBottom = -1;

  sorted.forEach((layer) => {
    if (currentRow.length === 0) {
      currentRow.push(layer);
      currentRowBottom = layer.y + layer.height;
    } else {
      // If this layer overlaps with the current row vertically (with some tolerance)
      const tolerance = 20; // 20px overlap tolerance
      if (layer.y < currentRowBottom + tolerance) {
        currentRow.push(layer);
        currentRowBottom = Math.max(currentRowBottom, layer.y + layer.height);
      } else {
        rows.push(currentRow);
        currentRow = [layer];
        currentRowBottom = layer.y + layer.height;
      }
    }
  });

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // Sort each row by X coordinate
  rows.forEach((row) => row.sort((a, b) => a.x - b.x));

  return rows;
}

/**
 * Generate Tailwind classes for a layer
 */
function getTailwindClasses(layer: Layer): string {
  const classes: string[] = ['relative'];

  // Interactive Hover states
  if (layer.hoverEffects) {
    classes.push('transition-all duration-300');
    if (layer.hoverEffects.scale) classes.push(`hover:scale-105`);
    if (layer.hoverEffects.opacity !== undefined)
      classes.push(`hover:opacity-${Math.round(layer.hoverEffects.opacity * 100)}`);
    if (layer.hoverEffects.shadow) classes.push(`hover:shadow-xl hover:shadow-brand-500/20`);
    if (layer.hoverEffects.color) classes.push(`hover:text-[${layer.hoverEffects.color}]`);
  }

  // Basic styles based on type
  if (layer.type === 'text') {
    const tl = layer as TextLayer;
    if (tl.textAlign === 'center') classes.push('text-center');
    if (tl.textAlign === 'right') classes.push('text-right');
  }

  return classes.join(' ');
}

/**
 * Convert a layer to JSX string
 */
function layerToJSX(layer: Layer, isFullWidthRow: boolean, globalDelayOffset: number = 0): string {
  const tw = getTailwindClasses(layer);
  const base = layer as any;
  const isTransparent = (base.opacity ?? 1) < 0.9;

  // Calculate a staggered delay based on Y position (approx 0.1s per 100px)
  const staggerDelay = Math.min((layer.y / 100) * 0.05, 0.5) + globalDelayOffset;
  const motionProps = `initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: ${staggerDelay.toFixed(2)}, ease: "easeOut" }}`;

  let inlineStyles = `style={{ opacity: ${base.opacity ?? 1}`;

  if (layer.type === 'text') {
    const tl = layer as TextLayer;

    let isHeading = tl.fontSize > 32;
    let tag = isHeading ? 'h1' : tl.fontSize > 24 ? 'h2' : tl.fontSize > 18 ? 'h3' : 'p';

    // AI Trend: Metallic Text Gradients for large headings that are light colored
    let textClasses = tw;
    const isLightColor =
      tl.color && (tl.color === '#ffffff' || tl.color.toLowerCase() === '#fff' || tl.color.startsWith('rgb(255, 255'));

    if (isHeading && isLightColor) {
      textClasses += ` bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/30`;
      // We must remove the inline color so the gradient shows
      inlineStyles += `, fontSize: '${tl.fontSize}px', fontWeight: '${tl.fontWeight}', fontFamily: '${tl.fontFamily}', letterSpacing: '${tl.letterSpacing}px' }}`;
    } else {
      inlineStyles += `, color: '${tl.color}', fontSize: '${tl.fontSize}px', fontWeight: '${tl.fontWeight}', fontFamily: '${tl.fontFamily}', letterSpacing: '${tl.letterSpacing}px' }}`;
    }

    let content = `<motion.${tag} className="${textClasses}" ${inlineStyles} ${motionProps}>${tl.text}</motion.${tag}>`;
    return layer.websiteLink
      ? `<a href="${layer.websiteLink}" className="block cursor-pointer z-10 hover:opacity-80 transition-opacity">${content}</a>`
      : content;
  }

  if (layer.type === 'image') {
    const il = layer as ImageLayer;
    inlineStyles += `, objectFit: 'cover' }}`;
    const alt = il.name || 'image';

    // If full width, likely an atmospheric background or hero image
    const extraClasses = isFullWidthRow
      ? 'w-full object-cover shadow-[0_0_100px_rgba(255,255,255,0.05)]'
      : `w-full h-auto aspect-[${Math.round(il.width)}/${Math.round(il.height)}] rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/5`;

    let content = `<motion.img src="${il.src}" alt="${alt}" className="${tw} ${extraClasses}" ${inlineStyles} ${motionProps} loading="lazy" />`;
    return layer.websiteLink
      ? `<a href="${layer.websiteLink}" className="block w-full cursor-pointer z-10 hover:scale-[1.02] transition-transform">${content}</a>`
      : content;
  }

  if (['rectangle', 'circle'].includes(layer.type)) {
    const sl = layer as ShapeLayer;
    let bg = sl.color || '#334155';

    // AI Trend Bento Box / Glassmorphism heuristic
    let glassClass = isTransparent
      ? 'backdrop-blur-2xl bg-white/[0.02] border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.04] hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] transition-all duration-500 rounded-3xl'
      : 'shadow-2xl rounded-3xl border border-white/5';

    inlineStyles += `, background: '${bg}', borderRadius: '${layer.type === 'circle' ? '50%' : (sl.cornerRadius || 0) + 'px'}', minHeight: ${layer.websiteLink ? `'${sl.height}px'` : 'auto'} }}`;

    const shapeClasses = layer.websiteLink
      ? 'w-auto px-8'
      : `w-full aspect-[${Math.round(sl.width)}/${Math.round(sl.height)}]`;

    // If it looks like a button
    if (sl.height >= 40 && sl.height <= 80 && sl.width >= 100 && sl.width <= 300 && layer.websiteLink) {
      let buttonClass = `${shapeClasses} backdrop-blur-xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer rounded-full`;
      let content = `<motion.button className="${tw} ${buttonClass} flex items-center justify-center" ${inlineStyles} ${motionProps}></motion.button>`;
      return `<a href="${layer.websiteLink}" className="block z-10">${content}</a>`;
    }

    let content = `<motion.div className="${tw} ${shapeClasses} ${glassClass}" ${inlineStyles} ${motionProps}></motion.div>`;
    return layer.websiteLink
      ? `<a href="${layer.websiteLink}" className="block w-full z-10 cursor-pointer hover:scale-[1.02] transition-transform">${content}</a>`
      : content;
  }

  return '';
}

/**
 * Generate a React Component for a Page
 */
function generateReactPage(artboard: Artboard): string {
  const pageName =
    (artboard as any).websitePage?.slug === '/' ? 'Home' : (artboard.name || 'Page').replace(/[^a-zA-Z0-9]/g, '');

  const rows = groupLayersIntoRows(artboard.layers);

  const rowsJSX = rows
    .map((row, idx) => {
      // Determine section type roughly by position
      const isHero = idx === 0;
      const isFooter = idx === rows.length - 1;
      const tag = isHero ? 'header' : isFooter ? 'footer' : 'section';

      if (row.length === 1) {
        // Single element row (maybe full width banner, or centered text)
        const isBanner = row[0].width >= artboard.width * 0.8;
        const alignClass = isBanner ? 'w-full' : 'w-full flex justify-center';
        return `
      {/* Section ${idx + 1} */}
      <${tag} className="relative py-12 ${alignClass} z-10">
        ${layerToJSX(row[0], isBanner, idx * 0.1)}
      </${tag}>`;
      } else {
        // Multi-element row (columns)
        const cols = row.length;
        return `
      {/* Section ${idx + 1} */}
      <${tag} className="relative py-12 w-full grid grid-cols-1 md:grid-cols-${cols} items-center gap-8 max-w-7xl mx-auto px-6 z-10">
        ${row.map((l) => layerToJSX(l, false, idx * 0.1)).join('\n        ')}
      </${tag}>`;
      }
    })
    .join('\n');

  return `import React from 'react';
import { motion } from 'framer-motion';

export default function ${pageName}() {
  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full flex flex-col items-center overflow-x-hidden relative" 
      style={{ backgroundColor: '#000000' }}
    >
      {/* Abstract Glowing AI Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen animate-pulse duration-10000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen animate-pulse duration-7000 delay-1000"></div>
      <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10 mix-blend-screen animate-pulse duration-8000 delay-500"></div>
      
      ${rowsJSX}
    </motion.div>
  );
}
`;
}

/**
 * Generate App.tsx router
 */
function generateAppTsx(pages: Artboard[]): string {
  const imports = pages
    .map((p) => {
      const isHome = (p as any).websitePage?.slug === '/';
      const compName = isHome ? 'Home' : (p.name || 'Page').replace(/[^a-zA-Z0-9]/g, '');
      return `import ${compName} from './pages/${compName}';`;
    })
    .join('\n');

  const routes = pages
    .map((p) => {
      const isHome = (p as any).websitePage?.slug === '/';
      const compName = isHome ? 'Home' : (p.name || 'Page').replace(/[^a-zA-Z0-9]/g, '');
      const path = isHome ? '/' : (p as any).websitePage?.slug || `/${compName.toLowerCase()}`;
      return `<Route path="${path}" element={<${compName} />} />`;
    })
    .join('\n            ');

  return `import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
${imports}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        ${routes}
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <nav className="w-full h-20 bg-slate-900/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 flex items-center px-8 shadow-2xl transition-all">
        <div className="flex gap-8 mx-auto w-full max-w-7xl items-center">
          <div className="text-xl font-black tracking-tighter text-white mr-auto bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-purple-400">Kreathief</div>
          ${pages
            .map((p) => {
              const isHome = (p as any).websitePage?.slug === '/';
              const path = isHome
                ? '/'
                : (p as any).websitePage?.slug || `/${(p.name || 'Page').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
              return `<Link to="${path}" className="text-white/70 hover:text-white font-semibold text-sm transition-colors hover:scale-105 active:scale-95">${p.name}</Link>`;
            })
            .join('\n          ')}
        </div>
      </nav>
      <main className="w-full overflow-hidden bg-[#0a0a0a]">
        <AnimatedRoutes />
      </main>
    </Router>
  );
}
`;
}

/**
 * Generate project boilerplate files
 */
const PACKAGE_JSON = `{
  "name": "kreathief-website",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0",
    "framer-motion": "^10.16.4",
    "lucide-react": "^0.292.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}`;

const VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;

const TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

const POSTCSS_CONFIG = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kreathief Export</title>
  </head>
  <body class="bg-[#000000] text-slate-50 relative min-h-screen">
    <!-- Global Noise Texture Overlay -->
    <svg class="pointer-events-none fixed isolate z-50 opacity-20 mix-blend-soft-light" width="100%" height="100%">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
    <div id="root" class="relative z-10"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

const MAIN_TSX = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

const INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased overflow-x-hidden;
  }
}`;

/**
 * Download website as a React/Vite/Tailwind ZIP
 */
export async function downloadWebsiteAsZip(artboards: Artboard[], siteSettings: SiteSettings | null): Promise<void> {
  const websitePages = artboards.filter((a) => (a as any).websitePage);
  if (websitePages.length === 0) return;

  const zip = new JSZip();

  // Root Config Files
  zip.file('package.json', PACKAGE_JSON);
  zip.file('vite.config.ts', VITE_CONFIG);
  zip.file('tailwind.config.js', TAILWIND_CONFIG);
  zip.file('postcss.config.js', POSTCSS_CONFIG);
  zip.file('index.html', INDEX_HTML);

  // Src Dir
  const src = zip.folder('src');
  if (!src) throw new Error('Failed to create src folder in ZIP');

  src.file('main.tsx', MAIN_TSX);
  src.file('index.css', INDEX_CSS);
  src.file('App.tsx', generateAppTsx(websitePages));

  // Pages Dir
  const pagesDir = src.folder('pages');
  if (!pagesDir) throw new Error('Failed to create pages folder in ZIP');

  websitePages.forEach((page) => {
    const isHome = (page as any).websitePage?.slug === '/';
    const compName = isHome ? 'Home' : (page.name || 'Page').replace(/[^a-zA-Z0-9]/g, '');
    const tsx = generateReactPage(page);
    pagesDir.file(`${compName}.tsx`, tsx);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${(siteSettings?.name || 'kreathief-website').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Ensure backwards compatibility with deploy endpoints which might expect HTML string.
// For Vercel deployment of raw HTML, we still need a stringifier. Since Vercel integration
// requires static files for simple deployments (without build steps), we can generate an HTML build too.
// However, the user asked for full React+Tailwind+Vite export. If Vercel needs HTML, we can provide a basic HTML string.
// Let's provide a fallback `exportWebsite` for the deploy integration.
export async function exportWebsite(artboards: Artboard[], siteSettings: SiteSettings | null) {
  // Return the raw React files as an array for the deployer if it supports it,
  // or a very simplified HTML fallback.
  // The Vercel deployer currently expects { filename: string, html: string }[] and css.
  // We can simulate a Vite "build" by returning the React files.
  // But wait, Vercel REST API needs static assets or a proper framework config.
  // To keep `vercelService` working seamlessly (which uploads raw files), we should probably
  // just return the React project files! Vercel auto-detects Vite if package.json is present.

  const pages = artboards.filter((a) => (a as any).websitePage);

  const files = [
    { filename: 'package.json', html: PACKAGE_JSON },
    { filename: 'vite.config.ts', html: VITE_CONFIG },
    { filename: 'tailwind.config.js', html: TAILWIND_CONFIG },
    { filename: 'postcss.config.js', html: POSTCSS_CONFIG },
    { filename: 'index.html', html: INDEX_HTML },
    { filename: 'src/main.tsx', html: MAIN_TSX },
    { filename: 'src/index.css', html: INDEX_CSS },
    { filename: 'src/App.tsx', html: generateAppTsx(pages) },
  ];

  pages.forEach((page) => {
    const isHome = (page as any).websitePage?.slug === '/';
    const compName = isHome ? 'Home' : (page.name || 'Page').replace(/[^a-zA-Z0-9]/g, '');
    files.push({
      filename: `src/pages/${compName}.tsx`,
      html: generateReactPage(page),
    });
  });

  return {
    pages: files,
    css: '', // Not needed, it's in src/index.css
    siteSettings,
  };
}
