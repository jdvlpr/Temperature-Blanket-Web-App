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

// Bring My Projects: handing this browser's saved projects to the version 7
// beta, which keeps its own browser storage at its own address. This page
// opens the beta's /beta/import, which says it's ready; the projects go only
// to that window, at the beta's address, and it answers with counts. The
// beta's side is $lib/utils/beta-handoff.ts on release/v7.

import type { StoredProject } from '$lib/storage/projects.svelte';

export const BETA_ORIGIN = 'https://next.temperature-blanket.com';
export const BETA_IMPORT_URL = `${BETA_ORIGIN}/beta/import`;
export const HANDOFF_VERSION = 1;

export type HandedProject = { id: string; project: StoredProject };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Whether a message is the beta saying it's ready for the projects */
export const isReady = (data: unknown) =>
  isRecord(data) &&
  data.type === 'tb-handoff-ready' &&
  data.version === HANDOFF_VERSION;

/** The beta's counts once it has saved them, or null for other messages */
export function readDone(
  data: unknown,
): { imported: number; skipped: number } | null {
  if (!isRecord(data) || data.type !== 'tb-handoff-done') return null;
  if (data.version !== HANDOFF_VERSION) return null;
  const imported = Number(data.imported);
  const skipped = Number(data.skipped);
  if (!Number.isFinite(imported) || !Number.isFinite(skipped)) return null;
  return { imported, skipped };
}

/** The message carrying the projects */
export const projectsMessage = (projects: HandedProject[]) => ({
  type: 'tb-handoff-projects',
  version: HANDOFF_VERSION,
  projects,
});

/**
 * Every saved project, read by its list entry; entries whose project is
 * missing are left out
 */
export async function collectProjects(
  ids: string[],
  read: (id: string) => Promise<StoredProject | null>,
): Promise<HandedProject[]> {
  const projects: HandedProject[] = [];
  for (const id of ids) {
    const project = await read(id);
    if (project) projects.push({ id, project });
  }
  return projects;
}
