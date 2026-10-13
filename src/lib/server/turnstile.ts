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

// Cloudflare Turnstile, checked on the server before a guest's gallery
// submission goes on to WordPress. It fails closed: without a secret, or when
// Siteverify can't be reached, nothing is forwarded.

export { TURNSTILE_HEADER } from '#lib/utils/turnstile.js';

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Siteverify's own limit
const MAX_TOKEN_LENGTH = 2048;

// Errors that are the visitor's token, not the check itself
const TOKEN_ERRORS = new Set([
  'missing-input-response',
  'invalid-input-response',
  'timeout-or-duplicate',
]);

export type TurnstileResult =
  | 'ok'
  /** No token, or one that's invalid, expired or already used */
  | 'rejected'
  /** No secret set, or Siteverify can't be reached or had a problem */
  | 'unavailable';

/** Checks a Turnstile token with Siteverify. */
export async function verifyTurnstile({
  token,
  secret,
  remoteIp,
  fetch: fetchFn = fetch,
}: {
  token: string | null;
  secret: string | undefined;
  remoteIp?: string | null;
  fetch?: typeof fetch;
}): Promise<TurnstileResult> {
  if (!secret) return 'unavailable';
  if (!token || token.length > MAX_TOKEN_LENGTH) return 'rejected';
  try {
    const response = await fetchFn(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        ...(remoteIp && { remoteip: remoteIp }),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return 'unavailable';
    const result = (await response.json()) as {
      success?: boolean;
      'error-codes'?: string[];
    };
    if (result.success === true) return 'ok';
    const codes = result['error-codes'] ?? [];
    return codes.length && codes.every((code) => TOKEN_ERRORS.has(code))
      ? 'rejected'
      : 'unavailable';
  } catch {
    return 'unavailable';
  }
}
