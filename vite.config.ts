import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.svg'],
        manifest: {
          name: 'Kreathief - AI Design Suite',
          short_name: 'Kreathief',
          description: 'Unlock your creativity with AI-powered layouts and stickers.',
          theme_color: '#1f1f1f',
          background_color: '#1f1f1f',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          icons: [
            {
              src: 'logo.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          globIgnores: ['**/*.map'],
        },
      }),
    ],
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ai': ['@google/generative-ai'],
            'vendor-utils': ['uuid', 'zustand'],
            'vendor-export': ['jspdf', 'ag-psd', 'imagetracerjs'],
            'vendor-graphics': ['opentype.js', '@imgly/background-removal'],
          },
        },
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
    },
  };
});
