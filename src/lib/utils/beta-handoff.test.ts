import { describe, expect, it } from 'vitest';
import {
  MAX_HANDOFF_PROJECTS,
  isStoredProject,
  planImport,
  readHandoff,
} from './beta-handoff';

const v6Project = (id: string) => ({
  date: '2026-01-01T00:00:00.000Z',
  href: `https://temperature-blanket.com/?project=${id}&l=1#x`,
  title: 'Berlin, 2025',
  isCustomWeatherData: false,
  weatherData: [],
  weatherSource: { name: 'Meteostat', useSecondary: true },
});

const message = (projects: unknown[], extra: object = {}) => ({
  type: 'tb-handoff-projects',
  version: 1,
  projects,
  ...extra,
});

describe('isStoredProject', () => {
  it('takes a v6 saved project', () => {
    expect(isStoredProject(v6Project('1'))).toBe(true);
  });

  it('refuses one without what opening needs', () => {
    expect(isStoredProject({ ...v6Project('1'), href: 'not a link' })).toBe(
      false,
    );
    expect(isStoredProject({ ...v6Project('1'), weatherData: 'x' })).toBe(
      false,
    );
    expect(isStoredProject(null)).toBe(false);
  });
});

describe('readHandoff', () => {
  it('reads the projects', () => {
    const read = readHandoff(
      message([{ id: '170000', project: v6Project('170000') }]),
    );
    expect(read?.projects.map((p) => p.id)).toEqual(['170000']);
    expect(read?.invalid).toBe(0);
  });

  it('is null for other messages', () => {
    expect(readHandoff({ type: 'something-else' })).toBeNull();
    expect(readHandoff(message([], { version: 2 }))).toBeNull();
    expect(readHandoff(message([], { projects: 'x' }))).toBeNull();
    expect(readHandoff('tb-handoff-projects')).toBeNull();
  });

  it('counts entries it can’t read, and a second copy of an ID', () => {
    const read = readHandoff(
      message([
        { id: '1', project: v6Project('1') },
        { id: '1', project: v6Project('1') },
        { id: '../p', project: v6Project('2') },
        { id: '3', project: { title: 'no weather' } },
      ]),
    );
    expect(read?.projects.map((p) => p.id)).toEqual(['1']);
    expect(read?.invalid).toBe(3);
  });

  it('refuses too many projects', () => {
    const many = Array.from({ length: MAX_HANDOFF_PROJECTS + 1 }, (_, i) => ({
      id: String(i),
      project: v6Project(String(i)),
    }));
    expect(readHandoff(message(many))).toBeNull();
  });
});

describe('planImport', () => {
  it('saves new projects with their links on this site', () => {
    const { save, skipped } = planImport(
      [{ id: '1', project: v6Project('1') } as never],
      [],
      'https://next.temperature-blanket.com',
    );
    expect(skipped).toEqual([]);
    expect(save[0].project.href).toBe(
      'https://next.temperature-blanket.com/?project=1&l=1#x',
    );
  });

  it('never overwrites a project already here', () => {
    const { save, skipped } = planImport(
      [
        { id: '1', project: v6Project('1') } as never,
        { id: '2', project: v6Project('2') } as never,
      ],
      ['1'],
      'https://next.temperature-blanket.com',
    );
    expect(save.map((p) => p.id)).toEqual(['2']);
    expect(skipped).toEqual(['1']);
  });
});
