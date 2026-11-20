import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Only Vitest and Storybook build with Vite; the app is Next.js.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
