import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'node',
            include: ['src/**/*.test.{ts,tsx}'],
            exclude: ['e2e/**', 'node_modules/**', 'src/**/*.db.test.ts'],
          },
        },
        {
          extends: true,
          test: {
            // Against the real database; `pnpm test:db` loads .env.local.
            name: 'db',
            environment: 'node',
            include: ['src/**/*.db.test.ts'],
            testTimeout: 30_000,
            hookTimeout: 30_000,
          },
        },
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: fileURLToPath(new URL('.storybook', import.meta.url)),
            }),
          ],
          test: {
            name: 'storybook',
            // Three engines load the stories at once; Firefox's first loads
            // can pass 15 s on a busy machine.
            testTimeout: 60_000,
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [
                { browser: 'chromium' },
                { browser: 'firefox' },
                { browser: 'webkit' },
              ],
            },
          },
        },
      ],
    },
  }),
);
