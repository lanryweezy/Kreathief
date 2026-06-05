import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    worker: {
      format: 'es',
    },
    build: {
      sourcemap: false,
      rollupOptions: {
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
