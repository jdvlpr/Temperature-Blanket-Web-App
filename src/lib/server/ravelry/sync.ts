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

// Changes made on Ravelry, brought here: photos, notes, yarns, and projects
// deleted there. Only when someone looks (My Projects, the share rows), never
// on a timer: one projects/list call tells which linked projects changed, and
// only those are read in full.

import { RavelryApiError, type RavelryProject } from './api';
import type { RavelrySession } from './index';
import { withoutLinkLine } from './project';
import {
  claimListCheck,
  forgetProjectLink,
  listPhotos,
  listProjectLinks,
  readPacks,
  replacePhotos,
  saveProjectLink,
  updateLinkState,
  type RavelryProjectLink,
  type StoredPack,
} from './store';

/** The project list is read at most this often per account */
export const LIST_EVERY = 6 * 60 * 60 * 1000;
/** A linked project is read in full at least this often when looked at, changed or not */
export const READ_AT_LEAST_EVERY = 3 * 24 * 60 * 60 * 1000;
/** At most this many projects are read in full per look; the rest wait for the next */
const READS_PER_SYNC = 5;
const MAX_LIST_PAGES = 10;

/**
 * What tells a change: Ravelry's updated_at, and its photos (count and first),
 * in case adding one doesn't touch updated_at.
 */
export const changeSignature = (p: {
  updated_at?: string | null;
  photos_count?: number | null;
  first_photo?: { id: number } | null;
}) =>
  `${p.updated_at ?? ''}|${p.photos_count ?? ''}|${p.first_photo?.id ?? ''}`;

const signatureOfFull = (project: RavelryProject) =>
  changeSignature({
    updated_at: project.updated_at,
    photos_count: project.photos?.length ?? 0,
    first_photo: project.photos?.[0] ?? null,
  });

/** The project's yarns, keeping which ones this app added. */
export function packsOf(
  project: RavelryProject,
  stored: StoredPack[],
): StoredPack[] {
  const ours = new Set(stored.filter((p) => p.ours).map((p) => p.packId));
  return (project.packs ?? []).map((pack) => ({
    packId: pack.id,
    name:
      pack.personal_name ??
      ([pack.yarn?.yarn_company_name, pack.yarn?.name ?? pack.yarn_name]
        .filter(Boolean)
        .join(' ') ||
        ''),
    colorway: pack.colorway ?? '',
    yarnId: pack.yarn_id ?? null,
    ours: ours.has(pack.id),
  }));
}

/** Keeps what was just read of a linked project: photos, notes, yarns. */
export async function keepProject(
  session: RavelrySession,
  link: RavelryProjectLink,
  project: RavelryProject,
  { ours = [] as number[] } = {},
) {
  const photos = project.photos ?? [];
  // The app's picture may have been deleted on Ravelry
  const picturePhotoId = photos.some((p) => p.id === link.picturePhotoId)
    ? link.picturePhotoId
    : null;
  await replacePhotos(
    session.db,
    session.userId,
    link.projectId,
    photos,
    picturePhotoId,
  );
  if (picturePhotoId !== link.picturePhotoId)
    await saveProjectLink(session.db, session.userId, {
      ...link,
      picturePhotoId,
    });
  const stored = readPacks(link.packs);
  const packs = packsOf(project, [
    ...stored,
    ...ours.map((packId) => ({
      packId,
      name: '',
      colorway: '',
      yarnId: null,
      ours: true,
    })),
  ]);
  const state = {
    permalink: project.permalink,
    ravelryUpdatedAt: signatureOfFull(project),
    notes: withoutLinkLine(project.notes),
    packs: JSON.stringify(packs),
    checkedAt: Date.now(),
  };
  await updateLinkState(session.db, session.userId, link.projectId, state);
  return {
    link: { ...link, ...state, picturePhotoId },
    photos: await listPhotos(session.db, session.userId, link.projectId),
    packs,
  };
}

/**
 * Reads a linked project from Ravelry and keeps it. Null when it was deleted
 * there: the link is forgotten (nothing else could bring it back).
 */
export async function readLinkedProject(
  session: RavelrySession,
  link: RavelryProjectLink,
) {
  let project: RavelryProject;
  try {
    project = await session.api.showProject(
      link.ravelryUsername,
      link.ravelryProjectId,
    );
  } catch (e) {
    if (e instanceof RavelryApiError && e.status === 404) {
      await forgetProjectLink(session.db, session.userId, link.projectId);
      return null;
    }
    throw e;
  }
  return { project, ...(await keepProject(session, link, project)) };
}

/**
 * Brings changes made on Ravelry here, at most every LIST_EVERY (or `force`):
 * one list call, then a full read of each linked project that changed, or that
 * hasn't been read for READ_AT_LEAST_EVERY. Projects deleted there are unlinked.
 * Returns whether anything here changed.
 */
export async function syncLinks(
  session: RavelrySession,
  { force = false, now = Date.now() } = {},
): Promise<boolean> {
  const links = await listProjectLinks(session.db, session.userId);
  if (!links.length) return false;
  if (
    !(await claimListCheck(
      session.db,
      session.userId,
      force ? now : now - LIST_EVERY,
      now,
    ))
  )
    return false;

  // Only projects under the current username can be found in its list
  const listed = links.filter((l) => l.ravelryUsername === session.username);
  const wanted = new Set(listed.map((l) => l.ravelryProjectId));
  const found = new Map<number, string>();
  let complete = false;
  for (
    let page = 1;
    page <= MAX_LIST_PAGES && found.size < wanted.size;
    page++
  ) {
    const { projects, paginator } = await session.api.listProjects(
      session.username,
      page,
    );
    for (const project of projects)
      if (wanted.has(project.id))
        found.set(project.id, changeSignature(project));
    if (!paginator || page >= paginator.page_count) {
      complete = true;
      break;
    }
  }
  if (found.size === wanted.size) complete = true;

  let changed = false;
  const due: RavelryProjectLink[] = [];
  for (const link of links) {
    const signature = found.get(link.ravelryProjectId);
    if (signature === undefined) {
      // Missing from the whole list: deleted on Ravelry
      if (complete && link.ravelryUsername === session.username) {
        await forgetProjectLink(session.db, session.userId, link.projectId);
        changed = true;
      }
      continue;
    }
    if (
      signature !== link.ravelryUpdatedAt ||
      (link.checkedAt ?? 0) < now - READ_AT_LEAST_EVERY
    )
      due.push(link);
  }

  due.sort((a, b) => (a.checkedAt ?? 0) - (b.checkedAt ?? 0));
  for (const link of due.slice(0, READS_PER_SYNC)) {
    try {
      await readLinkedProject(session, link);
      changed = true;
    } catch (e) {
      if (e instanceof RavelryApiError && e.reconnect) throw e;
      // One broken project never holds up the rest: it waits its turn again
      console.error('Could not read a Ravelry project', e);
      await updateLinkState(session.db, session.userId, link.projectId, {
        checkedAt: now,
      });
    }
  }
  return changed;
}
