import { fileURLToPath } from 'node:url';
import { colorModeScript } from '@pindakaasman/design-system';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Applies a saved color mode before first paint - see the design-system
// skill's "Color modes".
const colorMode = (): Plugin => ({
  name: 'color-mode-script',
  transformIndexHtml: () => [
    { tag: 'script', children: colorModeScript(), injectTo: 'head-prepend' },
  ],
});

export default defineConfig({
  plugins: [react(), colorMode()],
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
