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

// The release posts, one for each major version: What's New starts each
// version's chapter with its card (ReleaseCard), and the post's own page is
// /whats-new/<slug>. Newest first.

import { VERSION_7_POST } from '#lib/constants/version-7-post.js';
import type { TISO8601DateString } from '#lib/types/weather-types.js';

export type Release = {
  major: number;
  slug: string;
  title: string;
  date: TISO8601DateString;
  /** One or two sentences: the card's text */
  summary: string;
  image: string;
  imageAlt: string;
};

export const RELEASES: Release[] = [
  {
    major: 7,
    slug: VERSION_7_POST.slug,
    title: VERSION_7_POST.title,
    date: VERSION_7_POST.date as TISO8601DateString,
    summary: __ACCOUNTS_ENABLED__
      ? 'Optional accounts that keep your projects on every device, a new My Library, posting projects to Ravelry, gallery pages you can update, weather you can check for updates, and new ways to get and share colors.'
      : 'A new My Library, simpler navigation and range editing, weather you can check for updates, a new PDF, and new ways to get and share colors.',
    image: VERSION_7_POST.image,
    imageAlt: 'Temperature blanket stripes with a cloud and a check mark',
  },
  {
    major: 6,
    slug: 'version-6',
    title: 'Version 6: Improved Sun Position Accuracy',
    date: '2026-07-09',
    summary:
      'More accurate sunrise and sunset times, so Daytime weather and Daytime Rows stitch counts are more accurate too.',
    image: '/images/blog-images/2026-07-09-version-6/featured-image.jpg',
    imageAlt: 'Version 6 banner',
  },
  {
    major: 5,
    slug: 'version-5',
    title: 'Version 5: Refreshed & Rebuilt',
    date: '2025-03-20',
    summary:
      'A refreshed design and new and improved features, with the code almost completely rewritten behind the scenes.',
    image: '/images/blog-images/2025-03-20-version-5/featured-image.png',
    imageAlt: 'Version 5 banner',
  },
  {
    major: 4,
    slug: 'open-source',
    title: 'Version 4: Now Open Source',
    date: '2024-09-03',
    summary:
      'The source code for temperature-blanket.com is on GitHub, for anyone to see or help with.',
    image: '/images/blog-images/2024-09-03-now-open-source/banner.jpeg',
    imageAlt: 'Now Open Source',
  },
  {
    major: 3,
    slug: 'version-3',
    title: 'Version 3: Unified Site Design',
    date: '2023-12-19',
    summary:
      'The whole site working as one: a new project gallery and gallery pages, a sidebar menu, easier moving between pages, and better sharing.',
    image:
      '/images/blog-images/2023-12-19-version-3-unified-site-design/featured-image.png',
    imageAlt: 'Version 3',
  },
];
