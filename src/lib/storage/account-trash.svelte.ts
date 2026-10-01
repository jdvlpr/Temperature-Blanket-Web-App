// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

// The Trash's projects: this browser's (projects_trash) and, while signed in,
// the account's, which any device can restore or delete for good. Deleted
// palettes need nothing here: they sync with the rest of the palettes.
//
// The account's list wins for the account's projects, so a project deleted for
// good or restored on another device leaves this browser's Trash too. This
// browser's copy is kept while its deletion hasn't reached the account, or when
// the account's list couldn't be fetched (offline, sync paused).

import { SYNC_API, type TrashedProjectMeta } from '$lib/sync/protocol';
import type { ProjectSyncState } from '$lib/sync/engine';
import {
  ProjectStorage,
  type StoredProject,
  type TrashedProject,
} from './projects.svelte';

/** The account's Trash as last fetched, or null when signed out or unreachable */
export type AccountTrashList = {
  items: TrashedProjectMeta[];
  fetchedAt: number;
  /** Deletions still waiting to reach the account when the list was fetched */
  pendingAtFetch: Set<string>;
};

export const accountTrash = $state<{ list: AccountTrashList | null }>({
  list: null,
});

export type ProjectTrashEntry = {
  id: string;
  label: string;
  deletedAt: number;
  /** This browser's copy */
  local?: TrashedProject;
  /** The account's copy */
  account?: TrashedProjectMeta;
};

const labelOf = (item: TrashedProject['item']) =>
  item.meta.name || item.meta.title || 'Untitled Project';

/**
 * This browser's Trash and the account's as one list, most recently deleted
 * first, and the local copies that are out of date (`stale`): the account's
 * projects that are no longer in its Trash, since it was fetched after their
 * deletion reached it.
 */
export function mergeProjectTrash(
  local: TrashedProject[],
  account: AccountTrashList | null,
  pendingNow: Set<string>,
): { entries: ProjectTrashEntry[]; stale: string[] } {
  const entries = new Map<string, ProjectTrashEntry>();
  const stale: string[] = [];
  const onAccount = new Map(account?.items.map((t) => [t.id, t]));

  for (const trashed of local) {
    const { id } = trashed.item;
    const mine = trashed.item.sync;
    if (
      account &&
      mine &&
      !onAccount.has(id) &&
      !pendingNow.has(id) &&
      !account.pendingAtFetch.has(id) &&
      trashed.deletedAt < account.fetchedAt
    ) {
      stale.push(id);
      continue;
    }
    entries.set(id, {
      id,
      label: labelOf(trashed.item),
      deletedAt: trashed.deletedAt,
      local: trashed,
      account: onAccount.get(id),
    });
  }
  for (const item of account?.items ?? [])
    if (!entries.has(item.id))
      entries.set(item.id, {
        id: item.id,
        label: item.title || 'Untitled Project',
        deletedAt: item.deletedAt,
        account: item,
      });

  return {
    entries: [...entries.values()].sort((a, b) => b.deletedAt - a.deletedAt),
    stale,
  };
}

async function pendingDeletes(owner: string): Promise<Set<string>> {
  const state = await ProjectStorage.accountSyncState(owner);
  return new Set(state.pendingDeletes.map((p) => p.id));
}

/** Fetches the account's Trash; null when signed out or it can't be reached. */
export async function refreshAccountTrash(): Promise<void> {
  const owner = ProjectStorage.syncOwner();
  if (!owner) {
    accountTrash.list = null;
    return;
  }
  try {
    const pendingAtFetch = await pendingDeletes(owner);
    const fetchedAt = Date.now();
    const response = await fetch(`${SYNC_API}/trash`, {
      credentials: 'same-origin',
    });
    accountTrash.list = response.ok
      ? {
          items: (await response.json()).projects,
          fetchedAt,
          pendingAtFetch,
        }
      : null;
  } catch {
    accountTrash.list = null;
  }
}

/** The Trash's projects, dropping local copies the account says are out of date. */
export async function loadProjectTrash(): Promise<ProjectTrashEntry[]> {
  const local = await ProjectStorage.getTrash();
  const owner = ProjectStorage.syncOwner();
  const pendingNow = owner ? await pendingDeletes(owner) : new Set<string>();
  const { entries, stale } = mergeProjectTrash(
    local,
    owner ? accountTrash.list : null,
    pendingNow,
  );
  for (const id of stale) await ProjectStorage.deleteForever(id);
  return entries;
}

// A project from the account's Trash, downloaded once to show and to restore
const downloads = new Map<string, Promise<StoredProject | null>>();

/** A project in the account's Trash, as saved; null if it's gone. */
export function trashedProject(id: string): Promise<StoredProject | null> {
  let download = downloads.get(id);
  if (!download) {
    download = (async () => {
      try {
        const response = await fetch(
          `${SYNC_API}/trash/${encodeURIComponent(id)}`,
          { credentials: 'same-origin' },
        );
        if (!response.ok || !response.body) return null;
        const { gunzip } = await import('$lib/sync/http');
        const { rehomeHref } = await import('$lib/sync/engine');
        const project = JSON.parse(
          await gunzip(response.body),
        ) as StoredProject;
        project.href = rehomeHref(project.href, location.origin, id);
        return project;
      } catch {
        return null;
      }
    })();
    downloads.set(id, download);
    // A failure can be tried again
    download.then((p) => p || downloads.delete(id));
  }
  return download;
}

/**
 * Restores a project. This browser's copy is put back as it was; one only the
 * account has is downloaded. Either way it's saved over the deletion on the
 * next sync, so every device gets it back.
 */
export async function restoreTrashEntry(entry: ProjectTrashEntry) {
  if (entry.local) {
    await ProjectStorage.restoreFromTrash(entry.id);
  } else if (entry.account) {
    const owner = ProjectStorage.syncOwner();
    const project = await trashedProject(entry.id);
    if (!owner || !project) throw new Error('Not in the Trash');
    const sync: ProjectSyncState = {
      ownerUserId: owner,
      rev: entry.account.rev,
      dirty: true,
      updatedAt: Date.now(),
      lastSyncedAt: null,
      error: null,
    };
    await ProjectStorage.putRestored(entry.id, project, sync);
  }
  dropFromAccountList([entry.id]);
}

/**
 * Deletes a project for good, here and in the account. When its deletion
 * hasn't reached the account yet, the account's copy goes once it does.
 */
export async function deleteTrashEntryForever(entry: ProjectTrashEntry) {
  if (entry.account) await purge(entry.id);
  else if (entry.local?.item.sync)
    await ProjectStorage.queuePurge(
      entry.local.item.sync.ownerUserId,
      entry.id,
    );
  if (entry.local) await ProjectStorage.deleteForever(entry.id);
  dropFromAccountList([entry.id]);
}

/** Empties the Trash's projects, here and in the account, in one request. */
export async function emptyProjectTrash(entries: ProjectTrashEntry[]) {
  if (entries.some((e) => e.account)) await purge(null);
  for (const entry of entries)
    if (!entry.account && entry.local?.item.sync)
      await ProjectStorage.queuePurge(
        entry.local.item.sync.ownerUserId,
        entry.id,
      );
  await ProjectStorage.emptyTrash();
  dropFromAccountList(entries.map((e) => e.id));
}

async function purge(id: string | null) {
  const response = await fetch(
    `${SYNC_API}/trash${id === null ? '' : `/${encodeURIComponent(id)}`}`,
    { method: 'DELETE', credentials: 'same-origin' },
  );
  if (!response.ok) throw new Error(`Purge failed: ${response.status}`);
}

function dropFromAccountList(ids: string[]) {
  const list = accountTrash.list;
  if (!list) return;
  const gone = new Set(ids);
  accountTrash.list = {
    ...list,
    items: list.items.filter((t) => !gone.has(t.id)),
  };
}
