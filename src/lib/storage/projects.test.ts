import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ProjectStorage } from './projects.svelte';

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

vi.mock('$lib/state', () => ({
  project: {
    url: { href: 'http://localhost/?project=123' },
    onLoaded: { href: 'http://localhost/?project=123' },
  },
  weather: {
    source: { name: 'Meteostat', useSecondary: false, settings: {} },
    isUserEdited: false,
    rawData: [],
  },
  locations: {
    projectTitle: 'Test Project',
    all: [],
  },
}));

vi.mock('$lib/utils', () => ({
  dateToISO8601String: vi.fn((d) => d.toISOString().split('T')[0]),
  stringToDate: vi.fn((s) => new Date(s)),
  getMoonPhase: vi.fn(() => 0),
  numberOfDays: vi.fn(() => 1),
}));

describe('ProjectStorage', () => {
  beforeEach(() => {
    vi_mockStore.data.clear();
    vi.stubGlobal('indexedDB', {});
    vi.stubGlobal('window', {
      location: { href: 'http://localhost/?project=123' },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should detect availability', () => {
    expect(ProjectStorage.isAvailable()).toBe(true);
    vi.stubGlobal('indexedDB', undefined);
    expect(ProjectStorage.isAvailable()).toBe(false);
  });

  it('should save and retrieve by id', async () => {
    const project = {
      date: '2024-01-01',
      title: 'Test',
      href: 'http://localhost/?project=123',
      isCustomWeatherData: false,
      weatherData: [],
      weatherSource: { name: 'Meteostat' },
    } as any;

    await ProjectStorage.save({ id: '123', localProject: project });

    const retrieved = await ProjectStorage.getById('123');
    expect(retrieved).toEqual(project);

    const index = await ProjectStorage.getIndex();
    expect(index).toHaveLength(1);
    expect(index[0].id).toBe('123');
  });

  it('should fail save if verification fails', async () => {
    const { set } = await import('idb-keyval');
    vi.mocked(set).mockResolvedValue(undefined); // Simulate success but don't actually update our map

    // We need to bypass the mock for get to return null for this specific ID
    const { get } = await import('idb-keyval');
    vi.mocked(get).mockResolvedValue(null);

    const project = { title: 'Fail' } as any;
    await expect(
      ProjectStorage.save({ id: 'fail', localProject: project }),
    ).rejects.toThrow(/Failed to verify/);
  });

  it('should retrieve by href', async () => {
    const href = 'http://localhost/?project=456';
    const project = { title: 'By Href', href } as any;

    await ProjectStorage.save({ id: '456', localProject: project });

    const retrieved = await ProjectStorage.getByHref(href);
    expect(retrieved?.title).toBe('By Href');

    const indexItem = await ProjectStorage.getIndexItemByHref(href);
    expect(indexItem?.id).toBe('456');
  });

  it('should remove by id and href', async () => {
    await ProjectStorage.save({ id: '1', localProject: { href: 'h1' } as any });
    await ProjectStorage.save({ id: '2', localProject: { href: 'h2' } as any });

    await ProjectStorage.removeById('1');
    expect(await ProjectStorage.getById('1')).toBeNull();
    expect(await ProjectStorage.getIndex()).toHaveLength(1);

    await ProjectStorage.removeByHref('h2');
    expect(await ProjectStorage.getById('2')).toBeNull();
    expect(await ProjectStorage.getIndex()).toHaveLength(0);
  });

  it('should return projects for display reversed', async () => {
    await ProjectStorage.save({
      id: '1',
      localProject: { title: 'First' } as any,
    });
    await ProjectStorage.save({
      id: '2',
      localProject: { title: 'Second' } as any,
    });

    const display = await ProjectStorage.getProjectsForDisplay();
    expect(display[0].meta.title).toBe('Second');
    expect(display[1].meta.title).toBe('First');
  });
});
