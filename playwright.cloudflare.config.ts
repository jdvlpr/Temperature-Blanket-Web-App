import type { PlaywrightTestConfig } from '@playwright/test';

// Runs the end-to-end tests against the Cloudflare build under `wrangler pages dev`,
// which (unlike `vite preview`) honors the generated _routes.json. This catches routes
// that are excluded from the Worker as static but were never prerendered (they 404 in production).
// Bindings (local D1 and R2), compatibility settings and dev-only vars come from wrangler.jsonc.
const config: PlaywrightTestConfig = {
  webServer: [
    {
      command: [
        'PUBLIC_ACCOUNTS_ENABLED=true pnpm build',
        'pnpm db:migrate:local',
        // Ravelry sign-in goes to the fake server below
        'pnpm exec wrangler pages dev .svelte-kit/cloudflare --port 8788' +
          ' --binding RAVELRY_CLIENT_ID=fake-client --binding RAVELRY_CLIENT_SECRET=fake-secret' +
          ' --binding RAVELRY_OAUTH_URL=http://localhost:8790' +
          ' --binding RAVELRY_API_URL=http://localhost:8790',
      ].join(' && '),
      url: 'http://localhost:8788',
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    {
      command: 'node tests/cloudflare/fake-ravelry-server.mjs',
      url: 'http://localhost:8790',
      reuseExistingServer: !process.env.CI,
    },
  ],
  testDir: 'tests',
  testMatch: ['end-to-end/test-*.spec.ts', 'cloudflare/*.spec.ts'],
  use: {
    headless: true,
    baseURL: 'http://localhost:8788',
  },
};

export default config;
