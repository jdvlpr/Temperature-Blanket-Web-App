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

// Kept apart from the engine so project storage can use it without loading the
// engine for everyone.

import type { LocalItem, ProjectSyncState } from './engine';

/**
 * What a pass saw of a project before writing to it: its sync state, or 'absent'
 * if it wasn't on this device. Writes from the server go ahead only if the
 * project is still as seen, so a save made during a pass is never overwritten.
 */
export type Seen = ProjectSyncState | 'absent';

/** Whether a project is still as a pass saw it (for LocalStore implementations). */
export function unchangedSince(current: LocalItem | undefined, seen: Seen) {
  if (seen === 'absent') return !current;
  return (
    current?.sync?.updatedAt === seen.updatedAt &&
    current.sync.dirty === seen.dirty
  );
}
