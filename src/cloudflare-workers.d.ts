// The parts of `cloudflare:workers` the app uses (see $lib/server/cloudflare).
// Declared here rather than with `/// <reference types="@cloudflare/workers-types" />`,
// which would swap the DOM's global types (Response, Request, …) for the Workers ones
// across the whole app.
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
  export function waitUntil(promise: Promise<unknown>): void;
}
