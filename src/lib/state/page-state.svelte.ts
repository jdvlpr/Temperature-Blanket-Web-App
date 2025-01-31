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

import { browser } from '$app/environment';
import { ICONS, THEMES } from '$lib/constants';
import type { PageLayout } from '$lib/types';
import { persistedState } from '$lib/utils';
import { MediaQuery } from 'svelte/reactivity';
import { writable } from 'svelte/store';

export const modal = $state({ state: writable(null) });

export const disableToastAnalytics = persistedState<boolean>(
  'disable_toast_analytics',
  false,
);

export const consentToMSClarityCookies = $state({ value: false });

export const showNavigationSideBar = $state({ value: true });

export const pinAllSections = $state({ value: false });

export const wasProjectLoadedFromURL = $state({ value: false });

export const isDesktop = new MediaQuery('(min-width: 768px)');

export const windowLanguage = $state({ value: null });

class DrawerStateClass {
  browsePalettes = $state(false);
  gettingStarted = $state(false);
  weatherDetails = $state(false);
  closeAll = () => {
    this.browsePalettes = false;
    this.gettingStarted = false;
    this.weatherDetails = false;
  };
}

export const drawerState = new DrawerStateClass();

export const pageSections = $state({
  items: [
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
      tooltipText:
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
      tooltipText:
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
      tooltipText:
        'Preview and customize your project after choosing a valid location and pressing the Search button.',
    },
  ],
});

export const theme = $state({ value: 'system' });

class ActiveThemeClass {
  value = $derived(THEMES.find((n) => n.id === theme.value));
}
export const activeTheme = new ActiveThemeClass();

export const defaultYarn = $state({ value: '' });

export const initialLayout: PageLayout = browser
  ? localStorage.getItem('layout') === 'list' ||
    localStorage.getItem('layout') === 'grid'
    ? (localStorage.getItem('layout') as PageLayout)
    : window.innerWidth < 640
      ? 'list'
      : 'grid'
  : 'list';

export const layout: { value: PageLayout } = $state({ value: initialLayout });
