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

import { describe, expect, it } from 'vitest';
import {
  appleClientSecret,
  readAppleRevokeSettings,
  revokeAppleAuthorization,
  type AppleRevokeSettings,
} from './apple-revoke';

const fromBase64url = (text: string) =>
  Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
    c.charCodeAt(0),
  );

async function makeKey() {
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  const der = new Uint8Array(
    await crypto.subtle.exportKey('pkcs8', pair.privateKey),
  );
  const body = btoa(String.fromCharCode(...der)).replace(/(.{64})/g, '$1\n');
  const pem = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;
  return { pem, publicKey: pair.publicKey };
}

async function settingsWithKey() {
  const { pem, publicKey } = await makeKey();
  const settings: AppleRevokeSettings = {
    clientId: 'com.example.App',
    teamId: 'TEAM123456',
    keyId: 'KEY1234567',
    privateKey: pem,
  };
  return { settings, publicKey };
}

describe('readAppleRevokeSettings', () => {
  it('needs all four values', () => {
    const full = {
      APPLE_APP_BUNDLE_ID: 'a',
      APPLE_TEAM_ID: 'b',
      APPLE_KEY_ID: 'c',
      APPLE_PRIVATE_KEY: 'd',
    };
    expect(readAppleRevokeSettings(full)).toEqual({
      clientId: 'a',
      teamId: 'b',
      keyId: 'c',
      privateKey: 'd',
    });
    expect(
      readAppleRevokeSettings({ ...full, APPLE_KEY_ID: undefined }),
    ).toBeUndefined();
    expect(readAppleRevokeSettings(undefined)).toBeUndefined();
  });
});

describe('appleClientSecret', () => {
  it('is an ES256 JWT for the app that Apple can check', async () => {
    const { settings, publicKey } = await settingsWithKey();
    const now = Date.UTC(2026, 10, 27);
    const jwt = await appleClientSecret(settings, now);
    const [header, payload, signature] = jwt.split('.');
    expect(JSON.parse(new TextDecoder().decode(fromBase64url(header)))).toEqual(
      { alg: 'ES256', kid: 'KEY1234567' },
    );
    expect(
      JSON.parse(new TextDecoder().decode(fromBase64url(payload))),
    ).toEqual({
      iss: 'TEAM123456',
      iat: now / 1000,
      exp: now / 1000 + 300,
      aud: 'https://appleid.apple.com',
      sub: 'com.example.App',
    });
    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      fromBase64url(signature),
      new TextEncoder().encode(`${header}.${payload}`),
    );
    expect(valid).toBe(true);
  });

  it('takes a key pasted with literal \\n', async () => {
    const { settings } = await settingsWithKey();
    const oneLine = settings.privateKey.replace(/\n/g, '\\n');
    await expect(
      appleClientSecret({ ...settings, privateKey: oneLine }),
    ).resolves.toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });
});

describe('revokeAppleAuthorization', () => {
  it('trades the code, then revokes the refresh token', async () => {
    const { settings } = await settingsWithKey();
    const calls: { url: string; body: URLSearchParams }[] = [];
    const fetcher = (async (url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body as URLSearchParams });
      if (url.endsWith('/auth/token'))
        return Response.json({ access_token: 'a', refresh_token: 'r' });
      return new Response(null, { status: 200 });
    }) as typeof fetch;
    await revokeAppleAuthorization(settings, 'the-code', fetcher);
    expect(calls.map((c) => c.url)).toEqual([
      'https://appleid.apple.com/auth/token',
      'https://appleid.apple.com/auth/revoke',
    ]);
    expect(calls[0].body.get('code')).toBe('the-code');
    expect(calls[0].body.get('client_id')).toBe('com.example.App');
    expect(calls[0].body.get('grant_type')).toBe('authorization_code');
    expect(calls[1].body.get('token')).toBe('r');
    expect(calls[1].body.get('token_type_hint')).toBe('refresh_token');
  });

  it('throws when Apple refuses the code', async () => {
    const { settings } = await settingsWithKey();
    const fetcher = (async () =>
      Response.json(
        { error: 'invalid_grant' },
        { status: 400 },
      )) as unknown as typeof fetch;
    await expect(
      revokeAppleAuthorization(settings, 'old-code', fetcher),
    ).rejects.toThrow(/400/);
  });
});
