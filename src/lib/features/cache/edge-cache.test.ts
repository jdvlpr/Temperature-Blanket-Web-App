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

import { describe, expect, it, vi } from 'vitest';
import { cachedJSON } from './edge-cache';

function fakePlatform() {
  const store = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (key: URL) => {
      const hit = store.get(key.toString());
      return hit ? hit.clone() : undefined;
    }),
    put: vi.fn(async (key: URL, response: Response) => {
      store.set(key.toString(), response.clone());
    }),
  };
  return {
    platform: { caches: { default: cache } } as unknown as App.Platform,
    cache,
    store,
  };
}

describe('cachedJSON', () => {
  it('calls compute directly and skips the cache when platform.caches is unavailable', async () => {
    const compute = vi.fn(async () => ({ value: 1 }));

    const result = await cachedJSON(
      undefined,
      'https://example.com/api/thing',
      ['a'],
      60,
      compute,
    );

    expect(result).toEqual({ value: 1 });
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('computes and stores on a cache miss, then serves from the cache on a hit', async () => {
    const { platform, cache } = fakePlatform();
    const compute = vi.fn(async () => ({ value: 42 }));

    const first = await cachedJSON(
      platform,
      'https://example.com/api/thing',
      ['loc', 1],
      60,
      compute,
    );
    expect(first).toEqual({ value: 42 });
    expect(compute).toHaveBeenCalledTimes(1);
    expect(cache.put).toHaveBeenCalledTimes(1);

    const second = await cachedJSON(
      platform,
      'https://example.com/api/thing',
      ['loc', 1],
      60,
      compute,
    );
    expect(second).toEqual({ value: 42 });
    // compute is not called again on a hit
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('namespaces the cache key so different keyParts never collide', async () => {
    const { platform, store } = fakePlatform();

    await cachedJSON(
      platform,
      'https://example.com/api/thing',
      ['dev', 'austin'],
      60,
      async () => ({ value: 'a' }),
    );
    await cachedJSON(
      platform,
      'https://example.com/api/thing',
      ['prod', 'austin'],
      60,
      async () => ({ value: 'b' }),
    );

    expect(store.size).toBe(2);

    const devResult = await cachedJSON(
      platform,
      'https://example.com/api/thing',
      ['dev', 'austin'],
      60,
      async () => ({ value: 'unused' }),
    );
    const prodResult = await cachedJSON(
      platform,
      'https://example.com/api/thing',
      ['prod', 'austin'],
      60,
      async () => ({ value: 'unused' }),
    );

    expect(devResult).toEqual({ value: 'a' });
    expect(prodResult).toEqual({ value: 'b' });
  });

  it('does not cache a rejected compute call', async () => {
    const { platform, cache } = fakePlatform();
    const compute = vi.fn(async () => {
      throw new Error('upstream failed');
    });

    await expect(
      cachedJSON(platform, 'https://example.com/api/thing', ['a'], 60, compute),
    ).rejects.toThrow('upstream failed');

    expect(cache.put).not.toHaveBeenCalled();
  });
});
