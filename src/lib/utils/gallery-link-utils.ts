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

// Yarn Palette Creator links as the gallery stores them, and how projects and
// palette pages are found by them: a project's palettes became palette pages
// (gallery plugin 1.7.0's import), kept once per set of colors, so a project
// finds its palettes' pages, and a palette page its projects, by their links,
// checked by their colors (gallery-match-utils). Nothing here imports the app,
// so storage can use it too.

/** The link without its v= parameter, every other byte as it was (as the plugin does). */
export function withoutVersion(url: string) {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) return url;
  const hash = url.indexOf('#', queryStart);
  const fragment = hash === -1 ? '' : url.slice(hash);
  const query = url.slice(queryStart + 1, hash === -1 ? undefined : hash);
  const params = query
    .split('&')
    .filter((param) => param !== 'v' && !param.startsWith('v='));
  return url.slice(0, queryStart + 1) + params.join('&') + fragment;
}

/** Projects from 2022 stored www. links, which the plugin refuses; it's the same page. */
export function withoutWww(url: string) {
  return url.replace(
    /^https:\/\/www\.temperature-blanket\.com\//,
    'https://temperature-blanket.com/',
  );
}

/** A gallery post's `yarnUrls` (a JSON array of links), or none when it can't be read. */
export function yarnLinksOf(yarnUrls: string | null | undefined): string[] {
  try {
    const links = JSON.parse(yarnUrls ?? '');
    return Array.isArray(links)
      ? links.filter((link): link is string => typeof link === 'string')
      : [];
  } catch {
    return [];
  }
}

/**
 * What to search the gallery's `yarnUrls` for to find this link: its query,
 * without v=. The gallery stores links as JSON, with escaped slashes, so the
 * query (which has none) is what matches. Null for a link without one.
 */
export function yarnLinkSearch(link: string): string | null {
  const clean = withoutVersion(withoutWww(link));
  const queryStart = clean.indexOf('?');
  if (queryStart === -1) return null;
  const query = clean.slice(queryStart + 1).split('#')[0];
  return query || null;
}
