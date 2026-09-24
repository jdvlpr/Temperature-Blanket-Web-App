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

  describe('createdAt', () => {
    const UUID = '0b7c6f1e-3c1a-4d2e-9f00-5a6b7c8d9e0f';
    // One day of weather in 2025, before every creation date used below
    const weatherData = [{ date: '2025-01-01', tmax: 1, tmin: 0 }];

    // Stored weather days hold ISO date strings rather than Date objects
    const storedProject = (
      fields: Omit<Partial<StoredProject>, 'weatherData'> & {
        weatherData: typeof weatherData;
      },
    ) => fields as unknown as StoredProject;

    function openProject(id: string) {
      const href = `http://localhost/?project=${id}`;
      vi_mockProject.url.href = href;
      vi_mockProject.onLoaded.href = href;
    }

    beforeEach(() => {
      vi_mockProject.createdAt = '';
      vi_mockWeather.wasLoadedFromStorage = false;
      vi_mockWeather.setRawData = vi.fn();
    });

    it('saves the project state createdAt instead of the save time', async () => {
      openProject(UUID);
      vi_mockProject.createdAt = '2024-02-03T04:05:06.000Z';
      await ProjectStorage.save();
      const stored = await ProjectStorage.getById(UUID);
      expect(stored?.createdAt).toBe('2024-02-03T04:05:06.000Z');
    });

    it('keeps the original createdAt when a loaded project is saved again', async () => {
      await ProjectStorage.save({
        id: UUID,
        localProject: storedProject({
          createdAt: '2025-06-01T00:00:00.000Z',
          href: `http://localhost/?project=${UUID}`,
          isCustomWeatherData: false,
          weatherData,
        }),
      });
      openProject(UUID);
      vi_mockProject.createdAt = '2026-09-24T00:00:00.000Z'; // page load time
      await ProjectStorage.load();
      expect(vi_mockProject.createdAt).toBe('2025-06-01T00:00:00.000Z');

      await ProjectStorage.save();
      const stored = await ProjectStorage.getById(UUID);
      expect(stored?.createdAt).toBe('2025-06-01T00:00:00.000Z');
    });

    it('loads stored weather for a UUID project with createdAt', async () => {
      await ProjectStorage.save({
        id: UUID,
        localProject: storedProject({
          createdAt: '2025-06-01T00:00:00.000Z',
          href: `http://localhost/?project=${UUID}`,
          isCustomWeatherData: false,
          weatherData,
        }),
      });
      openProject(UUID);
      await ProjectStorage.load();
      expect(vi_mockWeather.setRawData).toHaveBeenCalled();
      expect(vi_mockWeather.wasLoadedFromStorage).toBe(true);
    });

    it('still loads a legacy timestamp project without createdAt', async () => {
      const legacyId = String(Date.parse('2025-06-01T00:00:00.000Z'));
      await ProjectStorage.save({
        id: legacyId,
        localProject: storedProject({
          href: `http://localhost/?project=${legacyId}`,
          isCustomWeatherData: false,
          weatherData,
        }),
      });
      openProject(legacyId);
      await ProjectStorage.load();
      expect(vi_mockWeather.setRawData).toHaveBeenCalled();
    });

    it('does not load weather that reaches past the creation date', async () => {
      await ProjectStorage.save({
        id: UUID,
        localProject: storedProject({
          createdAt: '2024-12-31T00:00:00.000Z',
          href: `http://localhost/?project=${UUID}`,
          isCustomWeatherData: false,
          weatherData,
        }),
      });
      openProject(UUID);
      await ProjectStorage.load();
      expect(vi_mockWeather.setRawData).not.toHaveBeenCalled();
    });

    it('with no known creation date, loads only user-edited weather', async () => {
      await ProjectStorage.save({
        id: UUID,
        localProject: storedProject({
          href: `http://localhost/?project=${UUID}`,
          isCustomWeatherData: false,
          weatherData,
        }),
      });
      openProject(UUID);
      await ProjectStorage.load();
      expect(vi_mockWeather.setRawData).not.toHaveBeenCalled();

      await ProjectStorage.save({
        id: UUID,
        localProject: storedProject({
          href: `http://localhost/?project=${UUID}`,
          isCustomWeatherData: true,
          weatherData,
        }),
      });
      await ProjectStorage.load();
      expect(vi_mockWeather.setRawData).toHaveBeenCalled();
    });
  });
});
