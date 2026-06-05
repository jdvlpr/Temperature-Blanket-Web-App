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

import { MediaQuery } from 'svelte/reactivity';
import type { Component } from 'svelte';
import { page } from '$app/state';
import KeyboardShortcuts from '$lib/components/modals/KeyboardShortcuts.svelte';
import Menu from '$lib/components/modals/Menu.svelte';
import SaveProjectModal from '$lib/components/modals/SaveProjectModal.svelte';
import { project } from '$lib/state/project-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import { preferences } from '$lib/storage/preferences.svelte';
import { delay } from '$lib/utils/function-utils.svelte';
import { loadFromHistory } from '$lib/utils/history-utils.svelte';
import { tick } from 'svelte';

type DialogOptions = {
  showCloseButton?: boolean;
  size?: 'small' | 'medium' | 'large';
};
class DialogClass {
  #defaultOptions: DialogOptions = {
    showCloseButton: true,
    size: 'small',
  };

  opened = $state(false);

  type = $state<'component' | 'confirm' | 'choose-weather-params' | null>(null);

  title = $state<string | null>('');

  body = $state<string | null>('');

  response = $state<any>(null);

  options = $state<DialogOptions>({
    showCloseButton: true,
    size: 'small',
  });

  contentComponent = $state({
    ref: null,
    props: null,
  });

  trigger = async ({
    type,
    component,
    options,
    title,
    body,
    response,
  }: {
    type: 'component' | 'confirm' | 'choose-weather-params';
    title?: string | null;
    body?: string | null;
    response?: any;
    component?: any;
    options?: DialogOptions;
  }) => {
    // close the dialog
    this.close();

    this.type = type;

    if (type === 'component') {
      const { ref, props } = component;

      // Set the the dialog component and props
      this.contentComponent = {
        ref,
        props,
      };

      this.options = { ...this.#defaultOptions, ...options };
    } else if (type === 'choose-weather-params') {
      this.response = response || null;
    } else if (type === 'confirm') {
      this.title = title || null;
      this.body = body || null;
      this.response = response || null;
    }
    // Open the modal
    this.opened = true;
  };

  close = () => {
    this.opened = false;
  };
}

export const dialog = new DialogClass();

export interface ToastSettings {
  /** Provide the toast message. Supports HTML. */
  message: string;
  /** Provide CSS classes to set the background color. */
  background?: string;
  /** Enables auto-hide after the timeout duration. */
  autohide?: boolean;
  /** Set the auto-hide timeout duration. */
  timeout?: number;
  /** Generate a custom action button UI. */
  action?: {
    /** The button label. Supports HTML. */
    label: string;
    /** The function triggered when the button is pressed. */
    response: () => void;
  };
  /** Hide dismiss button */
  hideDismiss?: boolean;
  /** Remain visible on Hover */
  hoverable?: boolean;
  /** Provide arbitrary CSS classes to style the toast. */
  classes?: string;
  /** Category of the toast. */
  category?: 'success' | 'error' | 'warning' | null;
  /** Custom Icon Component */
  icon?: Component;
  /** Callback function that fires on trigger and close. */
  callback?: (response: { id: string; status: 'queued' | 'closed' }) => void;
}

export interface Toast extends ToastSettings {
  /** A UUID will be auto-assigned on `.trigger()`. */
  id: string;
  /** The id of the `setTimeout` if `autohide` is enabled  */
  timeoutId?: ReturnType<typeof setTimeout>;
}

class ToastService {
  #toastDefaults: ToastSettings = {
    message: 'Missing Toast Message',
    autohide: true,
    timeout: 5000,
  };

  // All Toasts
  queue = $state([]);

  /** Remove toast in queue*/
  close = (id: string) => {
    if (this.queue.length > 0) {
      const index = this.queue.findIndex((t) => t.id === id);
      const selectedToast = this.queue[index];
      if (selectedToast) {
        // Trigger Callback
        if (selectedToast.callback)
          selectedToast.callback({ id, status: 'closed' });
        // Clear timeout
        if (selectedToast.timeoutId) clearTimeout(selectedToast.timeoutId);
        // Remove
        this.queue.splice(index, 1);
      }
    }
  };

  // If toast should auto-hide, wait X time, then close by ID
  handleAutoHide = (toast: Toast) => {
    if (toast.autohide === true) {
      return setTimeout(() => {
        this.close(toast.id);
      }, toast.timeout);
    }
  };

  /** Add a new toast to the queue. */
  trigger = (toast: ToastSettings) => {
    const id: string = Number(Math.random()).toString(32);
    // Trigger Callback
    if (toast && toast.callback) toast.callback({ id, status: 'queued' });
    // activate autohide when dismiss button is hidden.
    if (toast.hideDismiss) toast.autohide = true;

    // Merge with defaults
    const tMerged: Toast = { ...this.#toastDefaults, ...toast, id };
    // Handle auto-hide, if needed
    tMerged.timeoutId = this.handleAutoHide(tMerged);
    // Push into queue
    this.queue.push(tMerged);
  };

  /** Remain visible on hover */
  freeze = (index: number) => {
    if (this.queue.length > 0) clearTimeout(this.queue[index].timeoutId);
  };
  /** Cancel remain visible on leave */
  unfreeze = (index: number) => {
    if (this.queue.length > 0)
      this.queue[index].timeoutId = this.handleAutoHide(this.queue[index]);
  };
  /** Remove all toasts from queue */
  clear = () => (this.queue = []);
}

export const toast = new ToastService();

export const consentToMSClarityCookies = $state({ value: false });

export const showNavigationSideBar = $state({ value: true });

export const isDesktop = new MediaQuery('(min-width: 768px)');

export const windowLanguage = $state({ value: null });

class DrawerStateClass {
  weatherDetails = $state(false);
  appNavigation = $state(false);
  closeAll = () => {
    this.weatherDetails = false;
    this.appNavigation = false;
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
      scrollTop: 0,
      title: 'Top',
    },
    {
      active: true,
      id: 'page-section-location',
      index: 1,
      keyboardShortcut: 1,
      scrollTop: 0,
      title: 'Location',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-earth"><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"/><path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"/><path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"/><circle cx="12" cy="12" r="10"/></svg>
`,
    },
    {
      active: false,
      id: 'page-section-weather-data',
      index: 2,
      keyboardShortcut: 2,
      scrollTop: 0,
      title: 'Weather',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thermometer"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>`,
      tooltipText:
        'See weather data after choosing a valid location and pressing the Search button.',
    },
    {
      active: false,
      id: 'page-section-gauges',
      index: 3,
      keyboardShortcut: 3,
      scrollTop: 0,
      title: 'Colors',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-swatch-book"><path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z"/><path d="M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7"/><path d="M 7 17h.01"/><path d="m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8"/></svg>`,
      tooltipText:
        'Choose yarn colors and create ranges after choosing a valid location and pressing the Search button.',
    },
    {
      active: false,
      id: 'page-section-preview',
      index: 4,
      keyboardShortcut: 4,
      scrollTop: 0,
      title: 'Preview',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`,
      tooltipText:
        'Preview and customize your project after choosing a valid location and pressing the Search button.',
    },
  ],
});

export const defaultYarn = $state({ value: '' });

// Go to a section
export const goToProjectSection = async (
  index: number,
  animateFromBottom: boolean = false,
) => {
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

  var topBanner = document
    .getElementById('top-banner')
    ?.getBoundingClientRect() ?? { height: 0 };

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
      const isHidden =
        activeGaugeBtn?.getBoundingClientRect().left < 0 ||
        activeGaugeBtn?.getBoundingClientRect().right > window.innerWidth;
      if (activeGaugeBtn && isHidden) {
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
      const isHidden =
        activePreviewBtn?.getBoundingClientRect().left < 0 ||
        activePreviewBtn?.getBoundingClientRect().right > window.innerWidth;
      if (activePreviewBtn && isHidden) {
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
          component: { ref: Menu },
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
          component: { ref: SaveProjectModal },
        });
      }
      // Check for section navigation shortcuts
      switch (ev.key) {
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
