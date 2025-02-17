// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
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

import { dev } from '$app/environment';
import { skeletonThemes } from '$lib/components/ThemeSwitcher.svelte';
import { THEMES } from '$lib/constants';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

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

// Read theme cookies and update the html accordingly
const themeCookies: Handle = async ({ event, resolve }) => {
  let theme = '';
  let mode = '';

  const cookieTheme = event.cookies.get('theme');
  const cookieThemeMode = event.cookies.get('theme_mode');

  if (cookieTheme && skeletonThemes.map((n) => n.id).includes(cookieTheme)) {
    theme = cookieTheme;
  } else {
    event.cookies.set('theme', 'classic', { path: '/' });
    theme = 'classic';
  }

  if (cookieThemeMode && THEMES.map((t) => t.id).includes(cookieThemeMode)) {
    mode = cookieThemeMode;
  } else {
    event.cookies.set('theme_mode', 'system', { path: '/' });
    mode = 'system';
  }

  console.log({ theme, mode });

  return await resolve(event, {
    transformPageChunk: ({ html }) =>
      html
        .replace('data-theme=""', `data-theme="${theme}"`)
        .replace(
          'id="html-root"',
          mode === 'dark' ? `id="html-root" class="${mode}"` : `id="html-root"`,
        ),
  });
};

export const handle: Handle = sequence(
  legacyRedirects,
  devRedirects,
  themeCookies,
);

export function handleError({ event, error }) {
  console.error(error.stack);
}
