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

// The views of the account's own gallery pages, for "Published · 12 views" on
// My Library's cards: read from the gallery once per page while the app is
// open (views change slowly), in one request for all of a kind's pages.

import { fetchViewsByIds } from '#lib/utils/gallery-utils.js';
import { SvelteMap } from 'svelte/reactivity';

class OwnPageViewsState {
  #views = new SvelteMap<number, number>();
  #asked = new Set<number>();

  /** A page's views, all time (none while unknown or never viewed) */
  of(postId: number) {
    return this.#views.get(postId);
  }

  /** Looks up these pages' views, once each */
  load(kind: 'project' | 'palette', postIds: number[]) {
    const ids = postIds.filter((id) => !this.#asked.has(id));
    if (!ids.length) return;
    for (const id of ids) this.#asked.add(id);
    fetchViewsByIds(kind, ids)
      .then((views) => {
        for (const [id, count] of views) this.#views.set(id, count);
      })
      .catch((e) => {
        // Cards show "Published" alone; asked again next time they show
        for (const id of ids) this.#asked.delete(id);
        console.error('Could not look up gallery page views', e);
      });
  }
}

export const ownPageViews = new OwnPageViewsState();
