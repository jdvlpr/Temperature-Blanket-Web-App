import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  newProjectId,
  PROJECT_ID_PATTERN,
  projectCreatedAtTime,
  timestampFromLegacyProjectId,
} from './project-id-utils';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newProjectId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a UUID that matches the project ID pattern', () => {
    const id = newProjectId();
    expect(id).toMatch(UUID_V4_PATTERN);
    expect(id).toMatch(PROJECT_ID_PATTERN);
    expect(newProjectId()).not.toBe(id);
  });

  it('falls back to getRandomValues without crypto.randomUUID (insecure contexts)', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => bytes.fill(0xff));
    vi.stubGlobal('crypto', { getRandomValues });
    const id = newProjectId();
    expect(getRandomValues).toHaveBeenCalled();
    expect(id).toMatch(UUID_V4_PATTERN);
    expect(id).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  });

  it('falls back to Math.random without any crypto', () => {
    vi.stubGlobal('crypto', undefined);
    expect(newProjectId()).toMatch(UUID_V4_PATTERN);
  });

  it('falls back when crypto.randomUUID throws', () => {
    vi.stubGlobal('crypto', {
      randomUUID: () => {
        throw new Error('insecure context');
      },
      getRandomValues: (bytes: Uint8Array) => bytes,
    });
    expect(newProjectId()).toMatch(UUID_V4_PATTERN);
  });
});

describe('PROJECT_ID_PATTERN', () => {
  it('accepts legacy timestamp IDs and UUIDs', () => {
    expect('1727190000000').toMatch(PROJECT_ID_PATTERN);
    expect('0b7c6f1e-3c1a-4d2e-9f00-5a6b7c8d9e0f').toMatch(PROJECT_ID_PATTERN);
  });

  it('rejects empty, long, or unsafe IDs', () => {
    expect('').not.toMatch(PROJECT_ID_PATTERN);
    expect('a'.repeat(65)).not.toMatch(PROJECT_ID_PATTERN);
    expect('../p_1').not.toMatch(PROJECT_ID_PATTERN);
    expect('1 2').not.toMatch(PROJECT_ID_PATTERN);
  });
});

describe('timestampFromLegacyProjectId', () => {
  it('reads the timestamp from a legacy ID', () => {
    expect(timestampFromLegacyProjectId('1727190000000')).toBe(1727190000000);
  });

  it('returns null for UUIDs and missing IDs', () => {
    expect(
      timestampFromLegacyProjectId('0b7c6f1e-3c1a-4d2e-9f00-5a6b7c8d9e0f'),
    ).toBeNull();
    expect(timestampFromLegacyProjectId('1e12')).toBeNull();
    // Past the largest valid Date, so toISOString() would throw
    expect(timestampFromLegacyProjectId('8700000000000000')).toBeNull();
    expect(timestampFromLegacyProjectId('99999999999999999999')).toBeNull();
    expect(timestampFromLegacyProjectId('')).toBeNull();
    expect(timestampFromLegacyProjectId(null)).toBeNull();
  });
});

describe('projectCreatedAtTime', () => {
  it('prefers the stored createdAt', () => {
    expect(
      projectCreatedAtTime({
        createdAt: '2026-09-24T12:00:00.000Z',
        id: '1727190000000',
      }),
    ).toBe(Date.parse('2026-09-24T12:00:00.000Z'));
  });

  it('falls back to a legacy timestamp ID', () => {
    expect(projectCreatedAtTime({ id: '1727190000000' })).toBe(1727190000000);
    expect(
      projectCreatedAtTime({ createdAt: 'not a date', id: '1727190000000' }),
    ).toBe(1727190000000);
  });

  it('returns null when neither is available', () => {
    expect(
      projectCreatedAtTime({ id: '0b7c6f1e-3c1a-4d2e-9f00-5a6b7c8d9e0f' }),
    ).toBeNull();
    expect(projectCreatedAtTime({})).toBeNull();
  });
});
