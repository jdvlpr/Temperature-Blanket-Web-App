import { describe, expect, it, vi } from 'vitest';
import { hasAccount, readSignUpLimit, signUpsOpen } from './sign-up-limit';
import { createTestD1 } from '$lib/server/test-d1';

describe('readSignUpLimit', () => {
  it('reads a whole number, no limit when unset, and closes on anything else', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(readSignUpLimit(undefined)).toBe(null);
    expect(readSignUpLimit(' ')).toBe(null);
    expect(readSignUpLimit('200')).toBe(200);
    expect(readSignUpLimit(' 0 ')).toBe(0);
    for (const bad of ['-1', '2.5', 'two hundred', 'Infinity'])
      expect(readSignUpLimit(bad)).toBe(0);
  });
});

describe('signUpsOpen and hasAccount', () => {
  it('counts accounts against the limit', async () => {
    const { d1, sqlite } = createTestD1();
    const now = new Date().toISOString();
    const user = sqlite.prepare(
      `insert into "user" values (?, '', ?, 1, null, '${now}', '${now}')`,
    );
    user.run('u1', 'a@example.test');
    user.run('u2', 'b@example.test');

    expect(await signUpsOpen(d1, null)).toBe(true);
    expect(await signUpsOpen(d1, 3)).toBe(true);
    expect(await signUpsOpen(d1, 2)).toBe(false);
    expect(await signUpsOpen(d1, 0)).toBe(false);

    expect(await hasAccount(d1, ' A@Example.test ')).toBe(true);
    expect(await hasAccount(d1, 'c@example.test')).toBe(false);
  });
});
