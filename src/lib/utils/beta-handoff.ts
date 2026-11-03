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

// Bringing saved projects from the main site to the beta. Each site keeps its
// own browser storage, so the main site (v6) hands them over in the browser:
//
//   1. Its Bring My Projects button opens <beta>/beta/import with window.open.
//   2. That page posts { type: 'tb-handoff-ready', version: 1 } to its opener,
//      for the main site's origin only (MAIN_SITE_ORIGIN), every second until
//      the projects come.
//   3. The main site answers, with targetOrigin the beta's origin:
//      { type: 'tb-handoff-projects', version: 1,
//        projects: [{ id, project }] }
//      id: its key in IndexedDB less 'p_'; project: the stored object as is
//      (v6's StoredProject, which this version reads as it is).
//   4. The page takes messages only from its opener, at the main site's origin,
//      saves those it doesn't have yet (signed in, to the account) and posts
//      { type: 'tb-handoff-done', version: 1, imported, skipped }.
//
// Nothing is sent back but counts. Pure: the page does the storing.

import type { StoredProject } from '#lib/storage/projects.svelte.js';
import { rehomeHref } from '#lib/sync/engine.js';
import { PROJECT_ID_PATTERN } from '#lib/utils/project-id-utils.js';

export const HANDOFF_VERSION = 1;
/** More than anyone has saved; a handoff past it is refused */
export const MAX_HANDOFF_PROJECTS = 2000;

export type HandoffReady = { type: 'tb-handoff-ready'; version: 1 };
export type HandoffDone = {
  type: 'tb-handoff-done';
  version: 1;
  imported: number;
  skipped: number;
};
export type HandedProject = { id: string; project: StoredProject };

export const readyMessage = (): HandoffReady => ({
  type: 'tb-handoff-ready',
  version: HANDOFF_VERSION,
});

export const doneMessage = (
  imported: number,
  skipped: number,
): HandoffDone => ({
  type: 'tb-handoff-done',
  version: HANDOFF_VERSION,
  imported,
  skipped,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Whether a saved project has what opening one needs */
export function isStoredProject(value: unknown): value is StoredProject {
  if (!isRecord(value)) return false;
  if (typeof value.href !== 'string' || typeof value.date !== 'string')
    return false;
  if (typeof value.title !== 'string') return false;
  if (!Array.isArray(value.weatherData)) return false;
  try {
    new URL(value.href);
  } catch {
    return false;
  }
  return true;
}

/**
 * The projects in a handoff message, or null when it isn't one. Entries that
 * can't be read are counted as `invalid`, not thrown.
 */
export function readHandoff(
  data: unknown,
): { projects: HandedProject[]; invalid: number } | null {
  if (!isRecord(data) || data.type !== 'tb-handoff-projects') return null;
  if (data.version !== HANDOFF_VERSION) return null;
  if (!Array.isArray(data.projects)) return null;
  if (data.projects.length > MAX_HANDOFF_PROJECTS) return null;
  const projects: HandedProject[] = [];
  const seen = new Set<string>();
  let invalid = 0;
  for (const entry of data.projects) {
    if (
      isRecord(entry) &&
      typeof entry.id === 'string' &&
      PROJECT_ID_PATTERN.test(entry.id) &&
      !seen.has(entry.id) &&
      isStoredProject(entry.project)
    ) {
      seen.add(entry.id);
      projects.push({ id: entry.id, project: entry.project });
    } else invalid++;
  }
  return { projects, invalid };
}

/**
 * Which handed projects to save here: those this browser doesn't have yet,
 * their links moved to this site (`origin`). The rest are skipped, never
 * overwritten: a project already here may have been changed since.
 */
export function planImport(
  projects: HandedProject[],
  existingIds: Iterable<string>,
  origin: string,
): { save: HandedProject[]; skipped: string[] } {
  const existing = new Set(existingIds);
  const save: HandedProject[] = [];
  const skipped: string[] = [];
  for (const { id, project } of projects) {
    if (existing.has(id)) {
      skipped.push(id);
      continue;
    }
    save.push({
      id,
      project: { ...project, href: rehomeHref(project.href, origin, id) },
    });
  }
  return { save, skipped };
}
