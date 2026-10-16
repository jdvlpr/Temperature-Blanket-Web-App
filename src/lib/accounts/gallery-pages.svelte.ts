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
  removeGalleryPage,
  setGalleryPageShowOwner,
  type GalleryPage,
} from '#lib/accounts/gallery.js';
import { savedPalettes } from '#lib/storage/palettes.svelte.js';

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
  /**
   * Shows or hides the owner's name. Anonymous for a project on Ravelry needs
   * `unlinkRavelry`, which unlinks it (otherwise RavelryLinkedError).
   */
  async setShowOwner(
    postId: number,
    showOwner: boolean,
    { unlinkRavelry = false } = {},
  ) {
    const page = this.pages.find((p) => p.postId === postId);
    const before = page?.showOwner ?? false;
    if (page) page.showOwner = showOwner;
    try {
      ({ publicId: this.publicId } = await setGalleryPageShowOwner(
        postId,
        showOwner,
        { unlinkRavelry },
      ));
      if (unlinkRavelry && page) {
        const { ravelryLinks } = await import('./ravelry-links.svelte');
        ravelryLinks.remove(page.projectId);
      }
    } catch (error) {
      if (page) page.showOwner = before;
      throw error;
    }
  }

  /**
   * After a restore (Undo, Restore from the Trash): the server brings the
   * project's or palette's gallery page back once the sync has reached it, so
   * the list is fetched again then. Twice, as that takes a while.
   */
  refreshSoon() {
    if (!this.loaded) return;
    for (const seconds of [5, 15]) setTimeout(this.load, seconds * 1000);
  }

  /** Takes a page off the gallery. Throws when it fails. */
  async remove(postId: number) {
    const page = this.pages.find((p) => p.postId === postId);
    await removeGalleryPage(postId);
    this.pages = this.pages.filter((p) => p.postId !== postId);
    // A project's Ravelry link goes with its page (it linked there)
    if (page && (page.kind ?? 'project') === 'project') {
      const { ravelryLinks } = await import('./ravelry-links.svelte');
      ravelryLinks.remove(page.projectId);
    }
  }
}

export const galleryPages = new GalleryPagesState();
