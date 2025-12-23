import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic'
  })],
  server: {
    port: 5173,
    // Ensure SPA routing works - all routes should fallback to index.html
    strictPort: false,
  },
  preview: {
    port: 5173,
    // For preview mode, ensure SPA routing works
    strictPort: false,
  },
  esbuild: {
    jsx: 'automatic'
  },
  // Explicitly set app type to SPA
  appType: 'spa',
});

