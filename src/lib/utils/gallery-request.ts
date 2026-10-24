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

// Opening a project with its Publish to Gallery dialog showing, from its row
// in My Projects: the project's link plus ?gallery=. "add" publishes it, with
// the account's name or not as last chosen ("named": with it, from older
// links); a post ID replaces that page with a snapshot of the project as it is
// now. The planner drops it from the address bar.

export const GALLERY_PARAM = 'gallery';

export type GalleryRequest =
  // showOwner left out: the account's last choice
  | { action: 'add'; showOwner?: boolean }
  | { action: 'replace'; postId: number };

/** The project's link, opening its Publish to Gallery dialog. */
export function galleryRequestLink(
  href: string,
  request: GalleryRequest,
): string {
  const url = new URL(href);
  url.searchParams.set(
    GALLERY_PARAM,
    request.action === 'replace'
      ? String(request.postId)
      : request.showOwner
        ? 'named'
        : 'add',
  );
  return url.href;
}

/** What a ?gallery= value asks for, or null when it's missing or unknown. */
export function parseGalleryRequest(
  value: string | null | undefined,
): GalleryRequest | null {
  if (value === 'add') return { action: 'add' };
  if (value === 'named') return { action: 'add', showOwner: true };
  if (value && /^[1-9]\d{0,15}$/.test(value))
    return { action: 'replace', postId: Number(value) };
  return null;
}

// Opening a copy from a gallery page: the page's link plus ?g=<post ID>, so
// the planner can load the weather the page kept (gallery-weather.ts). Kept in
// the address bar (unlike ?gallery=), so reloading loads it again; Copy Link
// adds it while the project's page is up to date. A link without it holds no
// weather.

export const FROM_GALLERY_PARAM = 'g';

/** A gallery page's project link, naming the page it came from. */
export function fromGalleryLink(href: string, postId: number): string {
  const url = new URL(href);
  url.searchParams.set(FROM_GALLERY_PARAM, String(postId));
  return url.href;
}

/** The gallery post a link was opened from, or null. */
export function parseFromGallery(value: string | null | undefined) {
  return value && /^[1-9]\d{0,15}$/.test(value) ? Number(value) : null;
}
