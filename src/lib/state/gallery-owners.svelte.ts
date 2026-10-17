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

// Who published the gallery's cards, for "By <name>" on them: one request per
// page of cards (/api/gallery/owners), asking only about ones not yet known
// this visit. Pages that don't show their owner's name have none.

import { browser } from '$app/env';
import type { GalleryOwner } from '#lib/server/gallery/store.js';
import { SvelteMap } from 'svelte/reactivity';

class GalleryOwnersState {
  #owners = new SvelteMap<number, GalleryOwner | null>();
  #asked = new Set<number>();

  /** The name to show on this page's card, if any (none while unknown) */
  nameOf(postId: number | string) {
    return this.#owners.get(Number(postId))?.name;
  }

  /** Their gallery's ID (`/gallery/by/<id>`), with the name (none while unknown) */
  publicIdOf(postId: number | string) {
    return this.#owners.get(Number(postId))?.publicId;
  }

  /** Looks up the owners of these pages' cards, once each */
  load(postIds: (number | string)[]) {
    if (!__ACCOUNTS_ENABLED__ || !browser) return;
    const ids = [...new Set(postIds.map(Number))].filter(
      (id) => Number.isSafeInteger(id) && id > 0 && !this.#asked.has(id),
    );
    for (let i = 0; i < ids.length; i += 100)
      void this.#fetch(ids.slice(i, i + 100));
  }

  async #fetch(ids: number[]) {
    for (const id of ids) this.#asked.add(id);
    try {
      const response = await fetch(`/api/gallery/owners?ids=${ids.join(',')}`);
      if (!response.ok) throw new Error(`${response.status}`);
      const { owners } = (await response.json()) as {
        owners: Record<string, GalleryOwner>;
      };
      for (const id of ids) this.#owners.set(id, owners[id] ?? null);
    } catch (e) {
      // Cards show without names; asked again when shown again
      for (const id of ids) this.#asked.delete(id);
      console.error('Could not look up gallery card owners', e);
    }
  }
}

export const galleryOwners = new GalleryOwnersState();
