/// <reference types="@sveltejs/adapter-cloudflare" />

import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    interface Platform {
      // Cloudflare bindings. All optional: production has none of these until
      // accounts ship, so use the helpers in $lib/server/platform.
      env?: {
        DB?: D1Database;
        PROJECTS?: R2Bucket;
        ENABLE_DEV_ROUTES?: string;
        EMAIL_SENDER?: string;
        ACCOUNTS_ENABLED?: string;
        BETTER_AUTH_SECRET?: string;
        AUTH_ALLOWED_HOSTS?: string;
        AUTH_PROTOCOL?: string;
        RESEND_API_KEY?: string;
        EMAIL_FROM?: string;
        GOOGLE_CLIENT_ID?: string;
        GOOGLE_CLIENT_SECRET?: string;
      };
    }
  }

  // Whether account UI is built in: PUBLIC_ACCOUNTS_ENABLED=true at build time (vite.config.ts)
  const __ACCOUNTS_ENABLED__: boolean;

  interface Window {
    clarity?: (action: string, ...args: unknown[]) => void;
    MS_CLARITY_ID?: string | null;
  }
}

export {};
