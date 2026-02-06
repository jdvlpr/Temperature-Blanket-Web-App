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
import { skeletonThemes } from '$lib/components/ThemeSwitcher.svelte';
import { DEFAULT_SEASONS } from '$lib/constants';
import { preferences } from '$lib/storage/preferences.svelte';
import type { PageLayout } from '$lib/types';
import { MigrationManager } from './migration-manager';

/**
 * Cleans up old local storage keys which are no longer used or which have been migrated to different locations
 * Added in version 5.0.0
 */
async function handleLegacyLocalStorageKeys() {
  // 'layout' is now 'preferences.layout'
  if (localStorage.getItem('layout')) {
    preferences.value.layout = localStorage.getItem('layout') as PageLayout;
    localStorage.removeItem('layout');
  }

  // 'disable_toast_analytics' is now 'preferences.disableToastAnalytics'
  const disableToastAnalytics = localStorage.getItem('disable_toast_analytics');
  if (disableToastAnalytics === 'true' || disableToastAnalytics === 'false') {
    let value = JSON.parse(disableToastAnalytics);
    preferences.value.disableToastAnalytics = value;
    localStorage.removeItem('disable_toast_analytics');
  }

  // 'theme' is now 'preferences.theme.mode'
  const theme = localStorage.getItem('theme');
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    preferences.value.theme.mode = theme;
    localStorage.removeItem('theme');
  }

  // 'skeletonTheme' is now 'preferences.theme.id'
  const skeletonTheme = localStorage.getItem('skeletonTheme');
  if (skeletonTheme) {
    let parsedSkeletonTheme;
    try {
      parsedSkeletonTheme = JSON.parse(skeletonTheme); // themes were stored as "example" (included the quotes), so we need to parse them
    } catch {
      parsedSkeletonTheme = null;
    }
    if (
      parsedSkeletonTheme &&
      skeletonThemes.some((theme) => theme.id === parsedSkeletonTheme)
    ) {
      preferences.value.theme.id = parsedSkeletonTheme;
      localStorage.removeItem('skeletonTheme');
    }
  }

  // Migrate projects from localStorage to IndexedDB
  await MigrationManager.migrateFromLocalStorage();
}

export async function initializeLocalStorage() {
  preferences.value.theme.id = preferences.value.theme.id || 'classic';
  preferences.value.theme.mode = preferences.value.theme.mode || 'system';
  preferences.value.seasons = preferences.value.seasons || DEFAULT_SEASONS;

  try {
    await handleLegacyLocalStorageKeys();
  } catch (e) {
    throw e;
  }

  // Setup Theme Listeners
  if (browser) {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (preferences.value.theme.mode === 'system') {
          if (e.matches) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }
      });
  }

  $effect.root(() => {
    $effect(() => {
      const theme = preferences.value.theme.id || 'classic';
      const mode = preferences.value.theme.mode || 'system';

      if (skeletonThemes.map((theme) => theme.id).includes(theme)) {
        document.documentElement.setAttribute('data-theme', theme);
        fetch('/api/preferences/theme', {
          method: 'POST',
          body: JSON.stringify({ theme, mode }),
        });
      }
    });

    $effect(() => {
      document.documentElement.classList.toggle(
        'dark',
        preferences.value.theme.mode === 'dark' ||
          (preferences.value.theme.mode === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches),
      );
    });
  });
}
