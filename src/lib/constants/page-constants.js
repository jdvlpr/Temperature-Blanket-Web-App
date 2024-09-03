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

import { browser, version } from '$app/environment';

// Timestamp identifying when the app was initialized, used as a kind of unique ID for the project (though technically may not be unique if two users initialize at the exact same time). But it doesn't have any real meaning apart from an identifier for a project.
export const PROJECT_TIMESTAMP_ID = browser
  ? new URL(window.location).searchParams.get('project') ||
    new Date().getTime()?.toString()
  : '';

// App Version
export const LOADED_APP_VERSION = browser
  ? new URL(window.location).searchParams.get('v') || version
  : '';

// Symbols used in a project's URL hash
export const CHARACTERS_FOR_URL_HASH = {
  separator: "'",
  separator_alt: '’', // NOTE: Sometimes the separator symbol gets encoded like this for some reason, so we need to add this as an alternate
};

// reference: https://docs.github.com/en/get-started/using-github/keyboard-shortcuts
export const KEYBOARD_SHORTCUTS = [
  {
    group: 'General',
    details: '',
    items: [
      {
        description: 'Open Menu',
        keys: ['.'],
      },
      {
        description: 'Close any open modal',
        keys: ['Escape'],
      },
      {
        description: 'Toggle Theme (Light, Dark, System)',
        keys: ['t'],
      },
      {
        description: 'Change Units',
        keys: ['u'],
      },
      {
        description: 'Open Keyboard Shortcuts',
        keys: ['k'],
      },
    ],
  },
  {
    group: 'Project',
    details: "These shortcuts won't work until the project has weather data.",
    items: [
      {
        description: 'Open Download Menu',
        keys: ['d'],
      },
      {
        description: 'Save Project',
        keys: [
          ['Cmd ⌘', 's'],
          ['Ctrl', 's'],
        ],
      },
      {
        description: 'Undo',
        keys: [
          ['Cmd ⌘', 'z'],
          ['Ctrl', 'z'],
        ],
      },
      {
        description: 'Redo',
        keys: [
          ['Cmd ⌘', 'Shift ⇧', 'z'],
          ['Ctrl', 'Shift ⇧', 'z'],
        ],
      },
    ],
  },
  {
    group: 'Navigation',
    details: "These shortcuts won't work until the project has weather data.",
    items: [
      {
        description: 'Go to the top of the page',
        keys: ['0'],
      },
      {
        description: 'Go to Location section',
        keys: ['1'],
      },
      {
        description: 'Go to Weather section',
        keys: ['2'],
      },
      {
        description: 'Go to Colors section',
        keys: ['3'],
      },
      {
        description: 'Go to Preview section',
        keys: ['4'],
      },
    ],
  },
];
