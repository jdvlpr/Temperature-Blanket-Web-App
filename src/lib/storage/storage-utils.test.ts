import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MigrationManager } from './migration-manager';
import { ProjectStorage } from './projects';
import * as storageUtils from './storage-utils.svelte';

// Mock idb-keyval
const idbStore = new Map<string, any>();
vi.mock('idb-keyval', () => ({
  get: vi.fn((key: string) => Promise.resolve(idbStore.get(key) || null)),
  set: vi.fn((key: string, value: any) => {
    idbStore.set(key, value);
    return Promise.resolve();
  }),
  del: vi.fn((key: string) => {
    idbStore.delete(key);
    return Promise.resolve();
  }),
}));

// Mock $lib/state
vi.mock('$lib/state', () => ({
  weather: {
    source: { name: 'Meteostat', useSecondary: false, settings: {} },
    isUserEdited: false,
    rawData: [],
    isFromLocalStorage: false,
  },
  project: {
    url: { href: 'http://localhost/?project=123' },
    status: {
      temporaryProjectsBackup: [],
      error: { code: null, message: '' },
    },
  },
  locations: {
    projectTitle: 'Test Project',
  },
}));

// Mock preferences
vi.mock('$lib/storage/preferences.svelte', () => ({
  preferences: {
    value: {
      theme: { id: 'classic', mode: 'system' },
      seasons: [],
      layout: 'default',
      disableToastAnalytics: false,
      units: 'imperial',
    },
  },
}));

vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
}));

vi.mock('$lib/components/ThemeSwitcher.svelte', () => ({
  skeletonThemes: [{ id: 'classic', name: 'Classic' }],
}));

describe('storage-utils integration', () => {
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    localStorageMock = {};
    idbStore.clear();

    const localStorageShim = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
    };

    vi.stubGlobal('localStorage', localStorageShim);
    vi.stubGlobal('window', {
      localStorage: localStorageShim,
      matchMedia: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
      })),
      location: { href: 'http://localhost/?project=123' },
    });
    vi.stubGlobal('indexedDB', {});
    vi.stubGlobal('$effect', { root: vi.fn() });
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('document', {
      documentElement: {
        classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() },
        setAttribute: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize and call migration', async () => {
    const migrateSpy = vi
      .spyOn(MigrationManager, 'migrateFromLocalStorage')
      .mockResolvedValue(undefined);

    await storageUtils.initializeLocalStorage();

    expect(migrateSpy).toHaveBeenCalled();
  });

  it('should save project through storage class', async () => {
    const saveSpy = vi
      .spyOn(ProjectStorage, 'save')
      .mockResolvedValue(undefined);

    await storageUtils.setProjectInStorage();

    expect(saveSpy).toHaveBeenCalledWith('123', expect.any(Object));
  });

  it('should load project through storage class', async () => {
    const projectData = {
      title: 'Saved',
      href: 'http://localhost/?project=123',
      weatherSource: { name: 'Meteostat' },
      isCustomWeatherData: true,
      weatherData: [{ date: '2024-01-01', temp: 10 }],
    };

    vi.spyOn(ProjectStorage, 'getById').mockResolvedValue(projectData as any);

    await storageUtils.checkForProjectInStorage();

    const { weather } = await import('$lib/state');
    expect(weather.rawData).toHaveLength(1);
    expect(weather.isFromLocalStorage).toBe(true);
  });
});
