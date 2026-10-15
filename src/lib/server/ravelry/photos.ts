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

// A linked project's photos: added through the app (stored on Ravelry), and
// Ravelry's list kept here so pages can show them without the owner's token.

import { RavelryApiError } from './api';
import type { RavelrySession } from './index';
import {
  listPhotos,
  replacePhotos,
  saveProjectLink,
  type RavelryProjectLink,
} from './store';

/** Ravelry takes PNG, JPEG and HEIC, up to 50 MB a request. */
export const PHOTO_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/heic',
  'image/heif',
]);
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;

const STATUS_CHECKS = 10;
const STATUS_WAIT_MS = 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Ravelry's photos of the project, kept here, in Ravelry's order. */
export async function refreshPhotos(
  session: RavelrySession,
  link: RavelryProjectLink,
) {
  const project = await session.api.showProject(
    link.ravelryUsername,
    link.ravelryProjectId,
  );
  // The app's picture may have been deleted on Ravelry
  const photos = project.photos ?? [];
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
  return listPhotos(session.db, session.userId, link.projectId);
}

/** Where the browser uploads a photo itself, with a one-use token. */
export const RAVELRY_UPLOAD_URL = 'https://api.ravelry.com/upload/image.json';

/**
 * Uploads a photo to the project on Ravelry through this server, then adds
 * it (see attachImage). The browser uploads it straight to Ravelry when it
 * can, which keeps big photos off the Worker.
 */
export async function addPhoto(
  session: RavelrySession,
  link: RavelryProjectLink,
  file: Blob,
  { picture = false } = {},
) {
  const { api } = session;
  const token = await api.uploadToken();
  const extension =
    file.type === 'image/png'
      ? 'png'
      : file.type.includes('hei')
        ? 'heic'
        : 'jpg';
  const imageId = await api.uploadImage(token, file, `photo.${extension}`);
  return attachImage(session, link, imageId, { picture });
}

/**
 * Adds an uploaded image to the project on Ravelry and waits (briefly) for
 * Ravelry to finish it. As the project's `picture`, it replaces the last one.
 */
export async function attachImage(
  session: RavelrySession,
  link: RavelryProjectLink,
  imageId: number,
  { picture = false } = {},
) {
  const { api } = session;
  const statusToken = await api.createProjectPhoto(
    link.ravelryUsername,
    link.ravelryProjectId,
    { image_id: imageId },
  );

  let photoId: number | null = null;
  for (let i = 0; i < STATUS_CHECKS && photoId === null; i++) {
    await sleep(STATUS_WAIT_MS);
    const status = await api.photoStatus(statusToken);
    if (status.failed)
      throw new RavelryApiError(422, 'Ravelry couldn’t use that photo');
    if (status.complete && status.photo) photoId = status.photo.id;
  }

  if (picture && photoId !== null) {
    if (link.picturePhotoId && link.picturePhotoId !== photoId)
      await api.deletePhoto(link.picturePhotoId).catch((e) => {
        // Already deleted on Ravelry
        if (!(e instanceof RavelryApiError && e.status === 404)) throw e;
      });
    link = { ...link, picturePhotoId: photoId };
    await saveProjectLink(session.db, session.userId, link);
  }

  // Still being processed after the wait: it shows up on the next refresh
  return {
    photos: await refreshPhotos(session, link),
    processing: photoId === null,
  };
}
