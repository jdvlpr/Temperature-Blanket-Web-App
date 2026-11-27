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

// Connecting Ravelry from the iPhone app. The app signs in with a bearer
// token, never the browser's cookie, so the link is started for it here:
//
// 1. POST /api/account/ravelry/connect (bearer): Better Auth starts linking
//    Ravelry to the app's account (link-social). Ravelry's address and the
//    state cookie that goes with it are kept under a one-use code.
// 2. The app opens /app-ravelry-connect?code=… in a browser sheet. The page
//    says which account Ravelry would be connected to; only its Continue (a
//    same-origin form POST, /app-ravelry-connect/continue) spends the code,
//    sets the state cookie and goes to Ravelry. So a link to the page, sent
//    to someone else, can't connect their Ravelry without them saying so.
// 3. Ravelry comes back to /api/auth/callback/ravelry, which links it (the
//    state names the account), then /app-ravelry-connect/done opens
//    temperatureblanket://ravelry?result=… in the app.

import { sha256Base64Url } from '../auth/app-session';

/** Where the sheet goes back to the app */
export const APP_RAVELRY_CALLBACK = 'temperatureblanket://ravelry';

/** Less than the state cookie's 5 minutes, which starts once Continue is pressed */
export const RAVELRY_CONNECT_CODE_SECONDS = 5 * 60;

/** What the app is told, never Better Auth's own error text */
export type AppRavelryResult =
  'connected' | 'canceled' | 'expired' | 'already_linked' | 'failed';

export const appRavelryCallback = (result: AppRavelryResult) =>
  `${APP_RAVELRY_CALLBACK}?result=${result}`;

/** Better Auth's ?error= after Ravelry, as the app is told it */
export function appRavelryResult(error: string | null): AppRavelryResult {
  if (!error) return 'connected';
  if (error === 'access_denied') return 'canceled';
  if (error === 'account_already_linked_to_different_user')
    return 'already_linked';
  if (error === 'state_mismatch' || error === 'state_not_found')
    return 'expired';
  return 'failed';
}

/** A state cookie Better Auth set for the link (never a session or hint cookie) */
export const isStateCookie = (setCookie: string) =>
  /^(__Secure-)?[\w-]+\.state=/.test(setCookie);

/** What a code stands for */
export type RavelryConnect = {
  name: string;
  email: string;
  /** Ravelry's address for approving the link */
  url: string;
  /** The Set-Cookie lines that go with it: the state cookie */
  cookies: string[];
};

/** The parts of Better Auth's context this needs (`await auth.$context`) */
export type RavelryConnectContext = {
  internalAdapter: {
    createVerificationValue(data: {
      identifier: string;
      value: string;
      expiresAt: Date;
    }): Promise<unknown>;
    findVerificationValue(
      identifier: string,
    ): Promise<{ value: string; expiresAt: Date } | null>;
    consumeVerificationValue(
      identifier: string,
    ): Promise<{ value: string; expiresAt: Date } | null>;
  };
};

const CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

// Stored by the code's hash, so reading the database gives no usable code
const identifierFor = async (code: string) =>
  `app-ravelry:${await sha256Base64Url(code)}`;

export async function createRavelryConnectCode(
  context: RavelryConnectContext,
  connect: RavelryConnect,
  now = Date.now(),
): Promise<string> {
  const code = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  await context.internalAdapter.createVerificationValue({
    identifier: await identifierFor(code),
    value: JSON.stringify(connect),
    expiresAt: new Date(now + RAVELRY_CONNECT_CODE_SECONDS * 1000),
  });
  return code;
}

function parse(row: { value: string; expiresAt: Date } | null) {
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  try {
    const saved = JSON.parse(row.value) as Partial<RavelryConnect>;
    if (
      typeof saved.name !== 'string' ||
      typeof saved.email !== 'string' ||
      typeof saved.url !== 'string' ||
      !Array.isArray(saved.cookies)
    )
      return null;
    return saved as RavelryConnect;
  } catch {
    return null;
  }
}

/** What a code stands for, without spending it (for the page that asks first) */
export async function readRavelryConnectCode(
  context: RavelryConnectContext,
  code: unknown,
): Promise<RavelryConnect | null> {
  if (typeof code !== 'string' || !CODE_PATTERN.test(code)) return null;
  return parse(
    await context.internalAdapter.findVerificationValue(
      await identifierFor(code),
    ),
  );
}

/** Spends a code: what it stood for, or null when it's wrong, used or too old */
export async function spendRavelryConnectCode(
  context: RavelryConnectContext,
  code: unknown,
): Promise<RavelryConnect | null> {
  if (typeof code !== 'string' || !CODE_PATTERN.test(code)) return null;
  return parse(
    await context.internalAdapter.consumeVerificationValue(
      await identifierFor(code),
    ),
  );
}
