// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
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

// One sync pass for one account, independent of IndexedDB and fetch so it can be
// unit-tested against a fake server. The rules:
//
// - Each project carries the server revision it was last synced at. A save based
//   on an older revision is rejected (409) instead of overwriting.
// - Never lose data: when both sides changed, the server copy keeps the project
//   and the device's copy becomes a new project, "… (copy from this device, …)".
// - An edit beats a deletion from another device.

import type { StoredProject } from '$lib/storage/projects.svelte';
import type { ChangesResponse, ProjectMeta, SyncErrorCode } from './protocol';
import type { Seen } from './seen';

/** Sync bookkeeping kept with each saved project on this device. */
export type ProjectSyncState = {
  /** The account the project belongs to */
  ownerUserId: string;
  /** The server revision this copy matches; null if it was never uploaded */
  rev: number | null;
  /** Changed on this device since it was last uploaded */
  dirty: boolean;
  /** When it was last edited on this device (ms) */
  updatedAt: number;
  lastSyncedAt: number | null;
  /** Why the last upload failed, for errors that retrying won't fix */
  error: SyncErrorCode | null;
};

export type LocalItem = { id: string; sync?: ProjectSyncState };

/** Per account, per device. */
export type AccountSyncState = {
  /** The last server revision seen */
  since: number;
  /** Deletions made on this device that the server hasn't confirmed */
  pendingDeletes: { id: string; baseRev: number }[];
  /** Whether this device already asked to add its other projects to the account */
  importAsked?: boolean;
};

export { unchangedSince, type Seen } from './seen';

export interface LocalStore {
  list(): Promise<LocalItem[]>;
  read(id: string): Promise<StoredProject | null>;
  /**
   * Writes a project as given, never marking it changed, if it's still as
   * `seen`. Returns whether it wrote. Checking and writing must be atomic.
   */
  put(
    id: string,
    project: StoredProject,
    sync: ProjectSyncState,
    seen: Seen,
  ): Promise<boolean>;
  /** Updates a project's sync state from its current one, if it still exists */
  updateSync(
    id: string,
    update: (current: ProjectSyncState | undefined) => ProjectSyncState,
  ): Promise<void>;
  /** Removes a project from this device only, if it's still as `seen` */
  remove(id: string, seen: Seen): Promise<boolean>;
  accountState(userId: string): Promise<AccountSyncState>;
  setAccountState(userId: string, state: AccountSyncState): Promise<void>;
}

export type Upload = {
  baseRev: number | null;
  json: string;
  title: string;
  clientUpdatedAt: number;
  /** projectFingerprint() of the project */
  contentHash: string;
};

export type SaveOutcome =
  { ok: true; meta: ProjectMeta } | { ok: false; current: ProjectMeta | null };

export type DeleteOutcome = { ok: true } | { ok: false; current: ProjectMeta };

export interface SyncServer {
  changes(since: number): Promise<ChangesResponse>;
  /** The project's JSON and revision, or null if it's gone */
  download(id: string): Promise<{ rev: number; json: string } | null>;
  upload(id: string, upload: Upload): Promise<SaveOutcome>;
  /** Deleting a project that's already gone counts as done */
  remove(id: string, baseRev: number): Promise<DeleteOutcome>;
}

/** A failed request. Anything but the codes below stops the whole pass. */
export class SyncHttpError extends Error {
  constructor(
    public status: number,
    public code: SyncErrorCode | undefined,
    message: string,
  ) {
    super(message);
  }
}

/** Errors that belong to one project; the pass carries on with the rest. */
const PROJECT_ERRORS: SyncErrorCode[] = [
  'QUOTA_EXCEEDED',
  'PROJECT_TOO_LARGE',
  'INVALID_REQUEST',
];

/**
 * What makes two copies of a project the same: everything but the site its link
 * points at and the "saved at" label, which differ between devices.
 */
export function projectFingerprintText(project: StoredProject) {
  let href = project.href;
  try {
    const url = new URL(project.href);
    href = url.pathname + url.search + url.hash;
  } catch {
    // Keep it as it is
  }
  return JSON.stringify({ ...project, href, date: undefined });
}

export type SyncOptions = {
  /** SHA-256 in hex */
  sha256: (text: string) => Promise<string>;
  /** This site's origin: saved links point at the site they were saved on */
  origin: string;
  now?: () => number;
  /** A new ID for a conflict copy */
  newId?: () => string;
};

export type SyncReport = {
  uploaded: string[];
  downloaded: string[];
  removed: string[];
  /** IDs of the device copies made when both sides changed */
  copies: string[];
  failed: { id: string; code: SyncErrorCode }[];
};

/** A saved project's link, moved to this origin and this project ID. */
export function rehomeHref(href: string, origin: string, id: string) {
  try {
    const url = new URL(href);
    const rehomed = new URL(url.pathname + url.search + url.hash, origin);
    rehomed.searchParams.set('project', id);
    return rehomed.href;
  } catch {
    return new URL(`/?project=${encodeURIComponent(id)}`, origin).href;
  }
}

const copyDateLabel = (time: number) =>
  new Date(time).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

export async function syncAccount(
  userId: string,
  local: LocalStore,
  server: SyncServer,
  options: SyncOptions,
): Promise<SyncReport> {
  const now = options.now ?? Date.now;
  const report: SyncReport = {
    uploaded: [],
    downloaded: [],
    removed: [],
    copies: [],
    failed: [],
  };

  let state = await local.accountState(userId);
  const saveState = async (next: AccountSyncState) => {
    state = next;
    await local.setAccountState(userId, next);
  };

  const owned = async () =>
    new Map(
      (await local.list())
        .filter((item) => item.sync?.ownerUserId === userId)
        .map((item) => [item.id, item.sync!] as const),
    );

  /** An ID no project on this device has yet */
  const newId = async () => {
    const make = options.newId ?? (() => String(now()));
    let id = make();
    for (let n = 1; await local.read(id); n++) id = `${make()}-${n}`;
    return id;
  };

  const syncedState = (
    rev: number,
    base?: ProjectSyncState,
  ): ProjectSyncState => ({
    ownerUserId: userId,
    rev,
    dirty: false,
    updatedAt: base?.updatedAt ?? now(),
    lastSyncedAt: now(),
    error: null,
  });

  const fingerprint = (project: StoredProject) =>
    options.sha256(projectFingerprintText(project));

  async function localHash(id: string) {
    const project = await local.read(id);
    return project ? fingerprint(project) : null;
  }

  /**
   * Marks a project synced at `rev`, unless it was saved again since `seen`:
   * then it stays changed, now based on `rev`.
   */
  const settle = (id: string, rev: number, seen: ProjectSyncState) =>
    local.updateSync(id, (s) =>
      s && s.updatedAt !== seen.updatedAt
        ? { ...s, rev, error: null }
        : syncedState(rev, s),
    );

  /**
   * Replaces the device copy with the server's, unless it changed since `seen`.
   * 'gone' if the server no longer has it.
   */
  async function download(id: string, seen: Seen) {
    const data = await server.download(id);
    if (!data) return 'gone';
    const project = JSON.parse(data.json) as StoredProject;
    project.href = rehomeHref(project.href, options.origin, id);
    const base = seen === 'absent' ? undefined : seen;
    if (await local.put(id, project, syncedState(data.rev, base), seen))
      report.downloaded.push(id);
    return 'done';
  }

  /** Both sides changed: keep the device's version as a new project, take the server's. */
  async function keepBoth(
    id: string,
    seen: ProjectSyncState,
  ): Promise<string | null> {
    const mine = await local.read(id);
    let copyId: string | null = null;
    if (mine) {
      copyId = await newId();
      const title = mine.title?.trim() || 'Untitled project';
      const wrote = await local.put(
        copyId,
        {
          ...mine,
          title: `${title} (copy from this device, ${copyDateLabel(now())})`,
          href: rehomeHref(mine.href, options.origin, copyId),
        },
        {
          ownerUserId: userId,
          rev: null,
          dirty: true,
          updatedAt: now(),
          lastSyncedAt: null,
          error: null,
        },
        'absent',
      );
      if (wrote) report.copies.push(copyId);
      else copyId = null;
    }
    // Saved again meanwhile: nothing is replaced, and the next pass looks again
    if ((await download(id, seen)) === 'gone') await local.remove(id, seen);
    return copyId;
  }

  // 1. Deletions made here. A 409 means it was edited elsewhere: the edit wins,
  //    and the pull below brings it back.
  for (const pending of [...state.pendingDeletes]) {
    await server.remove(pending.id, pending.baseRev);
    await saveState({
      ...state,
      pendingDeletes: state.pendingDeletes.filter((p) => p.id !== pending.id),
    });
  }

  // 2. Pull what changed on the server
  let fullResync = false;
  const seenOnServer = new Set<string>();
  let since = state.since;
  for (;;) {
    const page = await server.changes(since);
    if (page.fullResyncRequired) {
      fullResync = true;
      since = 0;
      continue;
    }

    const mine = await owned();
    for (const meta of page.changes) {
      seenOnServer.add(meta.id);
      const sync = mine.get(meta.id);
      if (sync?.rev === meta.rev) continue;

      if (meta.deleted) {
        if (!sync) continue;
        if (sync.dirty) {
          // Edited here after it was deleted elsewhere: upload over the deletion
          await local.updateSync(meta.id, (s) => ({
            ...(s ?? sync),
            rev: meta.rev,
          }));
        } else if (await local.remove(meta.id, sync)) {
          report.removed.push(meta.id);
        }
        continue;
      }

      if (sync?.dirty) {
        const hash = await localHash(meta.id);
        if (hash && hash === meta.contentHash)
          await settle(meta.id, meta.rev, sync);
        else await keepBoth(meta.id, sync);
        continue;
      }

      // Not here, or unchanged here: take the server's. A project of this
      // browser only (no account) with the same ID is left alone.
      if (sync || !(await local.read(meta.id)))
        await download(meta.id, sync ?? 'absent');
    }

    since = page.nextSince;
    await saveState({ ...state, since });
    if (!page.hasMore) break;
  }

  // A device that missed purged deletion records compares its whole list
  if (fullResync)
    for (const [id, sync] of await owned()) {
      if (sync.rev === null || seenOnServer.has(id)) continue;
      if (sync.dirty)
        await local.updateSync(id, (s) => ({ ...(s ?? sync), rev: null }));
      else if (await local.remove(id, sync)) report.removed.push(id);
    }

  // 3. Push what changed here, including copies made along the way
  const queue = [...(await owned()).keys()];
  while (queue.length) {
    const id = queue.shift()!;
    const sync = (await owned()).get(id);
    if (!sync?.dirty) continue;
    const project = await local.read(id);
    if (!project) continue;

    const contentHash = await fingerprint(project);
    const attempt = (baseRev: number | null) =>
      server.upload(id, {
        baseRev,
        json: JSON.stringify(project),
        title: project.title ?? '',
        clientUpdatedAt: sync.updatedAt,
        contentHash,
      });

    let outcome: SaveOutcome;
    try {
      outcome = await attempt(sync.rev);
      // Deleted elsewhere meanwhile: this edit wins
      if (!outcome.ok && outcome.current?.deleted)
        outcome = await attempt(outcome.current.rev);
    } catch (e) {
      if (
        e instanceof SyncHttpError &&
        e.code &&
        PROJECT_ERRORS.includes(e.code)
      ) {
        await local.updateSync(id, (s) => ({ ...(s ?? sync), error: e.code! }));
        report.failed.push({ id, code: e.code });
        continue;
      }
      throw e;
    }

    if (outcome.ok) {
      // Saved again while uploading: stays changed, now based on the new revision
      await settle(id, outcome.meta.rev, sync);
      report.uploaded.push(id);
      continue;
    }

    // Another device saved first
    const current = outcome.current;
    if (current && current.contentHash === contentHash)
      await settle(id, current.rev, sync);
    else {
      const copyId = await keepBoth(id, sync);
      if (copyId) queue.push(copyId);
    }
  }

  return report;
}
