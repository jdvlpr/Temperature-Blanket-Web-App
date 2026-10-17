import { redirect } from '@sveltejs/kit';

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

import { dev } from '$app/env';
import { THEMES, SKELETON_THEMES } from '#lib/constants/page-constants.js';
import {
  sequence,
  type Handle,
  type HandleServerError,
} from '@sveltejs/kit/hooks';

// Legacy urls from previous versions of the app
const legacyRedirects: Handle = async ({ event, resolve }) => {
  let path = event.url.pathname;

  // Redirect Project Pages From Info Site
  let regexPatternInfoProjectPage = /info\/project\/(\d+)\/.*?/;
  let matchProjectInfoPage = path.match(regexPatternInfoProjectPage);
  if (matchProjectInfoPage) {
    // Construct the new string
    let newPath = `/gallery/${matchProjectInfoPage[1]}`;
    redirect(301, newPath);
  }

  // Redirect Project Pages
  let regexPatternProjectPage = /project\/(\d+)\/.*?/;
  let matchProjectPage = path.match(regexPatternProjectPage);
  if (matchProjectPage) {
    // Construct the new string
    let newPath = `/gallery/${matchProjectPage[1]}`;
    redirect(301, newPath);
  }

  // Redirect What is a Temperature Blanket Info Page
  let regexPatternWIATB = /info\/what-is-a-temperature-blanket.*?/;
  let matchWIATB = path.match(regexPatternWIATB);
  if (matchWIATB) {
    // Construct the new string
    let newPath = `/blog/what-is-a-temperature-blanket`;
    redirect(301, newPath);
  }

  // Redirect all /info pages including slashes
  if (path.includes('/info/') && path.indexOf('/info/') === 0) {
    // Construct the new string
    let newPath = path.replace('/info/', '/');
    redirect(301, newPath);
  }

  // Redirect all /info pages not including slashes
  if (path.includes('/info') && path.indexOf('/info') === 0) {
    // Construct the new string
    let newPath = path.replace('/info', '/');
    redirect(301, newPath);
  }

  // Redirect old Yarn Palette Gallery to unified Gallery
  if (path === '/yarn-palette-gallery' || path === '/yarn-palette-gallery/') {
    redirect(301, '/gallery/palettes');
  }

  // The FAQ is now Guides & Help's Common Questions
  if (path === '/faq' || path === '/faq/') {
    redirect(301, '/documentation#common-questions');
  }

  return resolve(event);
};

const devRedirects: Handle = async ({ event, resolve }) => {
  let path = event.url.pathname;

  // Redirect Dev Tools if not in dev
  if (path.startsWith('/.dev-tools/') && !dev) {
    // Construct the new string
    let newPath = '/';
    redirect(302, newPath);
  }

  return resolve(event);
};

// Account API. Imported only for these paths, so other requests never load it.
const accountsApi: Handle = async ({ event, resolve }) => {
  if (!event.url.pathname.startsWith('/api/auth/')) return resolve(event);
  const { handleAuthRequest } = await import('#lib/server/auth/index.js');
  return handleAuthRequest(event);
};

// Read the theme cookie and update the html accordingly
const THEME_OPTIONS = [
  SKELETON_THEMES.map((t) => t.id),
  THEMES.map((t) => t.id),
  ['sharp', 'rounded', 'pill'],
  ['compact', 'normal', 'relaxed'],
  ['small', 'normal', 'large'],
  ['classic', 'playful', 'refined'],
];
const THEME_DEFAULTS = [
  'classic',
  'system',
  'pill',
  'normal',
  'normal',
  'classic',
];
// The cookies older versions set, one per option, in the order above
const LEGACY_THEME_COOKIES = [
  'theme',
  'theme_mode',
  'theme_roundness',
  'theme_spacing',
  'theme_text_scale',
  'theme_heading_style',
];

const themeCookies: Handle = async ({ event, resolve }) => {
  // "theme.mode.roundness.spacing.textScale.headingStyle", written in the browser
  const saved = event.cookies.get('theme_prefs')?.split('.');
  const [theme, mode, roundness, spacing, textScale, headingStyle] =
    THEME_OPTIONS.map((options, i) => {
      const value = saved
        ? saved[i]
        : event.cookies.get(LEGACY_THEME_COOKIES[i]);
      return value && options.includes(value) ? value : THEME_DEFAULTS[i];
    });

  return await resolve(event, {
    transformPageChunk: ({ html }) =>
      html
        .replace('data-theme=""', `data-theme="${theme}"`)
        .replace(
          'id="html-root"',
          `id="html-root" data-roundness="${roundness}" data-spacing="${spacing}" data-text-scale="${textScale}" data-heading-style="${headingStyle}"${mode === 'dark' ? ' class="dark"' : ''}`,
        ),
  });
};

export const handle: Handle = sequence(
  accountsApi,
  legacyRedirects,
  devRedirects,
  themeCookies,
);

// SvelteKit 3 also passes expected errors here (error(404, ...) and the like);
// only log the unexpected ones, as before
export const handleError: HandleServerError = ({ kind, error }) => {
  if (kind !== 'unknown') return;
  console.error(error instanceof Error ? error.stack : String(error));
};
