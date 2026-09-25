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

// The readable "signed in" hint. Pages check it before asking the server for the
// session, so anonymous visitors never cost a server request. It holds nothing
// secret; the real session is Better Auth's HttpOnly cookie.

export const SIGNED_IN_HINT_COOKIE = 'tb_signed_in';
export const SESSION_COOKIE = 'tb.session_token';

const SESSION_MAX_AGE = 60 * 24 * 60 * 60;

/**
 * Whether a Set-Cookie header starts a session (true), ends one (false), or
 * doesn't touch the session cookie (undefined). On HTTPS, Better Auth adds the
 * __Secure- prefix.
 */
export function sessionCookieChange(setCookie: string): boolean | undefined {
  const match = setCookie.match(/^(?:__Secure-)?tb\.session_token=([^;]*)/);
  if (!match) return undefined;
  const cleared = !match[1] || /;\s*max-age=0(?:;|$)/i.test(setCookie);
  return !cleared;
}

/** Adds the hint cookie to a response that signs in or out. */
export function withSignedInHint(
  response: Response,
  secure: boolean,
): { response: Response; signedIn: boolean | undefined } {
  let signedIn: boolean | undefined;
  for (const header of response.headers.getSetCookie()) {
    const change = sessionCookieChange(header);
    if (change !== undefined) signedIn = change;
  }
  if (signedIn === undefined) return { response, signedIn };

  const attributes = `Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
  const hint = signedIn
    ? `${SIGNED_IN_HINT_COOKIE}=1; Max-Age=${SESSION_MAX_AGE}; ${attributes}`
    : `${SIGNED_IN_HINT_COOKIE}=; Max-Age=0; ${attributes}`;

  const copy = new Response(response.body, response);
  copy.headers.append('Set-Cookie', hint);
  return { response: copy, signedIn };
}
