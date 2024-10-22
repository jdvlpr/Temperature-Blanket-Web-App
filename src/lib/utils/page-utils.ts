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

import { page } from '$app/stores';
import KeyboardShortcuts from '$lib/components/modals/KeyboardShortcuts.svelte';
import Menu from '$lib/components/modals/Menu.svelte';
import {
  modal,
  openDrawerBrowsePalettes,
  openDrawerGettingStarted,
  openDrawerWeatherDetails,
  pageSections,
  theme,
  units,
  weather,
} from '$lib/stores';
import { loadFromHistory, setTheme } from '$lib/utils';
import { bind } from 'svelte-simple-modal';
import { get } from 'svelte/store';

// Go to a section
export const goToProjectSection = async (index) => {
  if (index === 0) {
    if (typeof document.documentElement !== 'undefined')
      document.documentElement.scrollTop = 0;
    return;
  }

  await setSections(index).then(() => {
    const activeSection = get(pageSections).find(
      (section) => section.active === true && section.index === index,
    );

    const newScrollTop = activeSection?.scrollTop;
    const currentScrollTop = document.documentElement.scrollTop;
    const activeElement = document.getElementById(activeSection.id);

    if (currentScrollTop !== newScrollTop && newScrollTop !== 0) {
      document.documentElement.scrollTop = newScrollTop;
    } else {
      activeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  });
};

export const closeAllDrawers = () => {
  openDrawerBrowsePalettes.set(false);
  openDrawerGettingStarted.set(false);
  openDrawerWeatherDetails.set(false);
};

const setSections = async (index) => {
  let _sections = get(pageSections);
  const currentScrollTop = document.documentElement.scrollTop;

  _sections.forEach((section, i) => {
    if (section.active === true) {
      section.scrollTop = currentScrollTop;
    }
    const isActive = i === index;
    const isPinned = section.pinned === true;
    if (
      !isPinned &&
      _sections[i].active &&
      _sections.filter((section) => section.active).length > 1
    ) {
      _sections[i].active = false;
    } else {
      _sections[i].active = isActive || isPinned;
    }
  });

  pageSections.set(_sections);
};

const checkUndoRedo = (ev, style, shift) => {
  const macAllow = !style || style === 'mac';
  const winAllow = !style || style === 'windows';
  const code = ev.keyCode || ev.which;

  if (code !== 122 && code !== 90) {
    return false;
  }
  if (macAllow && ev.metaKey && shift && !ev.ctrlKey && !ev.altKey) {
    return true;
  }
  if (winAllow && ev.ctrlKey && shift && !ev.metaKey && !ev.altKey) {
    return true;
  }
  return false;
};

const isUndo = (ev, style) => {
  return checkUndoRedo(ev, style, !ev.shiftKey);
};

const isRedo = (ev, style) => {
  return checkUndoRedo(ev, style, ev.shiftKey);
};

export const handleKeyDown = (ev) => {
  // Only handle keyboard shortcuts on the main Project Planner page
  const isProjectPlannerRoute = get(page).route.id === '/';

  if (
    !isProjectPlannerRoute ||
    get(modal) ||
    ev.target.tagName === 'INPUT' ||
    ev.target.tagName === 'TD'
  )
    return;

  // Check for global shortcuts
  switch (ev.key) {
    case 'k':
      modal.set(bind(KeyboardShortcuts));
      break;
    case '.':
      modal.set(bind(Menu, { page: 'main' }));
      break;
    case 'u':
      units.toggle();
      break;
    case 't':
      toggleTheme();
      break;
    default:
      break;
  }

  // Check for weather-related shortcuts if weather data exists
  if (!get(weather)) return;

  if (isUndo(ev)) {
    ev.preventDefault();
    loadFromHistory({ action: 'undo' });
  } else if (isRedo(ev)) {
    ev.preventDefault();
    loadFromHistory({ action: 'redo' });
  } else if ((ev.metaKey || ev.ctrlKey) && ev.key === 's') {
    ev.preventDefault();
    modal.set(bind(Menu, { page: 'save' }));
  }

  // Check for section navigation shortcuts
  switch (ev.key) {
    case 'd':
      modal.set(bind(Menu, { page: 'download' }));
      break;
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
      goToProjectSection(Number(ev.key));
      break;
    default:
      break;
  }
};

// Function to toggle between light, dark, and system themes
const toggleTheme = () => {
  switch (get(theme)) {
    case 'light':
      setTheme('dark');
      break;
    case 'dark':
      setTheme('system');
      break;
    case 'system':
      setTheme('light');
      break;
    default:
      break;
  }
};
