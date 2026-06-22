import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'https://localhost:4173',
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
  },
  testDir: 'tests/end-to-end',
  use: {
    headless: true,
    ignoreHTTPSErrors: true,
    baseURL: 'https://localhost:4173',
  },
};

export default config;
