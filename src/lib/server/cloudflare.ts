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

import { building } from '$app/env';
import type { CacheStorage } from '@cloudflare/workers-types';
import { env, waitUntil } from 'cloudflare:workers';

/**
 * The Cloudflare bindings, background tasks and edge cache for the current request.
 * adapter-cloudflare 8 no longer passes these as `event.platform`; they come from
 * `cloudflare:workers` instead. Undefined while building and prerendering, where
 * `cloudflare:workers` can't be read (the same as having no bindings).
 */
export function getPlatform(): App.Platform | undefined {
  if (building) return undefined;
  return {
    env: env as App.Platform['env'],
    ctx: { waitUntil },
    caches: (globalThis as unknown as { caches?: CacheStorage }).caches,
  };
}
