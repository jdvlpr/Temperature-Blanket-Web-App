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

// A project or palette only in the gallery (deleted, or not saved here) saved
// back to My Projects from its card, where its gallery page then shows on it.

import type { GalleryPage } from '#lib/accounts/gallery.js';
import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
import {
  loadProjectTrash,
  restoreTrashEntry,
} from '#lib/storage/account-trash.svelte.js';
import { PaletteStorage, savedPalettes } from '#lib/storage/palettes.svelte.js';
import { ProjectStorage } from '#lib/storage/projects.svelte.js';
import type { Color } from '#lib/types/yarn-types.js';
import {
  colorsToPaletteCode,
  getPaletteFallbackName,
} from '#lib/utils/color-utils.js';
import { loadInPlace } from '#lib/utils/open-saved-project.js';

/**
 * Puts a project back as it was when it's in the Trash (this browser's or the
 * account's). Otherwise saves its gallery page's copy, with the weather the
 * page kept, under the same project ID, as opening and saving it would.
 * Throws when it can't.
 */
export async function addProjectBack(page: GalleryPage): Promise<void> {
  const trashed = (await loadProjectTrash()).find(
    (entry) => entry.id === page.projectId,
  );
  if (trashed) {
    await restoreTrashEntry(trashed);
    return;
  }
  if (!page.link) throw new Error('The gallery page has no project link');
  const restorePreferences = await loadInPlace(page.link, () => false, {
    fromGallery: page.postId,
  });
  try {
    await ProjectStorage.save({ id: page.projectId });
  } finally {
    restorePreferences?.();
  }
}

/**
 * Puts a palette back from the Trash. One deleted for good can't have its ID
 * back (the account keeps it deleted), so it's saved anew, or found saved
 * with the same colors, and its gallery page moves to that one. Throws when
 * it can't.
 */
export async function addPaletteBack(
  page: GalleryPage,
  colors: Color[],
): Promise<void> {
  const id = page.projectId;
  if ((await PaletteStorage.listDeleted()).some((p) => p.id === id)) {
    await PaletteStorage.restore(id);
    await savedPalettes.refresh();
    // Unless the same colors were saved again meanwhile (that one stays)
    if (savedPalettes.items.some((p) => p.id === id)) return;
  }
  const { palette } = await PaletteStorage.add({
    code: colorsToPaletteCode(colors),
    // No name of its own when the page shows the one it would get anyway
    name: page.title === getPaletteFallbackName(colors) ? '' : page.title,
  });
  try {
    await galleryPages.relinkPalette(page.postId, palette.id);
  } finally {
    await savedPalettes.refresh();
  }
}
