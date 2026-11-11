// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// Which site a link that lasts points to. The beta (next.temperature-blanket.com)
// closes after launch, so what it leaves behind (gallery pages' links, their
// Copy Link, Ravelry notes) points to the main site, which has the same pages.
// After launch the main site's build also answers at the beta's address for a
// few weeks (the retired beta), and links made there point to the main site too.
// Pure; `#lib/constants/site.ts` binds it to this build.

/** The beta's address, during the beta and for a few weeks after launch */
export const BETA_ORIGIN = 'https://next.temperature-blanket.com';

/** A URL's origin ("https://temperature-blanket.com"), or null */
export function originOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { origin } = new URL(url);
    return origin === 'null' ? null : origin;
  } catch {
    return null;
  }
}

/**
 * The origin for links that last: the main site in the beta's build or at the
 * beta's address, else this one
 */
export function lastingOriginFor(
  here: string,
  { beta, main }: { beta: boolean; main: string | null },
): string {
  return (beta || here === BETA_ORIGIN) && main ? main : here;
}

/** Whether this is the main site's build answering at the beta's address */
export const isRetiredBeta = (here: string, beta: boolean) =>
  !beta && here === BETA_ORIGIN;

/** `url` (absolute) moved to `origin`, its path, query and hash kept */
export function withOrigin(url: string, origin: string): string {
  try {
    const parsed = new URL(url);
    return new URL(parsed.pathname + parsed.search + parsed.hash, origin).href;
  } catch {
    return url;
  }
}
