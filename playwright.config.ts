import { defineConfig, devices } from '@playwright/test';

// E2E_PORT lets tests reuse a dev server that's already running (Next allows one per project dir).
const port = process.env.E2E_PORT ?? '3100';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: `http://localhost:${port}` },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: { command: `npm run dev -- --port ${port}`, url: `http://localhost:${port}/pt`, reuseExistingServer: !process.env.CI },
});
