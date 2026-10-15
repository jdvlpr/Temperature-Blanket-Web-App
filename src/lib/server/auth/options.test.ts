import { describe, expect, it } from 'vitest';
import { buildAuthOptions, SIGN_UPS_PAUSED } from './options';

const config = (signUpsOpen?: () => Promise<boolean>, emailSignIn = true) =>
  buildAuthOptions({
    database: undefined,
    secret: 'x'.repeat(32),
    allowedHosts: ['localhost'],
    protocol: 'http',
    sendSignInCode: async () => undefined,
    runInBackground: () => undefined,
    validateSchema: false,
    signUpsOpen,
    emailSignIn,
  });

const newUser = {
  id: 'u1',
  name: '  Sam\u200b ',
  email: 'sam@example.test',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('creating a user', () => {
  it('cleans the name while sign-ups are open', async () => {
    const before = config(async () => true).databaseHooks.user.create.before;
    expect(await before(newUser)).toMatchObject({ data: { name: 'Sam' } });
  });

  it('refuses with SIGN_UPS_PAUSED when they are closed or full', async () => {
    const before = config(async () => false).databaseHooks.user.create.before;
    await expect(before(newUser)).rejects.toMatchObject({
      body: { code: SIGN_UPS_PAUSED },
    });
  });
});

describe('email codes', () => {
  it('turns off the password reset routes, which would email codes', () => {
    expect(config().disabledPaths).toEqual(
      expect.arrayContaining([
        '/email-otp/request-password-reset',
        '/forget-password/email-otp',
      ]),
    );
  });
});

describe('Google-only sign-in', () => {
  it('leaves out the email code routes when emailSignIn is off', () => {
    expect(config(undefined, false).plugins).toEqual([]);
    expect(config().plugins.map((plugin) => plugin.id)).toEqual(['email-otp']);
  });

  it('won’t unlink the last provider when there’s no email code to fall back on', () => {
    expect(
      config(undefined, false).account.accountLinking.allowUnlinkingAll,
    ).toBe(false);
    expect(config().account.accountLinking.allowUnlinkingAll).toBe(true);
  });
});
