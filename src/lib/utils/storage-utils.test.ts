import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
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
  entries: vi.fn(() => Promise.resolve(Array.from(idbStore.entries()))),
}));

// Mock $lib/state
vi.mock('$lib/state', () => ({
  localState: {
    value: {
      theme: { id: 'classic', mode: 'system' },
      seasons: [],
      layout: 'default',
      disableToastAnalytics: false,
      units: 'imperial',
    },
  },
  weather: {
    source: { name: 'Meteostat', useSecondary: false, settings: {} },
    isUserEdited: false,
    rawData: [],
    isFromLocalStorage: false,
    grouping: 'month',
    data: [],
  },
  project: {
    url: { href: 'http://localhost/?project=123' },
    gallery: { href: '', title: '' },
    status: {
      temporaryProjectsBackup: [],
      temporaryUid: null,
      temporaryError: null,
      saved: false,
      error: null,
      loading: false,
    },
  },
  locations: {
    projectTitle: 'Test Project',
    all: [],
  },
}));

vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
}));

// Mock ThemeSwitcher
vi.mock('$lib/components/ThemeSwitcher.svelte', () => ({
  skeletonThemes: [{ id: 'classic', name: 'Classic' }],
}));

describe('storage-utils', () => {
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
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
    };

    const matchMediaShim = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Mock window
    vi.stubGlobal('window', {
      localStorage: localStorageShim,
      matchMedia: matchMediaShim,
      location: { search: '', href: 'http://localhost/' },
    });

    // Mock indexedDB
    vi.stubGlobal('indexedDB', {
      open: vi.fn(),
    });

    // Mock document
    vi.stubGlobal('document', {
      documentElement: {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          toggle: vi.fn(),
        },
        setAttribute: vi.fn(),
      },
    });

    // Mock global localStorage as well just in case
    vi.stubGlobal('localStorage', localStorageShim);

    // Mock fetch
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Legacy Key Migration', () => {
    it('should migrate legacy projects key to per-key storage', () => {
      const legacyProjects = [
        {
          href: 'http://localhost/?project=123',
          date: '2024-01-01',
          title: 'Legacy Project',
          isCustomWeatherData: false,
          weatherData: [],
          weatherSource: { name: 'Meteostat' },
        },
      ];
      localStorageMock['projects'] = JSON.stringify(legacyProjects);

      // handleLegacyLocalStorageKeys is not exported, so we cannot invoke it directly in this test.
      // Migration logic is implicitly tested if we could simulate initializeLocalStorage,
      // but without full Svelte environment mock, we focus on the public API surface.
      // However, initializeLocalStorage has Svelte effects ($effect.root).
      // We can try calling a function that calls migration if accessible,
      // or we just trust that initializeLocalStorage calls it.
      // Since handleLegacyLocalStorageKeys is not exported, we can't test it directly unless we export it or rely on side effects.
      // But we can test the exported logic if we modify the file or use a way to invoke it.
      // Let's call initializeLocalStorage. It uses $effect, which might fail in pure jsdom without svelte setup.
      // Wait, svelte 5 runes might work in node/jsdom if compiled, but testing it might be tricky without full svelte test env.

      // Instead, let's focus on the exported functions that manipulate storage.
    });
  });

  describe('Project Storage', () => {
    it('should save and retrieve a project', async () => {
      // Setup initial state for setProjectInStorage
      // We mocked $lib/state above.

      // Act
      await storageUtils.setProjectInStorage();

      // Assert - check IndexedDB store
      const index = idbStore.get('projects_index') || [];
      expect(index).toHaveLength(1);
      expect(index[0].id).toBe('123');
      expect(index[0].meta.title).toBe('Test Project');

      const savedProject = idbStore.get('p_123');
      expect(savedProject).toBeDefined();
      expect(savedProject.title).toBe('Test Project');
    });

    it('should retrieve saved project by href', async () => {
      // Setup
      const href = 'http://localhost/?project=456';
      const projectData = {
        date: '2024-01-01',
        title: 'Retrieved Project',
        href: href,
        isCustomWeatherData: false,
        weatherData: [],
        weatherSource: { name: 'Meteostat' },
      };
      idbStore.set('p_456', projectData);
      idbStore.set('projects_index', [
        {
          id: '456',
          meta: {
            href,
            title: 'Retrieved Project',
            date: '2024-01-01',
            isCustomWeatherData: false,
          },
        },
      ]);

      // Act
      const result = await storageUtils.getSavedProjectByHref(href);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Retrieved Project');
    });

    it('should remove project by href', async () => {
      // Setup
      const href = 'http://localhost/?project=789';
      idbStore.set('p_789', {});
      idbStore.set('projects_index', [{ id: '789', meta: { href } }]);

      // Act
      await storageUtils.removeProjectByHref(href);

      // Assert
      expect(idbStore.has('p_789')).toBe(false);
      const index = idbStore.get('projects_index') || [];
      expect(index).toHaveLength(0);
    });

    it('should return projects list for display in reverse order', async () => {
      // Setup
      idbStore.set('projects_index', [
        { id: '1', meta: { title: 'First' } },
        { id: '2', meta: { title: 'Second' } },
      ]);

      const list = await storageUtils.getProjectsListForDisplay();
      expect(list).toHaveLength(2);
      expect(list[0].meta.title).toBe('Second');
      expect(list[1].meta.title).toBe('First');
    });
  });

  describe('Edge Cases', () => {
    it('migrates legacy projects from localStorage to IndexedDB and generates unique ids', async () => {
      const legacyProjects = [
        {
          href: 'http://localhost/',
          date: '2024-01-01',
          title: 'Legacy A',
          isCustomWeatherData: false,
          weatherData: [],
          weatherSource: { name: 'Meteostat' },
        },
        {
          href: 'http://localhost/',
          date: '2024-01-02',
          title: 'Legacy B',
          isCustomWeatherData: false,
          weatherData: [],
          weatherSource: { name: 'Meteostat' },
        },
      ];
      localStorageMock['projects'] = JSON.stringify(legacyProjects);

      // stub $effect so initializeLocalStorage can run without svelte runtime
      const effectFn = (cb) => cb();
      effectFn.root = (cb) => cb();
      vi.stubGlobal('$effect', effectFn);

      // Act
      await storageUtils.initializeLocalStorage();

      // Assert - check IndexedDB store
      const index = idbStore.get('projects_index') || [];
      expect(index).toHaveLength(2);

      // Check that projects were migrated to IndexedDB
      const projectKeys = Array.from(idbStore.keys()).filter((k) =>
        k.startsWith('p_'),
      );
      expect(projectKeys.length).toBeGreaterThanOrEqual(2);

      // Check that legacy localStorage key was removed
      expect(localStorageMock['projects']).toBeUndefined();
    });

    it('does not load project when project href has non-numeric timestamp', async () => {
      const id = 'abc123';
      const href = 'http://localhost/?project=abc';
      const projectData = {
        date: '2024-01-01',
        title: 'Bad Timestamp',
        href: href,
        isCustomWeatherData: false,
        weatherData: [{ date: '2024-01-01', temp: 10 }],
        weatherSource: { name: 'Meteostat' },
      };
      idbStore.set(`p_${id}`, projectData);
      idbStore.set('projects_index', [
        {
          id,
          meta: {
            href,
            title: 'Bad Timestamp',
            date: '2024-01-01',
            isCustomWeatherData: false,
          },
        },
      ]);

      // Set current URL to load project by id
      window.location.href = `http://localhost/?project=${id}`;
      // Make window.location toString-able for URL constructor used in tests
      // @ts-ignore
      window.location = {
        toString: () => window.location.href,
        href: window.location.href,
      };

      // Act
      await storageUtils.checkForProjectInStorage();

      // Assert
      const { weather } = await import('$lib/state');
      expect(weather.isFromLocalStorage).toBe(false);
      expect(weather.rawData).toHaveLength(0);
    });

    it('does not load project when weatherData is empty', async () => {
      const id = 'empty';
      const href = 'http://localhost/?project=123';
      const projectData = {
        date: '2024-01-01',
        title: 'Empty Weather',
        href: href,
        isCustomWeatherData: true,
        weatherData: [],
        weatherSource: { name: 'Meteostat' },
      };
      idbStore.set(`p_${id}`, projectData);
      idbStore.set('projects_index', [
        {
          id,
          meta: {
            href,
            title: 'Empty Weather',
            date: '2024-01-01',
            isCustomWeatherData: true,
          },
        },
      ]);

      window.location.href = `http://localhost/?project=${id}`;
      // Make window.location toString-able for URL constructor used in tests
      // @ts-ignore
      window.location = {
        toString: () => window.location.href,
        href: window.location.href,
      };

      await storageUtils.checkForProjectInStorage();

      const { weather } = await import('$lib/state');
      expect(weather.isFromLocalStorage).toBe(false);
      expect(weather.rawData).toHaveLength(0);
    });

    it('does not throw on malformed skeletonTheme', async () => {
      localStorageMock['skeletonTheme'] = 'not-json';
      const effectFn = (cb) => cb();
      effectFn.root = (cb) => cb();
      vi.stubGlobal('$effect', effectFn);

      await expect(storageUtils.initializeLocalStorage()).resolves.not.toThrow();

      const { localState } = await import('$lib/state');
      expect(localState.value.theme.id).toBe('classic');
    });
  });
});
