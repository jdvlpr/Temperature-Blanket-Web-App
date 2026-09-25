import { describe, expect, it } from 'vitest';
import { ravelryProvider, ravelryUserInfo } from './ravelry';
import { readAuthSettings } from './settings';

describe('ravelryUserInfo', () => {
  it('never uses the email Ravelry reports', () => {
    const info = ravelryUserInfo({
      user: {
        id: 1234,
        username: 'knitter',
        email: 'victim@example.test',
        photo_url: 'https://example.test/p.jpg',
      },
    });
    expect(info).toEqual({
      id: '1234',
      email: 'ravelry-1234@users.ravelry.invalid',
      emailVerified: false,
      name: 'knitter',
      image: 'https://example.test/p.jpg',
    });
  });

  it('rejects profiles without an id', () => {
    expect(ravelryUserInfo(null)).toBeNull();
    expect(ravelryUserInfo({})).toBeNull();
    expect(ravelryUserInfo({ user: { username: 'x' } })).toBeNull();
    expect(ravelryUserInfo({ user: { id: ' ' } })).toBeNull();
  });
});

describe('ravelryProvider', () => {
  it('can’t create accounts and authenticates with Basic', () => {
    const provider = ravelryProvider({
      clientId: 'id',
      clientSecret: 'secret',
      oauthUrl: 'https://www.ravelry.com',
      apiUrl: 'https://api.ravelry.com',
    });
    expect(provider.disableSignUp).toBe(true);
    expect(provider.authentication).toBe('basic');
    expect(provider.authorizationUrl).toBe(
      'https://www.ravelry.com/oauth2/auth',
    );
    expect(provider.tokenUrl).toBe('https://www.ravelry.com/oauth2/token');
  });
});

describe('provider settings', () => {
  const base = {
    ACCOUNTS_ENABLED: 'true',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    AUTH_ALLOWED_HOSTS: 'temperature-blanket.com',
  };

  it('turns a provider on only with both its ID and secret', () => {
    const settingsOf = (env: Record<string, string>) => {
      const result = readAuthSettings({ ...base, ...env });
      return result.status === 'ready' ? result.settings : undefined;
    };
    expect(settingsOf({ GOOGLE_CLIENT_ID: 'id' })?.google).toBeUndefined();
    expect(
      settingsOf({ GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 's' })?.google,
    ).toEqual({ clientId: 'id', clientSecret: 's' });
    expect(settingsOf({ RAVELRY_CLIENT_SECRET: 's' })?.ravelry).toBeUndefined();
    expect(
      settingsOf({ RAVELRY_CLIENT_ID: 'id', RAVELRY_CLIENT_SECRET: 's' })
        ?.ravelry,
    ).toEqual({
      clientId: 'id',
      clientSecret: 's',
      oauthUrl: 'https://www.ravelry.com',
      apiUrl: 'https://api.ravelry.com',
    });
  });
});
