import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [
    // This is the absolute safest way to call the Preact plugin
    (typeof preact === 'function' ? preact() : (preact as any).default())
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
