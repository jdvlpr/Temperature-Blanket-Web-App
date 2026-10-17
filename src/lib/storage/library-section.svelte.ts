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

// Which side of My Library was open last on this device, so the sidebar's
// My Library link goes back to it. Projects the first time.

export type LibrarySection = 'projects' | 'palettes';

const KEY = 'my_library_section';

function readSection(): LibrarySection | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'projects' || value === 'palettes' ? value : null;
  } catch {
    return null;
  }
}

function writeSection(value: LibrarySection) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // Private browsing: My Library opens on Projects next time
  }
}

class Section {
  #value = $state<LibrarySection>('projects');

  constructor() {
    // On the server, Projects
    if (typeof localStorage === 'undefined') return;
    this.#value = readSection() ?? 'projects';
  }

  get value() {
    return this.#value;
  }

  set value(value: LibrarySection) {
    if (value === this.#value) return;
    this.#value = value;
    writeSection(value);
  }
}

export const librarySection = new Section();
