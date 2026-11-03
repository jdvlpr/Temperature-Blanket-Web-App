import { describe, expect, it } from 'vitest';
import {
  collectProjects,
  isReady,
  projectsMessage,
  readDone,
} from './beta-handoff';

describe('isReady', () => {
  it('is the beta’s ready message only', () => {
    expect(isReady({ type: 'tb-handoff-ready', version: 1 })).toBe(true);
    expect(isReady({ type: 'tb-handoff-ready', version: 2 })).toBe(false);
    expect(isReady('tb-handoff-ready')).toBe(false);
  });
});

describe('readDone', () => {
  it('reads the counts', () => {
    expect(
      readDone({
        type: 'tb-handoff-done',
        version: 1,
        imported: 2,
        skipped: 1,
      }),
    ).toEqual({ imported: 2, skipped: 1 });
  });

  it('is null for anything else', () => {
    expect(readDone({ type: 'tb-handoff-ready', version: 1 })).toBeNull();
    expect(
      readDone({ type: 'tb-handoff-done', version: 1, imported: 'x' }),
    ).toBeNull();
  });
});

describe('collectProjects', () => {
  it('reads each project, leaving out missing ones', async () => {
    const stored: Record<string, unknown> = {
      a: { title: 'A' },
      c: { title: 'C' },
    };
    const projects = await collectProjects(
      ['a', 'b', 'c'],
      async (id) => (stored[id] as never) ?? null,
    );
    expect(projects.map((p) => p.id)).toEqual(['a', 'c']);
    expect(projectsMessage(projects)).toMatchObject({
      type: 'tb-handoff-projects',
      version: 1,
    });
  });
});
