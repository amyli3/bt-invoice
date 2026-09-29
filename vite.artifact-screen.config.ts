import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/* Build used to produce a shareable single-file artifact of ONE screen, as
   opposed to vite.artifact.config.ts, which bundles the whole prototype with
   its nav and hash router.

   A single screen has no lazy routes, so it needs no inlineDynamicImports;
   cssCodeSplit is off so index.css lands in one file that can be embedded
   alongside the JS. Entry: client-preview-invoice-old.html, which mounts
   src/artifact-main.tsx. */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-artifact-cpi',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'client-preview-invoice-old.html'),
      output: { entryFileNames: 'app.js', assetFileNames: 'app.[ext]' },
    },
  },
});
