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

// My Library's search, filters and sort, on what's saved here (the Gallery's
// are answered by the server instead).

import type { Color } from '#lib/types/yarn-types.js';

/** Who can see it: on the gallery, not, or only there (not saved here) */
export type LibraryStatus =
  'all' | 'published' | 'unpublished' | 'gallery-only';

export const LIBRARY_STATUSES = [
  { value: 'all', label: 'All' },
  {
    value: 'published',
    label: 'Published',
    details: 'Saved here and on the gallery',
  },
  {
    value: 'unpublished',
    label: 'Not Published',
    details: 'Only saved here',
  },
  {
    value: 'gallery-only',
    label: 'Gallery Only',
    details: 'On the gallery, not saved here',
  },
] as const satisfies readonly {
  value: LibraryStatus;
  label: string;
  details?: string;
}[];

export type LibrarySort = 'recent' | 'name';

export const LIBRARY_SORTS = [
  {
    value: 'recent',
    label: 'Recent',
    details: 'Last changed or published first',
  },
  { value: 'name', label: 'Name', details: 'A to Z' },
] as const satisfies readonly {
  value: LibrarySort;
  label: string;
  details?: string;
}[];

/** Lists longer than this get search, filters and sort */
export const FILTERS_FROM = 6;

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Whether every word searched for is in one of these texts */
export function matchesSearch(
  search: string,
  texts: readonly (string | null | undefined)[],
): boolean {
  const words = normalize(search).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = normalize(texts.filter(Boolean).join(' '));
  return words.every((word) => haystack.includes(word));
}

/** The pattern a project link shows (its preview's ID in the hash), if any */
export function patternIdOf(
  href: string | null | undefined,
  previewIds: readonly string[],
): string | null {
  if (!href) return null;
  const hash = href.includes('#') ? href.slice(href.indexOf('#') + 1) : '';
  if (!hash) return null;
  const keys = new Set(hash.split('&').map((part) => part.split('=')[0]));
  return previewIds.find((id) => keys.has(id)) ?? null;
}

/**
 * Whether a palette's colors are of this brand (and yarn, when given): some of
 * them, or with `only`, all of them. No brand or yarn chosen matches all.
 */
export function matchesYarn(
  colors: readonly Color[],
  { brandId, yarnId, only }: { brandId: string; yarnId: string; only: boolean },
): boolean {
  if (!brandId && !yarnId) return true;
  const isThis = (color: Color) =>
    (!brandId || color.brandId === brandId) &&
    (!yarnId || color.yarnId === yarnId);
  return only ? colors.every(isThis) : colors.some(isThis);
}

/** Whether something with this gallery state shows for the status chosen */
export function matchesStatus(
  status: LibraryStatus,
  { published, galleryOnly }: { published: boolean; galleryOnly: boolean },
): boolean {
  switch (status) {
    case 'all':
      return true;
    case 'gallery-only':
      return galleryOnly;
    case 'published':
      return published && !galleryOnly;
    case 'unpublished':
      return !published && !galleryOnly;
  }
}

/**
 * Sorted as chosen: by recent (newest first, as `time` says) or by name (A to
 * Z); reversed flips either. Equal ones keep their order.
 */
export function sortLibrary<T>(
  items: readonly T[],
  sort: LibrarySort,
  reversed: boolean,
  { time, name }: { time: (item: T) => number; name: (item: T) => string },
): T[] {
  const direction = reversed ? -1 : 1;
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  return [...items].sort((a, b) =>
    sort === 'name'
      ? direction * collator.compare(name(a), name(b))
      : direction * (time(b) - time(a)),
  );
}
