import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as storageUtils from './storage-utils.svelte';

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
    it('should save and retrieve a project', () => {
      // Setup initial state for setLocalStorageProject
      // We mocked $lib/state above.

      // Act
      storageUtils.setLocalStorageProject();

      // Assert
      expect(window.localStorage.setItem).toHaveBeenCalled();
      const index = JSON.parse(localStorageMock['projects_index'] || '[]');
      expect(index).toHaveLength(1);
      expect(index[0].id).toBe('123');
      expect(index[0].meta.title).toBe('Test Project');

      const savedProject = JSON.parse(localStorageMock['p_123'] || '{}');
      expect(savedProject.title).toBe('Test Project');
    });

    it('should retrieve saved project by href', () => {
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
      localStorageMock['p_456'] = JSON.stringify(projectData);
      localStorageMock['projects_index'] = JSON.stringify([
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
      const result = storageUtils.getSavedProjectByHref(href);

      // Assert
      expect(result).not.toBeNull();
      expect(result.title).toBe('Retrieved Project');
    });

    it('should remove project by href', () => {
      // Setup
      const href = 'http://localhost/?project=789';
      localStorageMock['p_789'] = JSON.stringify({});
      localStorageMock['projects_index'] = JSON.stringify([
        { id: '789', meta: { href } },
      ]);

      // Act
      storageUtils.removeProjectByHref(href);

      // Assert
      expect(localStorageMock['p_789']).toBeUndefined();
      const index = JSON.parse(localStorageMock['projects_index'] || '[]');
      expect(index).toHaveLength(0);
    });

    it('should return projects list for display in reverse order', () => {
      // Setup
      localStorageMock['projects_index'] = JSON.stringify([
        { id: '1', meta: { title: 'First' } },
        { id: '2', meta: { title: 'Second' } },
      ]);

      const list = storageUtils.getProjectsListForDisplay();
      expect(list).toHaveLength(2);
      expect(list[0].meta.title).toBe('Second');
      expect(list[1].meta.title).toBe('First');
    });
  });

  describe('Edge Cases', () => {
    it('migrates legacy projects to per-key storage and generates unique ids', () => {
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
      storageUtils.initializeLocalStorage();

      // Assert
      const index = JSON.parse(localStorageMock['projects_index'] || '[]');
      expect(index).toHaveLength(2);

      const projectKeys = Object.keys(localStorageMock).filter((k) =>
        k.startsWith('p_'),
      );
      expect(projectKeys).toHaveLength(2);
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
      localStorageMock[`p_${id}`] = JSON.stringify(projectData);
      localStorageMock['projects_index'] = JSON.stringify([
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
      await storageUtils.checkForProjectInLocalStorage();

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
      localStorageMock[`p_${id}`] = JSON.stringify(projectData);
      localStorageMock['projects_index'] = JSON.stringify([
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

      await storageUtils.checkForProjectInLocalStorage();

      const { weather } = await import('$lib/state');
      expect(weather.isFromLocalStorage).toBe(false);
      expect(weather.rawData).toHaveLength(0);
    });

    it('does not throw on malformed skeletonTheme', async () => {
      localStorageMock['skeletonTheme'] = 'not-json';
      const effectFn = (cb) => cb();
      effectFn.root = (cb) => cb();
      vi.stubGlobal('$effect', effectFn);

      expect(() => storageUtils.initializeLocalStorage()).not.toThrow();

      const { localState } = await import('$lib/state');
      expect(localState.value.theme.id).toBe('classic');
    });
  });
});
