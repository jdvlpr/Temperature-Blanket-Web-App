/// <reference types="@sveltejs/adapter-cloudflare" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  /** PUBLIC_BETA_INVITE_PERCENT at build time, or 0 (see vite.config.ts) */
  const __BETA_INVITE_PERCENT__: number;

  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }

  interface Window {
    clarity?: (action: string, ...args: unknown[]) => void;
    MS_CLARITY_ID?: string | null;
  }
}

export {};
