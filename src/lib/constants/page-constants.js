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

export const THEMES = [
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
];
