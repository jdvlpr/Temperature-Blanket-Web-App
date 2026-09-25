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

// The /api/sync routes. Imported only by those routes, so other requests never load it.

import { requireAccount } from '$lib/server/auth';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { json, type RequestEvent } from '@sveltejs/kit';
import { cleanUpUserSync } from './store';

export type SyncContext = {
  db: D1Database;
  bucket: R2Bucket;
  userId: string;
  /** Keeps work going after the response is sent */
  runInBackground: (promise: Promise<unknown>) => void;
};

/** Whether this account may sync: everyone, or the SYNC_BETA_EMAILS list when it's set. */
export function syncAllowedFor(email: string, betaEmails: string | undefined) {
  if (!betaEmails?.trim()) return true;
  const allowed = betaEmails.split(',').map((e) => e.trim().toLowerCase());
  return allowed.includes(email.trim().toLowerCase());
}

export const syncError = (status: number, code: string, message: string) =>
  json({ code, message }, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * The signed-in user's sync storage, or a Response: 404 with accounts off, 401 when
 * signed out, 503 with code SYNC_PAUSED when sync is switched off or not set up
 * (everything local keeps working), 403 SYNC_NOT_INVITED outside the beta list.
 */
export async function requireSync(
  event: RequestEvent,
): Promise<SyncContext | Response> {
  const account = await requireAccount(event);
  if (account instanceof Response) return account;

  const env = event.platform?.env;
  if (env?.SYNC_ENABLED !== 'true' || !env.DB || !env.PROJECTS)
    return syncError(503, 'SYNC_PAUSED', 'Sync is paused');
  if (!syncAllowedFor(account.user.email, env.SYNC_BETA_EMAILS))
    return syncError(403, 'SYNC_NOT_INVITED', 'Sync is in a private beta');

  const ctx = event.platform?.ctx;
  return {
    db: env.DB,
    bucket: env.PROJECTS,
    userId: account.user.id,
    runInBackground: (promise) => {
      const logged = promise.catch((e) =>
        console.error('Sync background task failed', e),
      );
      ctx?.waitUntil(logged);
    },
  };
}

/** Runs the daily per-user cleanup after a write, without delaying the response. */
export function cleanUpAfterWrite(sync: SyncContext) {
  sync.runInBackground(cleanUpUserSync(sync.db, sync.bucket, sync.userId));
}
