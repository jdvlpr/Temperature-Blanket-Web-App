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

// The signed-in account's gallery pages while My Projects is open, shared by
// its project and palette rows: fetched once when the page opens, and again
// when a page is added or removed (GALLERY_PAGES_CHANGED). One request for the
// whole page, not one per row: requests are shared by everyone on the free plan.

import {
  GALLERY_PAGES_CHANGED,
  getGalleryPages,
  groupGalleryPages,
  relinkGalleryPalette,
  removeGalleryPage,
  setGalleryPageShowOwner,
  type GalleryPage,
} from '#lib/accounts/gallery.js';
import { savedPalettes } from '#lib/storage/palettes.svelte.js';
import { queryGallery } from '#lib/utils/gallery-utils.js';
import { SvelteMap } from 'svelte/reactivity';

class GalleryPagesState {
  loaded = $state(false);
  /** Whether publishing from accounts is switched on */
  publishing = $state(false);
  pages = $state<GalleryPage[]>([]);
  /** The owner page's ID, once a page has been included with the name */
  publicId = $state<string | null>(null);
  /** The server's copy of the display name, which may be newer than this browser's */
  name = $state<string | null>(null);
  /** The saved projects listed on the page; null until they've loaded */
  projectIds = $state<string[] | null>(null);

  grouped = $derived(
    groupGalleryPages(
      this.pages,
      this.projectIds ?? [],
      savedPalettes.items.map((palette) => palette.id),
    ),
  );

  /** Whether the rows offer sharing: there's a page, or one can be added */
  get shown() {
    return this.loaded && (this.publishing || this.pages.length > 0);
  }

  #loading: Promise<void> | null = null;

  load = () =>
    (this.#loading ??= (async () => {
      try {
        const gallery = await getGalleryPages();
        if (!gallery) return;
        this.pages = gallery.posts;
        this.publicId = gallery.settings.publicId;
        this.publishing = gallery.publishing;
        if (typeof gallery.name === 'string') this.name = gallery.name;
        this.loaded = true;
      } finally {
        this.#loading = null;
      }
    })());

  /**
   * Loads after each change, and now unless `load` is false (loaded already);
   * call when the page mounts. Returns the cleanup.
   */
  start({ load = true }: { load?: boolean } = {}) {
    if (load) this.load();
    window.addEventListener(GALLERY_PAGES_CHANGED, this.load);
    return () => {
      window.removeEventListener(GALLERY_PAGES_CHANGED, this.load);
      this.projectIds = null;
    };
  }

  /** Includes a page on the public gallery with the name, or takes it off. Throws when it fails. */
  async setShowOwner(postId: number, showOwner: boolean) {
    const page = this.pages.find((p) => p.postId === postId);
    const before = page?.showOwner ?? false;
    if (page) page.showOwner = showOwner;
    try {
      ({ publicId: this.publicId } = await setGalleryPageShowOwner(
        postId,
        showOwner,
      ));
    } catch (error) {
      if (page) page.showOwner = before;
      throw error;
    }
  }

  /** Pages' pictures from the gallery, by page ID (null: it has none) */
  images = new SvelteMap<number, string | null>();

  /**
   * Fetches the gallery's pictures of these project pages, once each, in one
   * request: for projects only in the gallery, which have none kept here.
   */
  async loadImages(postIds: number[]) {
    const ids = postIds.filter((id) => !this.images.has(id));
    if (!ids.length) return;
    // Asked for once, whether or not the gallery answers
    for (const id of ids) this.images.set(id, null);
    try {
      const { response, result } = await queryGallery(
        `query MY_PROJECT_IMAGES($ids: [ID]) {
          projects(first: ${ids.length}, where: { in: $ids }) {
            nodes {
              databaseId
              featuredImage {
                node {
                  mediaItemUrl
                  mediaDetails { sizes(include: MEDIUM) { sourceUrl } }
                }
              }
            }
          }
        }`,
        { ids },
      );
      if (!response.ok) return;
      for (const node of result?.data?.projects?.nodes ?? []) {
        const image =
          node?.featuredImage?.node?.mediaDetails?.sizes?.[0]?.sourceUrl ||
          node?.featuredImage?.node?.mediaItemUrl;
        if (typeof node?.databaseId === 'number' && typeof image === 'string')
          this.images.set(node.databaseId, image);
      }
    } catch {
      // Their colors show instead
    }
  }

  /**
   * Moves a palette page, with its other versions, to this saved palette, here
   * and in the account. Throws when it fails.
   */
  async relinkPalette(postId: number, paletteId: string) {
    await relinkGalleryPalette(postId, paletteId);
    const from = this.pages.find((p) => p.postId === postId)?.projectId;
    for (const page of this.pages)
      if (page.kind === 'palette' && page.projectId === from)
        page.projectId = paletteId;
  }

  /** Takes a page off the gallery. Throws when it fails. */
  async remove(postId: number) {
    await removeGalleryPage(postId);
    this.pages = this.pages.filter((p) => p.postId !== postId);
  }

  /** Every page made from the same project or palette as this one, newest first. */
  pagesLike(page: GalleryPage) {
    const kind = page.kind ?? 'project';
    return this.pages
      .filter(
        (p) => p.projectId === page.projectId && (p.kind ?? 'project') === kind,
      )
      .sort((a, b) => b.publishedAt - a.publishedAt || b.postId - a.postId);
  }
}

export const galleryPages = new GalleryPagesState();
