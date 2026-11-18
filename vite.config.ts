import { fileURLToPath } from 'node:url';
import { COLOR_MODE_META } from '@pindakaasman/design-system';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// The game is dark by design: force the theme's dark mode with the design
// system's own override tag, whatever the OS prefers.
const darkMode = (): Plugin => ({
  name: 'dark-color-mode',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { name: COLOR_MODE_META, content: 'dark' },
      injectTo: 'head-prepend',
    },
  ],
});

export default defineConfig({
  plugins: [react(), darkMode()],
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Audio and rendering engines change far less often than game code.
        codeSplitting: {
          groups: [
            { name: 'tone', test: /node_modules[\\/]tone/ },
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)/,
            },
          ],
        },
      },
    },
  },
});
