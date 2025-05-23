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

import { page } from '$app/state';
import KeyboardShortcuts from '$lib/components/modals/KeyboardShortcuts.svelte';
import Menu from '$lib/components/modals/Menu.svelte';
import {
  localState,
  modal,
  pageSections,
  project,
  toast,
  weather,
} from '$lib/state';
import { delay, loadFromHistory } from '$lib/utils';

// Go to a section
export const goToProjectSection = async (index, animateFromBottom = false) => {
  if (index === 0) {
    if (typeof document.documentElement !== 'undefined')
      document.documentElement.scrollTop = 0;
    return;
  }

  setSections(index);

  const activeSection = pageSections.items.find(
    (section) => section.active === true && section.index === index,
  );

  const newScrollTop = activeSection?.scrollTop;
  const currentScrollTop = document.documentElement.scrollTop;

  if (animateFromBottom) {
    await delay(10);
    document.documentElement.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    });
  }

  if (currentScrollTop !== newScrollTop && newScrollTop !== 0) {
    document.documentElement.scrollTo({
      top: newScrollTop,
      behavior: 'smooth',
    });
  } else {
    await delay(10);
    const activeElement = document.getElementById(activeSection.id);
    activeElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};

const setSections = (index) => {
  const currentScrollTop = document.documentElement.scrollTop;

  pageSections.items.forEach((section, i, sections) => {
    if (section.active === true) {
      section.scrollTop = currentScrollTop;
    }
    const isActive = i === index;
    const isPinned = section.pinned === true;
    if (
      !isPinned &&
      section.active &&
      sections.filter((section) => section.active).length > 1
    ) {
      section.active = false;
    } else {
      section.active = isActive || isPinned;
    }
  });
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
  if (
    modal.opened ||
    ev.target.tagName === 'INPUT' ||
    ev.target.tagName === 'TEXTAREA' ||
    ev.target.tagName === 'TD' ||
    ev.target.tagName === 'SELECT' ||
    ev.target.tagName === 'BUTTON'
  )
    return;

  const routeId = page.route.id;

  if (ev.key === 't') toggleTheme();

  // Shortcuts only for the main Project Planner page
  if (routeId === '/') {
    // Check for global shortcuts
    switch (ev.key) {
      case 'k':
        modal.trigger({
          type: 'component',
          component: { ref: KeyboardShortcuts },
        });
        break;
      case '.':
        modal.trigger({
          type: 'component',
          component: { ref: Menu, props: { page: 'main' } },
        });
        break;
      case 'u':
        project.toggleUnits();
        toast.trigger({
          category: 'success',
          message: 'Units changed to ' + localState.value.units,
        });
        break;
    }

    // Check for weather-related shortcuts if weather data exists
    if (weather.data.length) {
      if (isUndo(ev)) {
        ev.preventDefault();
        loadFromHistory({ action: 'Undo' });
      } else if (isRedo(ev)) {
        ev.preventDefault();
        loadFromHistory({ action: 'Redo' });
      } else if ((ev.metaKey || ev.ctrlKey) && ev.key === 's') {
        ev.preventDefault();
        modal.trigger({
          type: 'component',
          component: { ref: Menu, props: { page: 'save' } },
        });
      }
      // Check for section navigation shortcuts
      switch (ev.key) {
        case 'd':
          modal.trigger({
            type: 'component',
            component: { ref: Menu, props: { page: 'download' } },
          });
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
    }
  }
};

// Function to toggle between light, dark, and system themes
const toggleTheme = () => {
  switch (localState.value.theme.mode) {
    case 'light':
      localState.value.theme.mode = 'dark';
      break;
    case 'dark':
      // setTheme('system');
      localState.value.theme.mode = 'system';
      break;
    case 'system':
      // setTheme('light');
      localState.value.theme.mode = 'light';
      break;
    default:
      localState.value.theme.mode = 'system';

      break;
  }
};
