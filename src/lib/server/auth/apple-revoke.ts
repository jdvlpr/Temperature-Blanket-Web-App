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

// Deleting an account that signs in with Apple takes the app off the person's
// Apple ID (App Store guideline 5.1.1(v)). The iPhone app confirms the delete
// with Apple's sheet and sends the one-time authorization code it got; this
// trades the code for a refresh token and revokes it. A website sign-in left a
// refresh token on the account row, which is revoked as it is.
//
// The same key signs the website's client secret for Sign in with Apple (see
// ./settings), with the Services ID in place of the bundle ID.

const APPLE = 'https://appleid.apple.com';

/** The Worker's settings for it: the app's bundle ID and the Sign in with Apple key */
export type AppleRevokeEnv = {
  APPLE_APP_BUNDLE_ID?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  /** The .p8 file's text, PEM header and all */
  APPLE_PRIVATE_KEY?: string;
};

/** The Sign in with Apple key: the team, the key's ID, and the .p8 text */
export type AppleKey = { teamId: string; keyId: string; privateKey: string };

/** The key, with the client it speaks for (the bundle ID, or the Services ID) */
export type AppleRevokeSettings = AppleKey & { clientId: string };

/** The key, when all three of its values are set */
export function readAppleKey(
  env: AppleRevokeEnv | undefined,
): AppleKey | undefined {
  const teamId = env?.APPLE_TEAM_ID?.trim();
  const keyId = env?.APPLE_KEY_ID?.trim();
  const privateKey = env?.APPLE_PRIVATE_KEY?.trim();
  if (!teamId || !keyId || !privateKey) return undefined;
  return { teamId, keyId, privateKey };
}

/** For the iPhone app's codes: its bundle ID and the key */
export function readAppleRevokeSettings(
  env: AppleRevokeEnv | undefined,
): AppleRevokeSettings | undefined {
  const clientId = env?.APPLE_APP_BUNDLE_ID?.trim();
  const key = readAppleKey(env);
  if (!clientId || !key) return undefined;
  return { clientId, ...key };
}

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const encodeJSON = (value: unknown) =>
  base64url(new TextEncoder().encode(JSON.stringify(value)));

/** The .p8 key: PEM text (or its base64 body alone) to PKCS #8 bytes */
function pkcs8(pem: string): Uint8Array<ArrayBuffer> {
  const body = pem
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** The longest a client secret may last, by Apple's rules: 6 months */
export const APPLE_SECRET_MAX_SECONDS = 15_777_000;

/**
 * The client secret Apple's token endpoints want: an ES256 JWT signed with the
 * Sign in with Apple key, for `lifetimeSeconds` (5 minutes unless asked).
 * WebCrypto's ECDSA signature is already the r‖s form JWTs use.
 */
export async function appleClientSecret(
  settings: AppleRevokeSettings,
  now = Date.now(),
  lifetimeSeconds = 300,
): Promise<string> {
  const iat = Math.floor(now / 1000);
  const header = encodeJSON({ alg: 'ES256', kid: settings.keyId });
  const payload = encodeJSON({
    iss: settings.teamId,
    iat,
    exp: iat + Math.min(lifetimeSeconds, APPLE_SECRET_MAX_SECONDS),
    aud: APPLE,
    sub: settings.clientId,
  });
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8(settings.privateKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(`${header}.${payload}`),
  );
  return `${header}.${payload}.${base64url(new Uint8Array(signature))}`;
}

/**
 * Trades the app's authorization code for a token and revokes it, which takes
 * the app off the person's Apple ID. Throws when Apple refuses either step.
 */
export async function revokeAppleAuthorization(
  settings: AppleRevokeSettings,
  authorizationCode: string,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const clientSecret = await appleClientSecret(settings);
  const tokenResponse = await fetcher(`${APPLE}/auth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: settings.clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenResponse.ok)
    throw new Error(
      `Apple's token endpoint answered ${tokenResponse.status}: ${await tokenResponse.text()}`,
    );
  const tokens = (await tokenResponse.json()) as {
    refresh_token?: string;
    access_token?: string;
  };
  const token = tokens.refresh_token ?? tokens.access_token;
  if (!token) throw new Error('Apple gave no token to revoke');
  await revokeAppleToken(
    settings,
    token,
    tokens.refresh_token ? 'refresh_token' : 'access_token',
    fetcher,
    clientSecret,
  );
}

/**
 * Revokes a token Apple gave `settings.clientId` (for a website sign-in, the
 * Services ID), which takes the app off the person's Apple ID. Throws when
 * Apple refuses.
 */
export async function revokeAppleToken(
  settings: AppleRevokeSettings,
  token: string,
  tokenType: 'refresh_token' | 'access_token',
  fetcher: typeof fetch = fetch,
  clientSecret?: string,
): Promise<void> {
  const revokeResponse = await fetcher(`${APPLE}/auth/revoke`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: settings.clientId,
      client_secret: clientSecret ?? (await appleClientSecret(settings)),
      token,
      token_type_hint: tokenType,
    }),
  });
  if (!revokeResponse.ok)
    throw new Error(
      `Apple's revoke endpoint answered ${revokeResponse.status}: ${await revokeResponse.text()}`,
    );
}
