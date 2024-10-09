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

import { ICONS } from '$lib/constants';
import { localStorageStore } from '@skeletonlabs/skeleton';
import { derived, readable, writable, type Writable } from 'svelte/store';

export const modal = writable(null);

export const disableToastAnalytics: Writable<boolean> = localStorageStore(
  'disable_toast_analytics',
  false,
);

export const consentToMSClarityCookies = writable(false);

export const showNavigationSideBar = writable(true);

export const pinAllSections = writable(false);

export const wasProjectLoadedFromURL = writable(false);

export const isOnline = writable(await checkIsOnline());
async function checkIsOnline() {
  if (typeof window === 'undefined') return false;
  if (!window.navigator.onLine) return false;

  // avoid CORS errors with a request to your own origin
  const url = new URL(window.location.origin);

  // random value to prevent cached responses
  const randomString = Math.random().toString(36).substring(2, 15);
  url.searchParams.set('rand', randomString);

  try {
    const response = await fetch(url.toString(), { method: 'HEAD' });

    return response.ok;
  } catch {
    return false;
  }
}

export const isDesktop = mediaQueryStore('(min-width: 768px)');

// Based on https://github.com/michaelbelete/svelte-media-query-store/tree/main
function mediaQueryStore(query: string) {
  if (typeof window === 'undefined') {
    // check if it's rendered in the dom so window is not undefined
    return readable('');
  }
  const mediaQueryList = window.matchMedia(query);

  const mediaStore = readable(mediaQueryList.matches, (set) => {
    const handleChange = () => set(mediaQueryList.matches);

    mediaQueryList.addEventListener('change', handleChange);

    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  });

  return mediaStore;
}

export const windowLanguage = writable(null);

export const openDrawerBrowsePalettes = writable(false);
export const openDrawerGettingStarted = writable(false);
export const openDrawerWeatherDetails = writable(false);

export const pageSections = writable([
  {
    active: true,
    id: 'page-section-top',
    index: 0,
    keyboardShortcut: 0,
    offset: 0,
    scrollTop: 0,
    title: 'Top',
  },
  {
    active: true,
    id: 'page-section-location',
    index: 1,
    keyboardShortcut: 1,
    pinned: false,
    offset: 58,
    scrollTop: 0,
    title: 'Location',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" />
</svg>
`,
  },
  {
    active: false,
    id: 'page-section-weather-data',
    index: 2,
    keyboardShortcut: 2,
    pinned: false,
    offset: 52,
    scrollTop: 0,
    title: 'Weather',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
</svg>`,
    tooltip:
      'See weather data after choosing a valid location and pressing the Search button.',
  },
  {
    active: false,
    id: 'page-section-gauges',
    index: 3,
    keyboardShortcut: 3,
    pinned: false,
    offset: 58,
    scrollTop: 0,
    title: 'Colors',
    icon: ICONS.palette,
    tooltip:
      'Choose yarn colors and create ranges after choosing a valid location and pressing the Search button.',
  },
  {
    active: false,
    id: 'page-section-preview',
    index: 4,
    keyboardShortcut: 4,
    pinned: false,
    offset: 50,
    scrollTop: 0,
    title: 'Preview',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4"><path d="M24 36c11.046 0 20-12 20-12s-8.954-12-20-12S4 24 4 24s8.954 12 20 12Z"/><path d="M24 29a5 5 0 1 0 0-10a5 5 0 0 0 0 10Z"/></g></svg>`,
    tooltip:
      'Preview and customize your project after choosing a valid location and pressing the Search button.',
  },
]);

export const themes = readable([
  {
    description: 'Set the theme to light mode.',
    id: 'light',
    name: 'Light',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
            <path
                d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z"
            />
        </svg>`,
  },
  {
    description: 'Set the theme to dark mode.',
    id: 'dark',
    name: 'Dark',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                    <path
                        fill-rule="evenodd"
                        d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z"
                        clip-rule="evenodd"
                    />
                </svg>`,
  },
  {
    description: "Set the theme to match your system's mode.",
    id: 'system',
    name: 'System',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                    <path
                        fill-rule="evenodd"
                        d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z"
                        clip-rule="evenodd"
                    />
                </svg>`,
  },
]);

export const theme = writable('system');

export const activeTheme = derived([theme, themes], ([$theme, $themes]) => {
  return $themes.filter((n) => n.id === $theme)[0];
});

export const defaultYarn = writable('');
