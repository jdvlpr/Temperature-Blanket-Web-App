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

// Ravelry for signed-in accounts: a linked Ravelry account (Better Auth's
// "ravelry" provider, link-only) whose tokens are used here, on the server,
// and never sent to a browser. See ravelry-api-documentation.md.

import type { D1Database } from '@cloudflare/workers-types';
import { json, type RequestEvent } from '@sveltejs/kit';
import { requireAccount } from '#lib/server/auth/index.js';
import { RAVELRY_PROVIDER_ID } from '#lib/server/auth/options.js';
import { readAuthSettings } from '#lib/server/auth/settings.js';
import { getPlatform } from '#lib/server/cloudflare.js';

export const NO_STORE = { 'Cache-Control': 'no-store' };

type Auth = Extract<
  Awaited<ReturnType<typeof requireAccount>>,
  { auth: unknown }
>['auth'];

export type RavelryContext = {
  db: D1Database;
  userId: string;
  auth: Auth;
};

/** A JSON error the client can tell apart by `code`. */
export function ravelryError(status: number, code: string, message: string) {
  return json({ code, message }, { status, headers: NO_STORE });
}

/** Whether Ravelry linking is configured (RAVELRY_CLIENT_ID and _SECRET). */
export function ravelryAvailable(env = getPlatform()?.env) {
  const settings = readAuthSettings(env);
  return settings.status === 'ready' && !!settings.settings.ravelry;
}

/** The signed-in account, for a route under /api/account/ravelry; a Response when there's none, or Ravelry is off. */
export async function requireRavelry(
  event: RequestEvent,
): Promise<RavelryContext | Response> {
  const account = await requireAccount(event);
  if (account instanceof Response) return account;
  const env = getPlatform()?.env;
  if (!env?.DB || !ravelryAvailable(env))
    return ravelryError(404, 'RAVELRY_OFF', 'Ravelry isn’t available');
  return { db: env.DB, userId: account.user.id, auth: account.auth };
}

/** The account's linked Ravelry account record, if any. */
export async function linkedRavelryAccount(
  db: D1Database,
  userId: string,
): Promise<{ id: string; accountId: string } | null> {
  return db
    .prepare(
      'select "id", "accountId" from "account" where "userId" = ? and "providerId" = ? limit 1',
    )
    .bind(userId, RAVELRY_PROVIDER_ID)
    .first<{ id: string; accountId: string }>();
}

/** Thrown when Ravelry needs connecting (again): never linked, or the link stopped working. */
export class RavelryReconnect extends Error {
  constructor(message = 'Connect Ravelry again') {
    super(message);
  }
}

/**
 * A valid access token for the account's Ravelry link, refreshed by Better
 * Auth when it's near its 24 hours.
 */
export async function ravelryAccessToken(ctx: RavelryContext): Promise<string> {
  const linked = await linkedRavelryAccount(ctx.db, ctx.userId);
  if (!linked) throw new RavelryReconnect('Ravelry isn’t connected');
  try {
    const { accessToken } = await ctx.auth.api.getAccessToken({
      body: { accountId: linked.id, userId: ctx.userId },
    });
    if (!accessToken) throw new RavelryReconnect();
    return accessToken;
  } catch (e) {
    if (e instanceof RavelryReconnect) throw e;
    // A refresh token Ravelry no longer accepts (revoked, or expired)
    console.error('Could not get a Ravelry access token', e);
    throw new RavelryReconnect();
  }
}

/**
 * Forgets the Ravelry link: its tokens, and which projects and photos it
 * linked. Nothing on Ravelry changes.
 */
export async function disconnectRavelry(db: D1Database, userId: string) {
  await db.batch([
    db
      .prepare('delete from "account" where "userId" = ? and "providerId" = ?')
      .bind(userId, RAVELRY_PROVIDER_ID),
  ]);
}
