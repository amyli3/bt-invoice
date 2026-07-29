import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['invoice-reimagined.localhost'],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'selections-invoicing': resolve(__dirname, 'selections-invoicing/index.html'),
        aia: resolve(__dirname, 'aia.html'),
      },
    },
  },
});
