import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `pnpm exec vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
