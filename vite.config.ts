import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
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
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
    },
    optimizeDeps: {
      exclude: ['@imgly/background-removal'],
    },
  };
});
