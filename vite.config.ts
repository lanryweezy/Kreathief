import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const apiProxyPlugin = (env: Record<string, string>) => ({
  name: 'api-proxy-plugin',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url?.startsWith('/api/openrouter') && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk);
        req.on('end', async () => {
          if (!env.OPENROUTER_API_KEY) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 401;
            res.end(JSON.stringify({ error: 'OpenRouter API key not configured' }));
            return;
          }
          try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': env.VITE_FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'Kreathief',
              },
              body: body
            });
            const data = await response.text();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = response.status;
            res.end(data);
          } catch(e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({error: e.message}));
          }
        });
        return;
      }
      
      if (req.url?.startsWith('/api/fal') && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk);
        req.on('end', async () => {
          if (!env.FAL_KEY) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 401;
            res.end(JSON.stringify({ error: 'Fal.ai API key not configured' }));
            return;
          }
          try {
            const parsed = JSON.parse(body);
            const { endpoint, body: falBody } = parsed;
            const targetUrl = endpoint.startsWith('http') ? endpoint : `https://fal.run/${endpoint}`;
            const response = await fetch(targetUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${env.FAL_KEY}`
              },
              body: JSON.stringify(falBody)
            });
            const data = await response.text();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = response.status;
            res.end(data);
          } catch(e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({error: e.message}));
          }
        });
        return;
      }
      
      next();
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      apiProxyPlugin(env),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
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
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['framer-motion', 'zustand', 'zod'],
            'vendor-ai': ['@google/generative-ai'],
            'vendor-pdf': ['jspdf', 'pdf-lib', 'ag-psd'],
            'vendor-math': ['mathjs'],
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
      port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
      allowedHosts: ['.vercel.app', '.vercel.sh', '.vercel.run', 'localhost'],
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path,
        },
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || ''),
    },
    optimizeDeps: {
      include: ['onnxruntime-web'],
      exclude: ['@imgly/background-removal'],
    },
  };
});
