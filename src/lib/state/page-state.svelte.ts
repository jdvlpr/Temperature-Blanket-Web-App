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
import { MediaQuery } from 'svelte/reactivity';

type ModalOptions = {
  showCloseButton?: boolean;
  size?: 'small' | 'medium' | 'large';
};
class ModalClass {
  #defaultOptions: ModalOptions = {
    showCloseButton: true,
    size: 'small',
  };

  opened = $state(false);

  type = $state<'component' | 'confirm' | null>(null);

  title = $state<string | null>('');

  body = $state<string | null>('');

  response = $state<any>(null);

  drawer = $state({
    leftNavigation: false,
  });

  options = $state<ModalOptions>({
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
    type: 'component' | 'confirm';
    title?: string | null;
    body?: string | null;
    response?: any;
    component?: any;
    options?: ModalOptions;
  }) => {
    // close the modal
    this.close();

    this.type = type;

    if (type === 'component') {
      const { ref, props } = component;
      // Delay necessary for zag to transition
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 0);
      });

      // Set the the modal component and props
      this.contentComponent = {
        ref,
        props,
      };

      this.options = { ...this.#defaultOptions, ...options };
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

    // close the drawer
    for (const key in this.drawer) {
      this.drawer[key] = false;
    }
  };
}

export const modal = new ModalClass();

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

export const pinAllSections = $state({ value: false });

export const wasProjectLoadedFromURL = $state({ value: false });

export const isDesktop = new MediaQuery('(min-width: 768px)');

export const windowLanguage = $state({ value: null });

class DrawerStateClass {
  weatherDetails = $state(false);
  closeAll = () => {
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

export const defaultYarn = $state({ value: '' });
