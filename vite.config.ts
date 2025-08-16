import path from 'node:path';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact(), tailwindcss() as any],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
