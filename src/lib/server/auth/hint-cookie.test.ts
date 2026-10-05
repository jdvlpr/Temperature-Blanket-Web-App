import { describe, expect, it } from 'vitest';
import { sessionCookieChange, withSignedInHint } from './hint-cookie';

describe('sessionCookieChange', () => {
  it('recognizes a new session, with or without the __Secure- prefix', () => {
    expect(
      sessionCookieChange('tb.session_token=abc.sig; Path=/; HttpOnly'),
    ).toBe(true);
    expect(
      sessionCookieChange('__Secure-tb.session_token=abc.sig; Path=/; Secure'),
    ).toBe(true);
  });

  it('recognizes a cleared session', () => {
    expect(sessionCookieChange('tb.session_token=; Max-Age=0; Path=/')).toBe(
      false,
    );
    expect(sessionCookieChange('tb.session_token=abc; Path=/; Max-Age=0')).toBe(
      false,
    );
  });

  it('ignores other cookies', () => {
    expect(sessionCookieChange('tb.session_data=x; Path=/')).toBeUndefined();
    expect(sessionCookieChange('theme=classic; Path=/')).toBeUndefined();
  });
});

describe('withSignedInHint', () => {
  const responseWith = (...cookies: string[]) => {
    const headers = new Headers();
    for (const cookie of cookies) headers.append('Set-Cookie', cookie);
    return new Response('{}', { headers });
  };

  it('sets the hint when a session starts', () => {
    const { response, signedIn } = withSignedInHint(
      responseWith('__Secure-tb.session_token=abc.sig; Path=/; HttpOnly'),
      true,
    );
    expect(signedIn).toBe(true);
    const hint = response.headers
      .getSetCookie()
      .find((c) => c.startsWith('tb_signed_in='));
    expect(hint).toMatch(
      /^tb_signed_in=1; Max-Age=\d+; Path=\/; SameSite=Lax; Secure$/,
    );
    expect(hint).not.toMatch(/HttpOnly/i);
  });

  it('clears the hint when a session ends', () => {
    const { response, signedIn } = withSignedInHint(
      responseWith('tb.session_token=; Max-Age=0; Path=/'),
      false,
    );
    expect(signedIn).toBe(false);
    expect(response.headers.getSetCookie()).toContain(
      'tb_signed_in=; Max-Age=0; Path=/; SameSite=Lax',
    );
  });

  it('leaves other responses alone', () => {
    const original = responseWith('theme=classic; Path=/');
    const { response, signedIn } = withSignedInHint(original, true);
    expect(signedIn).toBeUndefined();
    expect(response).toBe(original);
  });
});
