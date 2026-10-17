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

// My Library's search, filters and sort: one set for its Projects and Yarn
// Palettes pages, as the Gallery's are for its two, but apart from the
// Gallery's, so searching one never filters the other. Kept while the app is
// open, not saved.

import type {
  LibrarySort,
  LibraryStatus,
  StarredSort,
} from '#lib/utils/collection-filter.js';

export class LibraryFilters {
  search = $state('');
  brandId = $state('');
  yarnId = $state('');
  onlyThisYarn = $state(false);
  /** A pattern's gallery tag slug, as the Gallery's filter has it */
  patternType = $state('');
  status = $state<LibraryStatus>('all');
  sort = $state<LibrarySort>('recent');
  reversed = $state(false);
  /** Starred's own sort: its choices differ from the saved things' */
  starredSort = $state<StarredSort>('starred');
  starredReversed = $state(false);

  /**
   * Whether anything on this page is left out (sort only reorders). Starred
   * has no Show filter, so `status` doesn't count there.
   */
  activeFor(kind: 'projects' | 'palettes', { starred = false } = {}) {
    const shared =
      !!this.search.trim() ||
      (!starred && this.status !== 'all') ||
      !!this.brandId ||
      !!this.yarnId;
    return kind === 'projects' ? shared || !!this.patternType : shared;
  }

  clear() {
    this.search = '';
    this.brandId = '';
    this.yarnId = '';
    this.onlyThisYarn = false;
    this.patternType = '';
    this.status = 'all';
  }
}

export const libraryFilters = new LibraryFilters();
