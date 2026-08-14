import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/* Build used only to produce the shareable single-file artifact. The normal
   config emits three entries that share a vendor chunk, so main-*.js imports
   from it and can't be inlined by concatenation. Building the main entry alone
   removes the shared chunk and yields one JS file to embed. */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-artifact',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
});
