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

import { error } from '@sveltejs/kit';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

/**
 * The /api/dev/* routes only exist where ENABLE_DEV_ROUTES is "true", which is
 * set in the local wrangler.jsonc and never in production. Fails closed.
 */
export function devRoutesEnabled(platform: App.Platform | undefined): boolean {
  return platform?.env?.ENABLE_DEV_ROUTES === 'true';
}

/** 404 unless dev routes are enabled, so they look like they don't exist. */
export function requireDevRoutes(platform: App.Platform | undefined): void {
  if (!devRoutesEnabled(platform)) error(404, 'Not found');
}

/**
 * The account database and project storage. Responds 503 where the bindings
 * aren't configured (production, until accounts ship).
 */
export function requireStorage(platform: App.Platform | undefined): {
  db: D1Database;
  projects: R2Bucket;
} {
  const db = platform?.env?.DB;
  const projects = platform?.env?.PROJECTS;
  if (!db || !projects) error(503, 'Account storage is not available');
  return { db, projects };
}
