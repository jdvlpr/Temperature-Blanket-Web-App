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

// The beta's warning on load (modals/BetaWarning.svelte): shown on the first
// page of each visit (once a tab) until "Don't show this again" is ticked, and its way back
// to the same page on the main site, which is still version 6.

/** Local Storage: true once "Don't show this again" is ticked */
export const BETA_WARNING_KEY = 'beta_warning_dismissed';

/** Session Storage: set once it's shown in this tab, so a reload or a sign-in's
 * round trip through Google or Ravelry doesn't show it again */
export const BETA_WARNING_SHOWN_KEY = 'beta_warning_shown';

/** The beta's pages it never shows on: About the Beta and Bring My Projects */
export const showsBetaWarning = (pathname: string) =>
  !/^\/beta(\/|$)/.test(pathname);

// Top-level pages the main site (version 6) has too
const ON_MAIN = new Set([
  'weather',
  'yarn',
  'yarn-colorway-finder',
  'gallery',
  'globe',
  'contact',
  'privacy',
  'supporters',
  'documentation',
  'api',
  'yarn-search-request',
]);

/**
 * The main site's path for a page of the beta: the same page where the main
 * site has it (a gallery project's page too), else its nearest section, else
 * the home page. What's New is the changelog there. Never the query: project
 * links copied here open only on the beta.
 */
export function mainSitePath(pathname: string): string {
  const path = pathname.replace(/\/+$/, '');
  const [section = '', ...rest] = path.split('/').slice(1);
  if (section === 'whats-new') return '/changelog';
  if (!ON_MAIN.has(section)) return '/';
  if (section === 'gallery' && /^\d+$/.test(rest.join('/')))
    return `/gallery/${rest[0]}`;
  if (section === 'api' && rest.join('/') === 'yarn-colorways')
    return '/api/yarn-colorways';
  return `/${section}`;
}
