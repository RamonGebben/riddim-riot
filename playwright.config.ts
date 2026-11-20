import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
/**
 * A small landscape phone's worth of pixels. The runner draws WebGL in
 * software, where a 1280x720 frame took WebKit over a second and the
 * game crawled; at this size it keeps up.
 */
const viewport = { width: 640, height: 360 };

export default defineConfig({
  testDir: 'e2e',
  // The game is real time: its audio clock and frames starve when a few
  // browsers share a small CI runner (Firefox stalled mid-level), so CI
  // runs one at a time and every step gets a little longer.
  workers: process.env.CI ? 1 : undefined,
  expect: { timeout: 10_000 },
  use: { baseURL: `http://localhost:${PORT}` },
  // Every engine: Tone's audio differs across them (Firefox once failed to
  // start while Chromium played fine).
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport } },
  ],
  // CI plays the production build; locally the dev server compiles on
  // first request, so the first test waits a little longer.
  webServer: {
    command: process.env.CI
      ? `pnpm build && pnpm exec next start --port ${PORT}`
      : `pnpm exec next dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
