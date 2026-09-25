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

// Dev only: checks that the D1 and R2 bindings work, for the wrangler e2e run.

import { requireDevRoutes, requireStorage } from '$lib/server/platform';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ platform }) => {
  requireDevRoutes(platform);
  const { db, projects } = requireStorage(platform);

  const d1 = await db.prepare('SELECT 1 AS ok').first<{ ok: number }>();

  // Created by `wrangler d1 migrations apply`; proves migrations reach this database
  let migrationsApplied: number | null;
  try {
    const row = await db
      .prepare('SELECT COUNT(*) AS count FROM d1_migrations')
      .first<{ count: number }>();
    migrationsApplied = row?.count ?? 0;
  } catch {
    migrationsApplied = null;
  }

  const key = `_dev/platform-check/${crypto.randomUUID()}`;
  await projects.put(key, 'ok');
  const stored = await projects.get(key);
  const r2 = (await stored?.text()) === 'ok';
  await projects.delete(key);

  return json({ d1: d1?.ok === 1, r2, migrationsApplied });
};
