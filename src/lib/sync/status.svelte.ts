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

// What the app shows about sync. Kept apart from the sync code so pages can show
// it without loading that code for guests.

import type { ProjectSyncState, SyncReport } from './engine';

export type SyncState =
  | 'idle'
  | 'syncing'
  | 'offline'
  /** Switched off on the server; everything local keeps working */
  | 'paused'
  /** The session ended; projects stay on this device */
  | 'signed-out'
  | 'not-invited'
  | 'error';

export const sync = $state({
  /** Whether this browser is syncing an account */
  active: false,
  state: 'idle' as SyncState,
  lastSyncedAt: null as number | null,
  /** Goes up after every pass, so lists of projects know to reload */
  version: 0,
  lastReport: null as SyncReport | null,
});

export type SyncLabel = {
  text: string;
  tone: 'success' | 'warning' | 'error' | 'surface';
};

/** Where a saved project is kept, for the list of saved projects. */
export function syncLabelFor(item: { sync?: ProjectSyncState }): SyncLabel {
  const state = item.sync;
  if (!state) return { text: 'Only in this browser', tone: 'surface' };
  if (state.error === 'QUOTA_EXCEEDED')
    return { text: 'Not synced: account storage full', tone: 'error' };
  if (state.error === 'PROJECT_TOO_LARGE')
    return { text: 'Not synced: too large', tone: 'error' };
  if (state.error) return { text: 'Not synced', tone: 'error' };
  if (state.dirty) return { text: 'Waiting to sync', tone: 'warning' };
  return { text: 'Synced', tone: 'success' };
}
