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

// Edit Gallery Page for one of the account's own pages, from the page itself
// or its card in the gallery: the same dialog as in My Library (update,
// Anonymous, a project's Ravelry project, Unpublish), with its project or
// palette as saved here. Not saved on this device yet (before a sync), the
// dialog offers Anonymous and Unpublish only.

import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
import type { GalleryPage } from '#lib/accounts/gallery.js';
import { dialog, toast } from '#lib/state/page-state.svelte.js';
import { PaletteStorage } from '#lib/storage/palettes.svelte.js';
import { ProjectStorage } from '#lib/storage/projects.svelte.js';

const TITLE = 'Edit Gallery Page';

type Callbacks = {
  /** Saved: the page changed */
  onsaved?: () => void;
  /** Unpublished */
  onunpublished?: () => void;
};

/** Opens the dialog for this page of the account's. Throws when it can't. */
export async function editGalleryPage(
  page: GalleryPage,
  kind: 'project' | 'palette',
  callbacks: Callbacks = {},
) {
  if (kind === 'project') await editProject(page, callbacks);
  else await editPalette(page, callbacks);
}

/**
 * The same, from a gallery page's ID: the account's pages are looked up
 * first (only now, not for every card shown). Says so when it isn't theirs.
 */
export async function editGalleryPageById(
  postId: number,
  kind: 'project' | 'palette',
  callbacks: Callbacks = {},
) {
  try {
    await galleryPages.load();
    const page = galleryPages.pages.find(
      (p) => p.postId === postId && (p.kind ?? 'project') === kind,
    );
    if (!page) throw new Error('Not one of the account’s pages');
    await editGalleryPage(page, kind, callbacks);
  } catch (e) {
    console.error('Could not open Edit Gallery Page', e);
    toast.trigger({
      message: 'It couldn’t be opened. Try again later.',
      category: 'error',
    });
  }
}

async function editProject(page: GalleryPage, callbacks: Callbacks) {
  const item = (await ProjectStorage.getProjectsForDisplay()).find(
    (i) => i.id === page.projectId,
  );
  if (!item) return manage(page, 'project', callbacks);
  const { default: AddToGallery } =
    await import('#lib/components/modals/AddToGallery.svelte');
  dialog.trigger({
    type: 'component',
    component: {
      ref: AddToGallery,
      props: {
        request: { action: 'replace', postId: page.postId },
        href: item.meta.href,
        ...callbacks,
      },
    },
    options: { title: TITLE, size: 'medium' },
  });
}

async function editPalette(page: GalleryPage, callbacks: Callbacks) {
  const palette = (await PaletteStorage.list()).find(
    (p) => p.id === page.projectId,
  );
  if (!palette) return manage(page, 'palette', callbacks);
  const [{ ensureYarnData }, colorUtils, { default: SharePalette }] =
    await Promise.all([
      import('#lib/data/yarns/colorways.svelte.js'),
      import('#lib/utils/color-utils.js'),
      import('#lib/components/modals/SharePalette.svelte'),
    ]);
  await ensureYarnData();
  const colors = colorUtils.getColorsFromInput({ string: palette.code });
  if (!colors || !colors.length) return manage(page, 'palette', callbacks);
  dialog.trigger({
    type: 'component',
    component: {
      ref: SharePalette,
      props: {
        paletteId: palette.id,
        colors,
        name: palette.name || colorUtils.getPaletteFallbackName(colors),
        showOwner: page.showOwner,
        update: page,
        ...callbacks,
      },
    },
    options: { title: TITLE },
  });
}

async function manage(
  page: GalleryPage,
  kind: 'project' | 'palette',
  callbacks: Callbacks,
) {
  const { default: GalleryPageManage } =
    await import('#lib/components/modals/GalleryPageManage.svelte');
  dialog.trigger({
    type: 'component',
    component: {
      ref: GalleryPageManage,
      props: { kind, page, ...callbacks },
    },
    options: { title: TITLE },
  });
}
