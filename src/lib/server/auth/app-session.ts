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

// Signing in to the iPhone app. The app can't read the browser's session
// cookie, so the website hands it a session of its own:
//
// 1. The app opens /app-sign-in?challenge=<SHA-256 of a secret it made up> in
//    a browser sheet. Whoever is signed in there (after signing in, if need
//    be) is asked whether to sign in to the app.
// 2. On Continue the page gets a one-use code, good for two minutes, and
//    opens temperatureblanket://sign-in?code=… , which returns to the app.
// 3. The app posts the code and its secret to /api/account/app-session and
//    gets a new session's token, which it sends as `Authorization: Bearer`.
//
// The secret (as in OAuth's PKCE) means a code is no use to anything but the
// app that asked for it. The app's session is separate from the browser's:
// signing out of one leaves the other.
//
// Better Auth's own `bearer` plugin isn't used: it also copies every new
// session token into a response header scripts can read, which would undo the
// HttpOnly cookie for browsers.

import { SESSION_COOKIE } from './hint-cookie';

/** Where the confirm page sends the code: the app's own URL scheme */
export const APP_CALLBACK = 'temperatureblanket://sign-in';

export const APP_CODE_SECONDS = 2 * 60;

/** A SHA-256 digest in base64url, without padding: 43 characters */
const CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/** The app's secret: 43 to 128 unreserved characters, as PKCE has it */
const VERIFIER_PATTERN = /^[A-Za-z0-9._~-]{43,128}$/;
const CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const isAppChallenge = (value: unknown): value is string =>
  typeof value === 'string' && CHALLENGE_PATTERN.test(value);

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

export async function sha256Base64Url(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  );
  return base64Url(new Uint8Array(digest));
}

/** The token of an `Authorization: Bearer` header, if there is one */
export function bearerToken(headers: Headers): string | null {
  const header = headers.get('authorization');
  if (!header || header.slice(0, 7).toLowerCase() !== 'bearer ') return null;
  const token = header.slice(7).trim();
  // A session token and its signature; nothing else is ever handed out
  return /^[A-Za-z0-9]+\.[A-Za-z0-9+/=]+$/.test(token) ? token : null;
}

/**
 * The request's headers, with a bearer token (the app's) as the session cookie
 * Better Auth reads. A browser's request, with no such header, is returned as
 * it is. The token is checked by Better Auth like any cookie: its signature,
 * then the session in the database.
 */
export function withBearerSession(headers: Headers): Headers {
  const token = bearerToken(headers);
  if (!token) return headers;
  const copy = new Headers(headers);
  const value = encodeURIComponent(token);
  // Only the app's session, never mixed with cookies sent along. Under both
  // names: Better Auth adds the prefix on HTTPS
  copy.set(
    'cookie',
    `__Secure-${SESSION_COOKIE}=${value}; ${SESSION_COOKIE}=${value}`,
  );
  copy.delete('authorization');
  return copy;
}

/** A session token signed as Better Auth signs its session cookie */
async function signToken(token: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(token),
  );
  return `${token}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;
}

/** The parts of Better Auth's context this needs (`await auth.$context`) */
export type AppSessionContext = {
  secret: string;
  internalAdapter: {
    createVerificationValue(data: {
      identifier: string;
      value: string;
      expiresAt: Date;
    }): Promise<unknown>;
    consumeVerificationValue(
      identifier: string,
    ): Promise<{ value: string; expiresAt: Date } | null>;
    createSession(
      userId: string,
    ): Promise<{ token: string; expiresAt: Date } | null>;
    deleteSession(token: string): Promise<unknown>;
    findUserById(
      userId: string,
    ): Promise<{ id: string; name: string; email: string } | null>;
  };
};

// Stored by the code's hash, so reading the database gives no usable code
const codeIdentifier = async (code: string) =>
  `app-sign-in:${await sha256Base64Url(code)}`;

/** A one-use code that lets the app holding `challenge`'s secret sign in as the user. */
export async function createAppCode(
  context: AppSessionContext,
  userId: string,
  challenge: string,
  now = Date.now(),
): Promise<string> {
  const code = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  await context.internalAdapter.createVerificationValue({
    identifier: await codeIdentifier(code),
    value: JSON.stringify({ userId, challenge }),
    expiresAt: new Date(now + APP_CODE_SECONDS * 1000),
  });
  return code;
}

export type AppSession = {
  /** What the app sends as `Authorization: Bearer` */
  token: string;
  expiresAt: number;
  user: { id: string; name: string; email: string };
};

/**
 * A new session for the app, for a code and the secret behind its challenge.
 * Null when either is wrong, or the code was used or is too old; a code is
 * spent by its first try either way.
 */
export async function exchangeAppCode(
  context: AppSessionContext,
  code: unknown,
  verifier: unknown,
): Promise<AppSession | null> {
  if (typeof code !== 'string' || !CODE_PATTERN.test(code)) return null;
  if (typeof verifier !== 'string' || !VERIFIER_PATTERN.test(verifier))
    return null;

  const row = await context.internalAdapter.consumeVerificationValue(
    await codeIdentifier(code),
  );
  if (!row || row.expiresAt.getTime() < Date.now()) return null;

  let saved: { userId?: unknown; challenge?: unknown };
  try {
    saved = JSON.parse(row.value);
  } catch {
    return null;
  }
  if (typeof saved.userId !== 'string' || !isAppChallenge(saved.challenge))
    return null;
  if ((await sha256Base64Url(verifier)) !== saved.challenge) return null;

  const user = await context.internalAdapter.findUserById(saved.userId);
  if (!user) return null;
  const session = await context.internalAdapter.createSession(user.id);
  if (!session) return null;

  return {
    token: await signToken(session.token, context.secret),
    expiresAt: new Date(session.expiresAt).getTime(),
    user: { id: user.id, name: user.name, email: user.email },
  };
}

/** Ends the app's session: its token stops working at once. */
export async function endAppSession(
  context: AppSessionContext,
  bearer: string,
): Promise<void> {
  await context.internalAdapter.deleteSession(bearer.split('.')[0]);
}
