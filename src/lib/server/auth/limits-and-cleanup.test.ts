import { describe, expect, it } from 'vitest';
import { cleanUpExpired } from './cleanup';
import {
  allowCodeRequest,
  CODE_REQUESTS_PER_EMAIL,
  CODE_REQUEST_WINDOW_MS,
} from './code-request-limit';
import { createTestD1 } from './test-d1';

describe('allowCodeRequest', () => {
  it('allows 5 codes per email per hour, ignoring case and spaces', async () => {
    const { d1 } = createTestD1();
    const now = Date.parse('2026-09-25T10:00:00Z');
    for (let i = 0; i < CODE_REQUESTS_PER_EMAIL; i++)
      expect(await allowCodeRequest(d1, 'A@Example.test', now + i)).toBe(true);
    expect(await allowCodeRequest(d1, ' a@example.test ', now + 10)).toBe(
      false,
    );
    // Other addresses are counted separately
    expect(await allowCodeRequest(d1, 'b@example.test', now + 10)).toBe(true);
    // A new window starts after an hour
    expect(
      await allowCodeRequest(
        d1,
        'a@example.test',
        now + CODE_REQUEST_WINDOW_MS,
      ),
    ).toBe(true);
  });

  it('stores a hash, not the address', async () => {
    const { d1, sqlite } = createTestD1();
    await allowCodeRequest(d1, 'private@example.test');
    const rows = sqlite.prepare('select "key" from "codeRequestLimit"').all();
    expect(rows).toHaveLength(1);
    expect(String(rows[0].key)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('cleanUpExpired', () => {
  it('deletes only expired sessions, codes and stale limits', async () => {
    const { d1, sqlite } = createTestD1();
    const now = Date.parse('2026-09-25T10:00:00Z');
    const iso = (ms: number) => new Date(ms).toISOString();
    const DAY = 24 * 60 * 60 * 1000;

    sqlite.exec(
      `insert into "user" values ('u1', '', 'u@example.test', 1, null, '${iso(now)}', '${iso(now)}')`,
    );
    const session = sqlite.prepare(
      `insert into "session" values (?, ?, ?, ?, ?, null, null, 'u1')`,
    );
    session.run('old', iso(now - 1), 'token-old', iso(now), iso(now));
    session.run('live', iso(now + DAY), 'token-live', iso(now), iso(now));

    const code = sqlite.prepare(
      `insert into "verification" values (?, 'id', 'v', ?, ?, ?)`,
    );
    code.run('expired', iso(now - 1), iso(now), iso(now));
    code.run('valid', iso(now + 60_000), iso(now), iso(now));

    sqlite
      .prepare(`insert into "rateLimit" values (?, ?, 1, ?)`)
      .run('r-old', 'old-key', now - 2 * DAY);
    sqlite
      .prepare(`insert into "rateLimit" values (?, ?, 1, ?)`)
      .run('r-new', 'new-key', now);
    sqlite
      .prepare(`insert into "codeRequestLimit" values (?, ?, 1)`)
      .run('stale', now - 2 * DAY);
    sqlite
      .prepare(`insert into "codeRequestLimit" values (?, ?, 1)`)
      .run('fresh', now);

    await cleanUpExpired(d1, now);

    const ids = (table: string, column = 'id') =>
      sqlite
        .prepare(`select "${column}" as id from "${table}" order by 1`)
        .all()
        .map((row) => row.id);
    expect(ids('session')).toEqual(['live']);
    expect(ids('verification')).toEqual(['valid']);
    expect(ids('rateLimit')).toEqual(['r-new']);
    expect(ids('codeRequestLimit', 'key')).toEqual(['fresh']);
  });
});
