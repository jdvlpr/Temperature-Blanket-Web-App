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

// What's New's kinds of change: each changelog note has one, shown as a chip
// on the note, and the page's segmented control shows one kind at a time
// (/whats-new?show=<param>).

import type { ChangelogTag } from '#lib/types/page-types.js';

export const CHANGELOG_TAGS: {
  tag: ChangelogTag;
  /** In the address */
  param: string;
  /** The segmented control's */
  label: string;
  /** A note's chip */
  chip: string;
}[] = [
  {
    tag: 'release',
    param: 'releases',
    label: 'Releases',
    chip: 'Release Post',
  },
  { tag: 'feature', param: 'features', label: 'Features', chip: 'Feature' },
  { tag: 'yarn', param: 'yarn', label: 'Yarn', chip: 'Yarn' },
  { tag: 'fix', param: 'fixes', label: 'Fixes', chip: 'Bug Fix' },
];

export const CHANGELOG_TAG_PARAM = 'show';

/** The address showing one kind of change, or every change */
export const changelogHref = (tag?: ChangelogTag) => {
  const param = CHANGELOG_TAGS.find((t) => t.tag === tag)?.param;
  return param ? `/whats-new?${CHANGELOG_TAG_PARAM}=${param}` : '/whats-new';
};

/** The kind of change an address shows, if any */
export const changelogTagOf = (param: string | null) =>
  CHANGELOG_TAGS.find((t) => t.param === param)?.tag;
