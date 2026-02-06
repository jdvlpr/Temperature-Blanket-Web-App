import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MigrationManager } from '../storage/migration-manager';
import { ProjectStorage } from './projects.svelte';

// Mock ProjectStorage
vi.mock('./projects.svelte', () => ({
  ProjectStorage: {
    isAvailable: vi.fn(() => true),
    getById: vi.fn(),
    save: vi.fn(),
  },
}));

// Mock $lib/state
vi.mock('$lib/state', () => ({
  project: {
    status: {
      temporaryProjectsBackup: [],
    },
  },
}));

describe('MigrationManager', () => {
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    localStorageMock = {};
    const localStorageShim = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
    };
    vi.stubGlobal('localStorage', localStorageShim);
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid' });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should migrate successfully and remove legacy key', async () => {
    const legacy = [{ title: 'P1', href: 'http://h/?project=1' }];
    localStorageMock['projects'] = JSON.stringify(legacy);

    vi.mocked(ProjectStorage.getById).mockResolvedValue(null);
    vi.mocked(ProjectStorage.save).mockResolvedValue(undefined);

    await MigrationManager.migrateFromLocalStorage();

    expect(ProjectStorage.save).toHaveBeenCalledWith('1', legacy[0]);
    expect(localStorageMock['projects']).toBeUndefined();
  });

  it('should create backup before migration', async () => {
    const legacy = [{ title: 'P1', href: 'h1' }];
    localStorageMock['projects'] = JSON.stringify(legacy);

    const { project } = await import('$lib/state');
    project.status.temporaryProjectsBackup = [];

    await MigrationManager.migrateFromLocalStorage();

    expect(project.status.temporaryProjectsBackup).toEqual(legacy);
  });

  it('should throw if some projects fail and NOT remove legacy key', async () => {
    const legacy = [
      { title: 'Succeed', href: 'h1' },
      { title: 'Fail', href: 'h2' },
    ];
    localStorageMock['projects'] = JSON.stringify(legacy);

    vi.mocked(ProjectStorage.save)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Save failed'));

    await expect(MigrationManager.migrateFromLocalStorage()).rejects.toThrow(
      /Only 1 of 2 projects/,
    );
    expect(localStorageMock['projects']).toBeDefined();
  });

  it('should handle malformed JSON', async () => {
    localStorageMock['projects'] = 'not-json';
    await MigrationManager.migrateFromLocalStorage();
    expect(localStorageMock['projects']).toBeUndefined();
  });
});
