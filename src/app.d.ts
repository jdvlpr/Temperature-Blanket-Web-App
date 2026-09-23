/// <reference types="@sveltejs/adapter-cloudflare" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
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
