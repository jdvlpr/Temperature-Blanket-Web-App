import { describe, expect, it, vi } from 'vitest';
import { verifyTurnstile } from './turnstile.js';

// A Siteverify that answers with this JSON (and HTTP status)
const siteverify = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('verifyTurnstile', () => {
  it('passes a token Siteverify accepts, sending the IP along', async () => {
    const fetch = siteverify({ success: true });
    expect(
      await verifyTurnstile({
        token: 'token',
        secret: 'secret',
        remoteIp: '203.0.113.1',
        fetch,
      }),
    ).toBe('ok');
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      secret: 'secret',
      response: 'token',
      remoteip: '203.0.113.1',
    });
  });

  it('rejects a missing or too-long token without asking', async () => {
    const fetch = siteverify({ success: true });
    expect(await verifyTurnstile({ token: null, secret: 's', fetch })).toBe(
      'rejected',
    );
    expect(
      await verifyTurnstile({ token: 'x'.repeat(2049), secret: 's', fetch }),
    ).toBe('rejected');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an invalid, expired or reused token', async () => {
    for (const code of ['invalid-input-response', 'timeout-or-duplicate'])
      expect(
        await verifyTurnstile({
          token: 't',
          secret: 's',
          fetch: siteverify({ success: false, 'error-codes': [code] }),
        }),
      ).toBe('rejected');
  });

  it('is unavailable without a secret, never letting it through', async () => {
    const fetch = siteverify({ success: true });
    expect(
      await verifyTurnstile({ token: 't', secret: undefined, fetch }),
    ).toBe('unavailable');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('is unavailable when Siteverify fails or has a problem', async () => {
    const down = vi.fn(async () => {
      throw new TypeError('network');
    });
    expect(
      await verifyTurnstile({ token: 't', secret: 's', fetch: down }),
    ).toBe('unavailable');
    expect(
      await verifyTurnstile({
        token: 't',
        secret: 's',
        fetch: siteverify({}, 500),
      }),
    ).toBe('unavailable');
    expect(
      await verifyTurnstile({
        token: 't',
        secret: 's',
        fetch: siteverify({
          success: false,
          'error-codes': ['internal-error'],
        }),
      }),
    ).toBe('unavailable');
    expect(
      await verifyTurnstile({
        token: 't',
        secret: 's',
        fetch: siteverify({
          success: false,
          'error-codes': ['invalid-input-secret'],
        }),
      }),
    ).toBe('unavailable');
  });
});
