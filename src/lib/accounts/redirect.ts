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

/**
 * Where to go after signing in: a path on this site from `?redirect=`, else the
 * account page. Anything that could leave the site is ignored.
 */
export function safeRedirect(value: string | null | undefined): string {
  const fallback = '/account';
  if (!value || !value.startsWith('/')) return fallback;
  // "//host" and "/\host" are other sites to browsers
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
  // Sign-in pages would loop
  if (value.startsWith('/auth/')) return fallback;
  try {
    const url = new URL(value, 'https://temperature-blanket.com');
    if (url.origin !== 'https://temperature-blanket.com') return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
