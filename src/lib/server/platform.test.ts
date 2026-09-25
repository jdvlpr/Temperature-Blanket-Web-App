import { describe, expect, it } from 'vitest';
import { devRoutesEnabled, requireDevRoutes, requireStorage } from './platform';

function statusOf(fn: () => unknown): number | undefined {
  try {
    fn();
  } catch (e) {
    return (e as { status?: number }).status;
  }
  return undefined;
}

const platform = (env: NonNullable<App.Platform['env']>) =>
  ({ env }) as App.Platform;

describe('dev routes gate', () => {
  it('is closed without the flag, as in production', () => {
    expect(devRoutesEnabled(undefined)).toBe(false);
    expect(devRoutesEnabled(platform({}))).toBe(false);
    expect(devRoutesEnabled(platform({ ENABLE_DEV_ROUTES: 'false' }))).toBe(
      false,
    );
    expect(devRoutesEnabled(platform({ ENABLE_DEV_ROUTES: '1' }))).toBe(false);
    expect(statusOf(() => requireDevRoutes(undefined))).toBe(404);
  });

  it('opens only for "true"', () => {
    expect(devRoutesEnabled(platform({ ENABLE_DEV_ROUTES: 'true' }))).toBe(
      true,
    );
    expect(
      statusOf(() => requireDevRoutes(platform({ ENABLE_DEV_ROUTES: 'true' }))),
    ).toBeUndefined();
  });
});

describe('requireStorage', () => {
  it('responds 503 when the bindings are missing', () => {
    expect(statusOf(() => requireStorage(undefined))).toBe(503);
    expect(statusOf(() => requireStorage(platform({ DB: {} as never })))).toBe(
      503,
    );
  });

  it('returns both bindings when present', () => {
    const db = {} as never;
    const projects = {} as never;
    expect(requireStorage(platform({ DB: db, PROJECTS: projects }))).toEqual({
      db,
      projects,
    });
  });
});
