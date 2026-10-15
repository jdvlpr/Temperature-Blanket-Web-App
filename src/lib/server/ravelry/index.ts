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
import { ravelryApi, RavelryApiError, type RavelryApi } from './api';
import { rememberRavelryUser, ravelryUsername } from './store';

export const NO_STORE = { 'Cache-Control': 'no-store' };

type Auth = Extract<
  Awaited<ReturnType<typeof requireAccount>>,
  { auth: unknown }
>['auth'];

export type RavelryContext = {
  db: D1Database;
  userId: string;
  auth: Auth;
  /** The request's, which auth.api needs to work out this site's URL */
  headers: Headers;
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
  return {
    db: env.DB,
    userId: account.user.id,
    auth: account.auth,
    headers: event.request.headers,
  };
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
  let accessToken: string | undefined;
  try {
    // With the request's headers, Better Auth also checks it's this session's account
    ({ accessToken } = await ctx.auth.api.getAccessToken({
      body: { accountId: linked.id },
      headers: ctx.headers,
    }));
  } catch (e) {
    // Only a token Better Auth couldn't refresh (revoked, or expired) means
    // connect again; anything else is a fault to see, not to hide
    const code = (e as { body?: { code?: string } }).body?.code;
    if (code === 'FAILED_TO_GET_ACCESS_TOKEN') {
      console.error('Could not refresh the Ravelry access token', e);
      throw new RavelryReconnect();
    }
    throw e;
  }
  if (!accessToken) throw new RavelryReconnect();
  return accessToken;
}

/**
 * Forgets the Ravelry link: its tokens, and which projects and photos it
 * linked. Nothing on Ravelry changes.
 */
export async function disconnectRavelry(db: D1Database, userId: string) {
  const { forgetRavelryStatements } = await import('./store');
  await db.batch([
    ...forgetRavelryStatements(db, userId),
    db
      .prepare('delete from "account" where "userId" = ? and "providerId" = ?')
      .bind(userId, RAVELRY_PROVIDER_ID),
  ]);
}

export type RavelrySession = RavelryContext & {
  api: RavelryApi;
  /** The Ravelry username, which its API paths need */
  username: string;
};

/** The API with the account's token, and its Ravelry username (looked up once, then kept). */
export async function ravelrySession(
  ctx: RavelryContext,
): Promise<RavelrySession> {
  const api = ravelryApi(await ravelryAccessToken(ctx));
  let username = await ravelryUsername(ctx.db, ctx.userId);
  if (!username) {
    const user = await api.currentUser();
    await rememberRavelryUser(ctx.db, ctx.userId, user);
    username = user.username;
  }
  return { ...ctx, api, username };
}

/** A Response for a failed Ravelry call: connect again, or Ravelry's own failure. */
export function ravelryFailure(e: unknown): Response {
  if (
    e instanceof RavelryReconnect ||
    (e instanceof RavelryApiError && e.reconnect)
  )
    return ravelryError(409, 'RAVELRY_RECONNECT', 'Connect Ravelry again');
  if (e instanceof RavelryApiError) {
    console.error(e.message);
    return ravelryError(
      502,
      'RAVELRY_ERROR',
      e.status === 404
        ? 'That isn’t on Ravelry anymore'
        : 'Ravelry didn’t answer as expected',
    );
  }
  throw e;
}

/** Runs a route's work with the account's Ravelry session, answering failures. */
export async function withRavelry(
  event: RequestEvent,
  work: (session: RavelrySession) => Promise<Response>,
): Promise<Response> {
  const ctx = await requireRavelry(event);
  if (ctx instanceof Response) return ctx;
  try {
    return await work(await ravelrySession(ctx));
  } catch (e) {
    return ravelryFailure(e);
  }
}
