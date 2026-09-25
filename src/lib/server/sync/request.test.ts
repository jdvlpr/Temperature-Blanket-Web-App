import { SYNC_HEADERS } from '$lib/sync/protocol';
import { describe, expect, it, vi } from 'vitest';

// The allowlist check lives beside requireSync, which pulls in Better Auth
vi.mock('$lib/server/auth', () => ({ requireAccount: vi.fn() }));
const { syncAllowedFor } = await import('./index');
const { isProjectId, parseSaveHeaders } = await import('./request');
const { MAX_PROJECT_BYTES } = await import('./store');

const valid = {
  'content-length': '1234',
  [SYNC_HEADERS.baseRev]: '7',
  [SYNC_HEADERS.clientUpdatedAt]: '1790000000000',
  [SYNC_HEADERS.schemaVersion]: '1',
  [SYNC_HEADERS.title]: encodeURIComponent('Montréal, Québec · 東京'),
  [SYNC_HEADERS.contentHash]: 'ab'.repeat(32),
};

const parse = (overrides: Record<string, string | null>) => {
  const headers = new Headers();
  for (const [k, v] of Object.entries({ ...valid, ...overrides }))
    if (v !== null) headers.set(k, v);
  return parseSaveHeaders(headers);
};

describe('parseSaveHeaders', () => {
  it('reads a save, decoding the title', () => {
    expect(parse({})).toEqual({
      ok: true,
      value: {
        baseRev: 7,
        clientUpdatedAt: 1790000000000,
        schemaVersion: 1,
        title: 'Montréal, Québec · 東京',
        contentHash: 'ab'.repeat(32),
        sizeBytes: 1234,
      },
    });
  });

  it('treats a missing base revision as a create', () => {
    expect(parse({ [SYNC_HEADERS.baseRev]: null })).toMatchObject({
      ok: true,
      value: { baseRev: null },
    });
  });

  it('needs a length within the limit', () => {
    expect(parse({ 'content-length': null })).toMatchObject({ status: 411 });
    expect(
      parse({ 'content-length': String(MAX_PROJECT_BYTES + 1) }),
    ).toMatchObject({
      status: 413,
      code: 'PROJECT_TOO_LARGE',
    });
  });

  it('rejects malformed values', () => {
    for (const bad of [
      { [SYNC_HEADERS.baseRev]: '-1' },
      { [SYNC_HEADERS.clientUpdatedAt]: 'yesterday' },
      { [SYNC_HEADERS.schemaVersion]: '0' },
      { [SYNC_HEADERS.title]: '%E0%A4%A' },
      { [SYNC_HEADERS.contentHash]: 'not-a-hash' },
    ])
      expect(parse(bad)).toMatchObject({ ok: false, status: 400 });
  });
});

describe('isProjectId', () => {
  it('accepts timestamp and UUID IDs only', () => {
    expect(isProjectId('1727190000000')).toBe(true);
    expect(isProjectId('0b8c4f1e-2a3d-4e5f-8a9b-0c1d2e3f4a5b')).toBe(true);
    for (const bad of ['', '../x', 'a/b', 'x'.repeat(65), 'a b'])
      expect(isProjectId(bad)).toBe(false);
  });
});

describe('syncAllowedFor', () => {
  it('allows everyone without a beta list, and only the list with one', () => {
    expect(syncAllowedFor('a@example.test', undefined)).toBe(true);
    expect(syncAllowedFor('a@example.test', ' ')).toBe(true);
    expect(
      syncAllowedFor('A@Example.test', 'b@example.test, a@example.test'),
    ).toBe(true);
    expect(
      syncAllowedFor('c@example.test', 'b@example.test,a@example.test'),
    ).toBe(false);
  });
});
