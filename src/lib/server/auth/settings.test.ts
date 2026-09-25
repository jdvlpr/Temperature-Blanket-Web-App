import { describe, expect, it } from 'vitest';
import { emailChangedNotice, signInCodeEmail } from './emails';
import { trustedOriginsFor } from './options';
import { readAuthSettings } from './settings';

const SECRET = 'x'.repeat(32);
const ready = {
  ACCOUNTS_ENABLED: 'true',
  BETTER_AUTH_SECRET: SECRET,
  AUTH_ALLOWED_HOSTS: 'temperature-blanket.com',
  EMAIL_SENDER: 'resend',
  RESEND_API_KEY: 're_test',
  EMAIL_FROM: 'Temperature Blanket <sign-in@example.test>',
};

describe('readAuthSettings', () => {
  it('is off unless ACCOUNTS_ENABLED is exactly "true", as in production today', () => {
    expect(readAuthSettings(undefined).status).toBe('disabled');
    expect(readAuthSettings({}).status).toBe('disabled');
    expect(
      readAuthSettings({ ...ready, ACCOUNTS_ENABLED: 'TRUE' }).status,
    ).toBe('disabled');
  });

  it('refuses a missing or short secret instead of using a default', () => {
    expect(
      readAuthSettings({ ...ready, BETTER_AUTH_SECRET: undefined }).status,
    ).toBe('misconfigured');
    expect(
      readAuthSettings({ ...ready, BETTER_AUTH_SECRET: 'short' }).status,
    ).toBe('misconfigured');
  });

  it('needs an explicit host list that doesn’t allow every host', () => {
    for (const hosts of [undefined, '', ' , ', '*', '*.pages.dev'])
      expect(
        readAuthSettings({ ...ready, AUTH_ALLOWED_HOSTS: hosts }).status,
      ).toBe('misconfigured');
  });

  it('refuses to run without a way to send codes', () => {
    expect(readAuthSettings({ ...ready, EMAIL_SENDER: undefined }).status).toBe(
      'misconfigured',
    );
    expect(
      readAuthSettings({ ...ready, EMAIL_SENDER: 'dev-outbox' }).status,
    ).toBe('misconfigured');
  });

  it('rejects an unknown protocol and defaults to https', () => {
    expect(readAuthSettings({ ...ready, AUTH_PROTOCOL: 'ftp' }).status).toBe(
      'misconfigured',
    );
    expect(readAuthSettings(ready)).toEqual({
      status: 'ready',
      settings: {
        secret: SECRET,
        allowedHosts: ['temperature-blanket.com'],
        protocol: 'https',
      },
    });
  });

  it('trims and splits the host list', () => {
    const result = readAuthSettings({
      ...ready,
      AUTH_ALLOWED_HOSTS:
        ' temperature-blanket.com, *.temperature-blanket-web-app.pages.dev ,',
    });
    expect(result.status === 'ready' && result.settings.allowedHosts).toEqual([
      'temperature-blanket.com',
      '*.temperature-blanket-web-app.pages.dev',
    ]);
  });
});

describe('trustedOriginsFor', () => {
  it('builds origins for each host and protocol', () => {
    expect(trustedOriginsFor(['a.com', '*.b.dev'], 'https')).toEqual([
      'https://a.com',
      'https://*.b.dev',
    ]);
    expect(trustedOriginsFor(['localhost:8788'], 'auto')).toEqual([
      'https://localhost:8788',
      'http://localhost:8788',
    ]);
  });
});

describe('signInCodeEmail', () => {
  it('puts the code in the subject and body', () => {
    const email = signInCodeEmail('a@example.test', '123456', 'sign-in');
    expect(email.to).toBe('a@example.test');
    expect(email.subject).toBe('123456 is your Temperature Blanket code');
    expect(email.text).toContain('\n123456\n');
    expect(email.text).toContain('to sign in');
  });

  it('describes an email change', () => {
    expect(
      signInCodeEmail('a@example.test', '123456', 'change-email').text,
    ).toContain('confirm your new email address');
  });
});

describe('emailChangedNotice', () => {
  it('goes to the old address and masks the new one', () => {
    const notice = emailChangedNotice(
      'old@example.test',
      'newname@example.test',
    );
    expect(notice.to).toBe('old@example.test');
    expect(notice.text).toContain('changed to n***@example.test');
    expect(notice.text).not.toContain('newname');
  });
});
