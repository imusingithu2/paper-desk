import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  root: process.cwd(),
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173
  }
});
