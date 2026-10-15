import { describe, expect, it } from 'vitest';
import { cleanUpExpired } from './cleanup';
import {
  allowCodeRequest,
  allowIpCodeRequest,
  CODE_REQUESTS_PER_EMAIL,
  CODE_REQUEST_WINDOW_MS,
  countEmailSent,
  emailsLeftToday,
  readLimit,
} from './code-request-limit';
import { createTestD1 } from '#lib/server/test-d1.js';

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

describe('allowIpCodeRequest', () => {
  it('allows the limit per IP per hour, for any addresses, storing a hash', async () => {
    const { d1, sqlite } = createTestD1();
    const now = Date.parse('2026-09-25T10:00:00Z');
    for (let i = 0; i < 3; i++)
      expect(await allowIpCodeRequest(d1, '203.0.113.7', 3, now + i)).toBe(
        true,
      );
    expect(await allowIpCodeRequest(d1, '203.0.113.7', 3, now + 10)).toBe(
      false,
    );
    expect(await allowIpCodeRequest(d1, '203.0.113.8', 3, now + 10)).toBe(true);
    expect(
      await allowIpCodeRequest(
        d1,
        '203.0.113.7',
        3,
        now + CODE_REQUEST_WINDOW_MS,
      ),
    ).toBe(true);
    const keys = sqlite
      .prepare('select "key" from "codeRequestLimit"')
      .all()
      .map((row) => String(row.key));
    expect(keys.every((key) => /^ip:[0-9a-f]{64}$/.test(key))).toBe(true);
  });
});

describe('daily email limit', () => {
  it('counts sends per UTC day, and checking doesn’t count', async () => {
    const { d1 } = createTestD1();
    const now = Date.parse('2026-09-25T10:00:00Z');
    expect(await emailsLeftToday(d1, 2, now)).toBe(true);
    expect(await emailsLeftToday(d1, 2, now)).toBe(true);
    expect(await countEmailSent(d1, 2, now)).toBe(true);
    expect(await countEmailSent(d1, 2, now + 1)).toBe(true);
    expect(await emailsLeftToday(d1, 2, now + 2)).toBe(false);
    expect(await countEmailSent(d1, 2, now + 2)).toBe(false);
    // A new UTC day starts fresh
    const tomorrow = Date.parse('2026-09-26T00:00:00Z');
    expect(await emailsLeftToday(d1, 2, tomorrow)).toBe(true);
    expect(await countEmailSent(d1, 2, tomorrow)).toBe(true);
  });

  it('reads limits, falling back when unset or not a whole number', () => {
    expect(readLimit(undefined, 95, 'X')).toBe(95);
    expect(readLimit(' 40 ', 95, 'X')).toBe(40);
    expect(readLimit('0', 95, 'X')).toBe(0);
    expect(readLimit('lots', 95, 'X')).toBe(95);
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
