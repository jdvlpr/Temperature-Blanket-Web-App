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

// The release post introducing version 7 (What's New), in every build: its
// account parts show only with accounts on. Its address has no date in it.

export const VERSION_7_POST = {
  date: '2026-11-05',
  slug: 'version-7',
  title: 'Version 7: Accounts, My Library & More',
  image: '/images/blog-images/2026-11-01-version-7/featured-image.jpg',
} as const;

export const VERSION_7_POST_HREF = `/whats-new/${VERSION_7_POST.slug}`;
