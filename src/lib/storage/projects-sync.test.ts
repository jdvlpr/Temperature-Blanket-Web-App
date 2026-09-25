import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ProjectStorage, type StoredProject } from './projects.svelte';

// Shared store for mock
const vi_mockStore = {
  data: new Map<string, any>(),
};

vi.mock('idb-keyval', () => ({
  get: vi.fn((key: string) =>
    Promise.resolve(vi_mockStore.data.get(key) || null),
  ),
  set: vi.fn((key: string, value: any) => {
    vi_mockStore.data.set(key, value);
    return Promise.resolve();
  }),
  del: vi.fn((key: string) => {
    vi_mockStore.data.delete(key);
    return Promise.resolve();
  }),
}));

vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
  version: '1.0.0',
}));

const vi_mockProject = vi.hoisted(() => ({
  url: { href: 'http://localhost/?project=123' },
  onLoaded: { href: 'http://localhost/?project=123' },
  createdAt: '',
}));

const vi_mockWeather = vi.hoisted(() => ({
  source: { name: 'Meteostat', useSecondary: false, settings: {} },
  isUserEdited: false,
  rawData: [],
  wasLoadedFromStorage: false,
  setRawData: (() => {}) as (data: unknown[]) => void,
}));

vi.mock('$lib/state/project-state.svelte', () => ({
  project: vi_mockProject,
}));

vi.mock('$lib/state/weather-state.svelte', () => ({
  weather: vi_mockWeather,
  getMoonPhase: vi.fn(() => 0),
}));

vi.mock('$lib/state/location-state.svelte', () => ({
  locations: {
    projectTitle: 'Test Project',
    all: [],
    load: () => {},
  },
}));

vi.mock('$lib/utils/date-utils', () => ({
  dateToISO8601String: vi.fn((d) => d.toISOString().split('T')[0]),
  stringToDate: vi.fn((s) => new Date(s)),
  numberOfDays: vi.fn(() => 1),
}));

const saved: StoredProject = {
  date: 'today',
  href: 'http://localhost/?project=123',
  isCustomWeatherData: true,
  title: 'Toronto',
  weatherData: [],
  weatherSource: { name: 'Meteostat', useSecondary: false } as never,
};

describe('ProjectStorage with sync', () => {
  let owner: string | null = null;
  const originalOwner = ProjectStorage.syncOwner;

  beforeEach(() => {
    vi_mockStore.data.clear();
    vi.stubGlobal('indexedDB', {});
    vi.stubGlobal('window', {
      location: { href: 'http://localhost/?project=123' },
    });
    owner = null;
    ProjectStorage.syncOwner = () => owner;
    ProjectStorage.onChange = undefined;
  });

  afterEach(() => {
    ProjectStorage.syncOwner = originalOwner;
    ProjectStorage.onChange = undefined;
  });

  it('keeps a guest save free of sync state', async () => {
    const item = await ProjectStorage.save({ id: '1', localProject: saved });
    expect(item?.sync).toBeUndefined();
  });

  it('marks a signed-in save as the account’s and changed, keeping its revision', async () => {
    owner = 'u1';
    const onChange = vi.fn();
    ProjectStorage.onChange = onChange;

    await ProjectStorage.save({ id: '1', localProject: saved });
    await ProjectStorage.updateSyncStates((item) => ({
      ...item.sync!,
      rev: 7,
      dirty: false,
    }));
    const item = await ProjectStorage.save({ id: '1', localProject: saved });

    expect(item?.sync).toMatchObject({
      ownerUserId: 'u1',
      rev: 7,
      dirty: true,
      error: null,
    });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('queues the deletion of a synced project for the server', async () => {
    owner = 'u1';
    await ProjectStorage.save({ id: 'synced', localProject: saved });
    await ProjectStorage.save({ id: 'never-uploaded', localProject: saved });
    await ProjectStorage.updateSyncStates((item) =>
      item.id === 'synced'
        ? { ...item.sync!, rev: 3, dirty: false }
        : 'unchanged',
    );

    await ProjectStorage.removeById('synced');
    await ProjectStorage.removeById('never-uploaded');

    expect(await ProjectStorage.getIndex()).toEqual([]);
    expect(await ProjectStorage.accountSyncState('u1')).toEqual({
      since: 0,
      pendingDeletes: [{ id: 'synced', baseRev: 3 }],
    });
  });

  it("lists guest projects and the signed-in account's, not another account's", async () => {
    await ProjectStorage.save({ id: 'guest', localProject: saved });
    owner = 'u1';
    await ProjectStorage.save({ id: 'mine', localProject: saved });
    owner = 'u2';
    await ProjectStorage.save({ id: 'theirs', localProject: saved });

    owner = 'u1';
    const ids = (await ProjectStorage.getProjectsForDisplay()).map((i) => i.id);
    expect(ids).toEqual(['mine', 'guest']);

    owner = null;
    expect(
      (await ProjectStorage.getProjectsForDisplay()).map((i) => i.id),
    ).toEqual(['guest']);
  });
});
