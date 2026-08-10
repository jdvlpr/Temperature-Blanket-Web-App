// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

// Thin wrapper around the Cloudflare Cache API (`platform.caches.default`) so server
// routes can memoize a JSON-serializable computation at the edge. `platform` is only
// populated when the adapter emulates/provides it (Cloudflare dev/preview/production);
// callers get a correct uncached result either way.

/**
 * Runs `compute` and caches its JSON-serialized result at `platform.caches.default`,
 * keyed by `keyParts` (joined into a synthetic same-origin request URL so the key
 * stays within the deployed zone regardless of the real request's method/path).
 * Falls back to calling `compute` directly whenever `platform.caches` isn't available.
 *
 * On a cache hit the result is JSON round-tripped, so non-JSON-safe values (e.g.
 * `Date` fields) come back as their serialized form, not their original type.
 */
export async function cachedJSON<T>(
  platform: App.Platform | undefined,
  requestUrl: string | URL,
  keyParts: (string | number)[],
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  const cache = platform?.caches?.default;
  if (!cache) return compute();

  const cacheKey = new URL(
    `/__edge-cache/${keyParts.map((part) => encodeURIComponent(String(part))).join('/')}`,
    requestUrl,
  );

  const cached = await cache.match(cacheKey);
  if (cached) return (await cached.json()) as T;

  const data = await compute();
  const cacheResponse = new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json',
      'cache-control': `public, max-age=${ttlSeconds}`,
    },
  });
  // `@cloudflare/workers-types`' `Response` (loaded globally via the adapter-cloudflare
  // ambient types for `platform.caches`) adds Workers-only fields (e.g. `webSocket`)
  // that the DOM `Response` built above never has at the type level, though the two
  // are the same object at runtime under the Workers runtime.
  await cache.put(
    cacheKey,
    cacheResponse as unknown as Parameters<typeof cache.put>[1],
  );
  return data;
}
