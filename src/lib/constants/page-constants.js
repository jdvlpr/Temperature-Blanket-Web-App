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
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  },
  {
    description: 'Set the theme to dark mode.',
    id: 'dark',
    name: 'Dark',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  },
  {
    description: "Set the theme to match your system's mode.",
    id: 'system',
    name: 'System',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-monitor-cog"><path d="M12 17v4"/><path d="m15.2 4.9-.9-.4"/><path d="m15.2 7.1-.9.4"/><path d="m16.9 3.2-.4-.9"/><path d="m16.9 8.8-.4.9"/><path d="m19.5 2.3-.4.9"/><path d="m19.5 9.7-.4-.9"/><path d="m21.7 4.5-.9.4"/><path d="m21.7 7.5-.9-.4"/><path d="M22 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="M8 21h8"/><circle cx="18" cy="6" r="3"/></svg>`,
  },
];
