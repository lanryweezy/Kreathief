import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
        manifest: false,
        devOptions: { enabled: false },
      }),
    ],
    worker: {
      format: 'es',
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['framer-motion', 'zustand', 'zod'],
            'vendor-ai': ['@google/generative-ai'],
            'vendor-pdf': ['jspdf', 'pdf-lib', 'ag-psd'],
          },
        },
        onwarn(warning, warn) {
          // Suppress specific warnings for onnxruntime-web and dynamic imports
          if (warning.code === 'UNRESOLVED_IMPORT' && warning.message.includes('onnxruntime-web')) {
            return;
          }
          if (warning.code === 'DYNAMIC_IMPORT') {
            return;
          }
          warn(warning);
        },
      },
      commonjsOptions: {
        include: [/onnxruntime-web/, /node_modules/],
      },
    },
    resolve: {
      alias: {
        'onnxruntime-web/webgpu': 'onnxruntime-web',
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path,
        },
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(''),
    },
    optimizeDeps: {
      include: ['onnxruntime-web'],
      exclude: ['@imgly/background-removal'],
    },
    ssr: {
      noExternal: ['onnxruntime-web'],
    },
  };
});
