import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'assets/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/main.ts'),
      output: {
        format: 'iife',
        entryFileNames: 'ess-3d-canvas.js',
        assetFileNames: 'ess-3d-canvas.[ext]',
      },
    },
    cssCodeSplit: false,
    sourcemap: false,
  },
  publicDir: false,
});
