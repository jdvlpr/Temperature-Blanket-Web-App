import { describe, expect, it, vi } from 'vitest';
import { mergeProjectTrash } from './account-trash.svelte';
import type { TrashedProject } from './projects.svelte';

vi.mock('./projects.svelte', () => ({ ProjectStorage: {} }));

const trashed = (
  id: string,
  deletedAt: number,
  owner?: string,
): TrashedProject => ({
  item: {
    id,
    meta: {
      date: '',
      href: '',
      title: `Local ${id}`,
      isCustomWeatherData: false,
    },
    ...(owner && {
      sync: {
        ownerUserId: owner,
        rev: 1,
        dirty: false,
        updatedAt: 0,
        lastSyncedAt: 0,
        error: null,
      },
    }),
  },
  project: {} as never,
  position: 0,
  deletedAt,
});

const onAccount = (id: string, deletedAt: number) => ({
  id,
  rev: 2,
  title: `Account ${id}`,
  deletedAt,
  sizeBytes: 10,
});

describe('mergeProjectTrash', () => {
  it('lists both, one entry per project, newest first', () => {
    const { entries, stale } = mergeProjectTrash(
      [trashed('both', 100, 'u1'), trashed('guest', 300)],
      {
        items: [onAccount('both', 100), onAccount('elsewhere', 200)],
        fetchedAt: 1000,
        pendingAtFetch: new Set(),
      },
      new Set(),
    );
    expect(entries.map((e) => [e.id, !!e.local, !!e.account])).toEqual([
      ['guest', true, false],
      ['elsewhere', false, true],
      ['both', true, true],
    ]);
    expect(entries.find((e) => e.id === 'elsewhere')?.label).toBe(
      'Account elsewhere',
    );
    expect(stale).toEqual([]);
  });

  it('drops a local copy the account restored or deleted for good elsewhere', () => {
    const { entries, stale } = mergeProjectTrash(
      [trashed('gone', 100, 'u1')],
      { items: [], fetchedAt: 1000, pendingAtFetch: new Set() },
      new Set(),
    );
    expect(entries).toEqual([]);
    expect(stale).toEqual(['gone']);
  });

  it('keeps a local copy whose deletion hasn’t reached the account, or was on its way when fetched', () => {
    const account = {
      items: [],
      fetchedAt: 1000,
      pendingAtFetch: new Set(['sent']),
    };
    const { entries, stale } = mergeProjectTrash(
      [
        trashed('waiting', 100, 'u1'),
        trashed('sent', 100, 'u1'),
        trashed('after', 2000, 'u1'),
      ],
      account,
      new Set(['waiting']),
    );
    expect(entries.map((e) => e.id).sort()).toEqual([
      'after',
      'sent',
      'waiting',
    ]);
    expect(stale).toEqual([]);
  });

  it('keeps everything local when the account can’t be reached', () => {
    const { entries, stale } = mergeProjectTrash(
      [trashed('a', 100, 'u1')],
      null,
      new Set(),
    );
    expect(entries.map((e) => e.id)).toEqual(['a']);
    expect(stale).toEqual([]);
  });
});
