import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
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
