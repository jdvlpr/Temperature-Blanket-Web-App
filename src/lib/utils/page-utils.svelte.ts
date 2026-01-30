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
import { dialog, pageSections, project, toast, weather } from '$lib/state';
import { preferences } from '$lib/storage/preferences.svelte';
import { delay, loadFromHistory } from '$lib/utils';
import { tick } from 'svelte';

// Go to a section
export const goToProjectSection = async (index: number, animateFromBottom: boolean = false) => {
  if (index === 0) {
    if (typeof document.documentElement !== 'undefined')
      document.documentElement.scrollTop = 0;
    return;
  }
     
  setSections(index);
  
  if (animateFromBottom) {
    await tick();
    // scroll to bottom
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    });
    await delay(50);
  }
  
  const activeSection = pageSections.items.find(
    (section) => section.active === true && section.index === index,
  );

  var topBanner = document.getElementById('top-banner')?.getBoundingClientRect() ?? {height: 0};
  
  const topBannerHeight = topBanner.height;
  const sectionScrollTop = activeSection?.scrollTop; 
  const currentScrollTop = document.documentElement.scrollTop;



  if (sectionScrollTop !== 0 && currentScrollTop !== sectionScrollTop) {
    await tick();
    // Scroll to previous position of section
    document.documentElement.scrollTo({
      top: sectionScrollTop,
      behavior: 'smooth',
    });
  } else {
    // Scroll to top of section
    await tick();
    document.documentElement.scrollTo({
      top: topBannerHeight,
      behavior: 'smooth',
    });

    // Horizontal scroll active gauge button into view when the gauge section is active
    if (activeSection?.id === 'page-section-gauges') {
      await tick();
      const activeGaugeBtn = document.getElementById('active-gauge-button');
      const isVisible = activeGaugeBtn?.getBoundingClientRect().left < 0 || activeGaugeBtn?.getBoundingClientRect().right < window.innerWidth;
      if (activeGaugeBtn && isVisible) {
        activeGaugeBtn.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }

    // Horizontal scroll active preview button into view when the preview section is active
    if (activeSection?.id === 'page-section-preview') {
      await tick();
      const activePreviewBtn = document.getElementById('active-preview-button');
      const isVisible = activePreviewBtn?.getBoundingClientRect().left < 0 || activePreviewBtn?.getBoundingClientRect().right < window.innerWidth;
      if (activePreviewBtn && !isVisible) {
        activePreviewBtn.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }
};

const setSections = (index) => {
  const currentScrollTop = document.documentElement.scrollTop;

  pageSections.items.forEach((section, i, sections) => {
    if (section.active === true) {
      section.scrollTop = currentScrollTop;
    }
    const isActive = i === index;
    if (
      section.active &&
      sections.filter((section) => section.active).length > 1
    ) {
      section.active = false;
    } else {
      section.active = isActive;
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
    dialog.opened ||
    ev.target.tagName === 'INPUT' ||
    ev.target.tagName === 'TEXTAREA' ||
    ev.target.tagName === 'TD' ||
    ev.target.tagName === 'SELECT' ||
    ev.target.tagName === 'BUTTON'
  )
    return;

  const routeId = page.route.id;

  if (ev.key === 't') {
    // Toggle between light, dark, and system themes on 't' key press
    switch (preferences.value.theme.mode) {
      case 'light':
        preferences.value.theme.mode = 'dark';
        break;
      case 'dark':
        preferences.value.theme.mode = 'system';
        break;
      case 'system':
        preferences.value.theme.mode = 'light';
        break;
      default:
        preferences.value.theme.mode = 'system';
        break;
    }
    const themeTitle =
      preferences.value.theme.mode.charAt(0).toUpperCase() +
      preferences.value.theme.mode.slice(1);

    toast.trigger({
      category: 'success',
      message: `${themeTitle} theme enabled`,
    });
  }

  // Shortcuts only for the main Project Planner page
  if (routeId === '/') {
    // Check for global shortcuts
    switch (ev.key) {
      case 'k':
        dialog.trigger({
          type: 'component',
          component: { ref: KeyboardShortcuts },
        });
        break;
      case '.':
        dialog.trigger({
          type: 'component',
          component: { ref: Menu, props: { page: 'main' } },
        });
        break;
      case 'u':
        project.toggleUnits();
        toast.trigger({
          category: 'success',
          message: 'Units changed to ' + preferences.value.units,
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
        dialog.trigger({
          type: 'component',
          component: { ref: Menu, props: { page: 'save' } },
        });
      }
      // Check for section navigation shortcuts
      switch (ev.key) {
        case 'd':
          dialog.trigger({
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
