import type { PlaywrightTestConfig } from '@playwright/test';

// Runs the end-to-end tests against the Cloudflare build under `wrangler pages dev`,
// which (unlike `vite preview`) honors the generated _routes.json. This catches routes
// that are excluded from the Worker as static but were never prerendered (they 404 in production).
// The compatibility date is pinned because the local runtime rejects today's date.
const config: PlaywrightTestConfig = {
  webServer: {
    command:
      'pnpm build && pnpm exec wrangler pages dev .svelte-kit/cloudflare --port 8788 --compatibility-date=2026-08-01 --compatibility-flags=nodejs_compat',
    url: 'http://localhost:8788',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  testDir: 'tests',
  testMatch: ['end-to-end/test-*.spec.ts', 'cloudflare/*.spec.ts'],
  use: {
    headless: true,
    baseURL: 'http://localhost:8788',
  },
};

export default config;
