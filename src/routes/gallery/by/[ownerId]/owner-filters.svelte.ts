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

// An owner's gallery pages' search, filters and sort: one set for their
// Projects and Yarn Palettes pages, like the Gallery's, but applied here to
// the pages already loaded (at most 100), and started again for each person.

import type { PageLayout } from '#lib/types/page-types.js';
import {
  fetchPopularOrder,
  POPULAR_DAYS,
  type GallerySort,
} from '#lib/utils/gallery-utils.js';

class OwnerFilters {
  /** Whose pages these are for */
  ownerId = '';
  search = $state('');
  brandId = $state('');
  yarnId = $state('');
  onlyThisYarn = $state(false);
  /** A pattern's gallery tag slug, as the Gallery's filter has it */
  patternType = $state('');
  sort = $state<GallerySort>('POPULAR');
  /** Popular counts views in the last … days */
  popularDays = $state(POPULAR_DAYS);
  layout = $state<PageLayout>('grid');
  /** The gallery can't sort by views (an older plugin), so Newest is the default */
  popularUnavailable = $state(false);

  /** Whether the sort is other than the default */
  get sorted() {
    return this.sort !== (this.popularUnavailable ? 'DESC' : 'POPULAR');
  }

  /** Whether anything on this page is left out (sort only reorders) */
  activeFor(kind: 'projects' | 'palettes') {
    return (
      !!this.search.trim() ||
      !!this.brandId ||
      !!this.yarnId ||
      (kind === 'projects' && !!this.patternType)
    );
  }

  clear() {
    this.search = '';
    this.brandId = '';
    this.yarnId = '';
    this.onlyThisYarn = false;
    this.patternType = '';
  }

  /** Someone else's pages: start again */
  forOwner(ownerId: string) {
    if (ownerId === this.ownerId) return;
    this.ownerId = ownerId;
    this.clear();
    this.sort = this.popularUnavailable ? 'DESC' : 'POPULAR';
    this.popularDays = POPULAR_DAYS;
  }
}

export const ownerFilters = new OwnerFilters();

/**
 * These pages' Popular order, for the period chosen, while Popular is: the
 * server's for the first period (`initial`), asked for again when it changes.
 * Says Newest instead when the gallery can't sort by views.
 */
export function popularOrder(
  type: 'project' | 'palette',
  ids: () => number[],
  initial: () => number[] | null,
) {
  let order = $state<number[] | null>(initial());
  let forDays = $state<number | null>(initial() ? POPULAR_DAYS : null);

  $effect(() => {
    if (ownerFilters.sort !== 'POPULAR') return;
    const days = ownerFilters.popularDays;
    const list = ids();
    if (!list.length || (order && forDays === days)) return;
    let current = true;
    fetchPopularOrder({ type, days, ids: list })
      .then((found) => {
        if (!current) return;
        if (found) {
          order = found;
          forDays = days;
        } else {
          ownerFilters.popularUnavailable = true;
          ownerFilters.sort = 'DESC';
        }
      })
      .catch((e) => console.error('Could not sort by popular', e));
    return () => {
      current = false;
    };
  });

  return {
    /** Null until known, when the order is newest first */
    get ids() {
      return forDays === ownerFilters.popularDays ? order : null;
    },
  };
}
