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

import {
  AArrowDownIcon,
  AArrowUpIcon,
  ALargeSmallIcon,
  Rows2Icon,
  Rows3Icon,
  Rows4Icon,
} from '@lucide/svelte';

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
        description: 'Open Project Menu',
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
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun size-6"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  },
  {
    description: 'Set the theme to dark mode.',
    id: 'dark',
    name: 'Dark',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon size-6"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  },
  {
    description: "Set the theme to match your system's mode.",
    id: 'system',
    name: 'System',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-monitor-cog size-6"><path d="M12 17v4"/><path d="m15.2 4.9-.9-.4"/><path d="m15.2 7.1-.9.4"/><path d="m16.9 3.2-.4-.9"/><path d="m16.9 8.8-.4.9"/><path d="m19.5 2.3-.4.9"/><path d="m19.5 9.7-.4-.9"/><path d="m21.7 4.5-.9.4"/><path d="m21.7 7.5-.9-.4"/><path d="M22 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="M8 21h8"/><circle cx="18" cy="6" r="3"/></svg>`,
  },
];

export const SKELETON_THEMES = [
  {
    id: 'classic',
    description: 'Classic theme with a balanced color palette.',
    name: 'Marble',
    colors: {
      primary: '#fcd34d',
      secondary: '#075985',
      surface: '#64748b',
    },
  },
  {
    id: 'crimson',
    description: 'A bold theme with deep red and dark tones.',
    name: 'Garnet',
    colors: {
      primary: '#d21d3d',
      secondary: '#4785ae',
      surface: '#353a50',
    },
  },
  {
    id: 'hamlindigo',
    description: 'A luxurious theme with rich indigo and gold colors.',
    name: 'Lapis Lazuli',
    colors: {
      primary: '#a7bef3',
      secondary: '#a38e5e',
      surface: '#6476a1',
    },
  },
  {
    id: 'modern',
    description: 'A modern theme with bright pink and cyan colors.',
    name: 'Jasper',
    colors: {
      primary: '#eb4999',
      secondary: '#00b7d6',
      surface: '#6367ef',
    },
  },
  {
    id: 'rocket',
    description: 'A cool theme with soft blue tones',
    name: 'Geode',
    colors: {
      primary: '#00b7d6',
      secondary: '#3a82f7',
      surface: '#64748b',
    },
  },
  {
    id: 'legacy',
    description: 'A striking theme with a bold green and purple palette.',
    name: 'Tufa',
    colors: {
      surface: '#11ba81',
      primary: '#4f46e5',
      secondary: '#495a90',
    },
  },
];

export const ROUNDNESS = [
  {
    id: 'sharp',
    name: 'Sharp',
    description: 'Square corners on buttons and containers.',
    radiusBase: '0.063rem',
    radiusContainer: '0.125rem',
  },
  {
    id: 'rounded',
    name: 'Rounded',
    description: 'Gently rounded corners on buttons and containers.',
    radiusBase: '0.75rem',
    radiusContainer: '1.5rem',
  },
  {
    id: 'pill',
    name: 'Pill',
    description: 'Fully rounded buttons, gently rounded containers.',
    radiusBase: '9999rem',
    radiusContainer: '1.5rem',
  },
];

export const SPACING = [
  {
    IconComponent: Rows4Icon,
    id: 'compact',
    name: 'Compact',
    description: 'Tighter layout spacing.',
    value: '0.22rem',
  },
  {
    IconComponent: Rows3Icon,
    id: 'normal',
    name: 'Normal',
    description: 'Default layout spacing.',
    value: '0.25rem',
  },
  {
    IconComponent: Rows2Icon,
    id: 'relaxed',
    name: 'Relaxed',
    description: 'Looser, airier layout spacing.',
    value: '0.28rem',
  },
];

export const TEXT_SCALE = [
  {
    IconComponent: AArrowDownIcon,
    id: 'small',
    name: 'Small',
    description: 'Tighter typographic scale.',
    value: '1',
  },
  {
    IconComponent: ALargeSmallIcon,
    id: 'normal',
    name: 'Normal',
    description: 'Default typographic scale.',
    value: '1.067',
  },
  {
    IconComponent: AArrowUpIcon,
    id: 'large',
    name: 'Large',
    description: 'Larger typographic scale.',
    value: '1.125',
  },
];

export const HEADING_STYLE = [
  {
    id: 'playful',
    name: 'Playful',
    description: 'Expressive, bouncy, ultra-bold headings.',
    opsz: 32,
    wght: 900,
    SOFT: 100,
    WONK: 1,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Balanced, medium-weight headings.',
    opsz: 68,
    wght: 600,
    SOFT: 50,
    WONK: 0,
  },
  {
    id: 'refined',
    name: 'Refined',
    description: 'Thin, elegant, high-optical-size headings.',
    opsz: 100,
    wght: 700,
    SOFT: 0,
    WONK: 0,
  },
];

export const APP_NAVIGATION_SIDEBAR_WIDTH = 278;
