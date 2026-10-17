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

// Which side of My Library and of the Gallery (Projects or Palettes) was open
// last on this device, so each sidebar link goes back to it. Projects the
// first time.

export type LibrarySection = 'projects' | 'palettes';

class Section<T extends string> {
  #value = $state<T>() as T;
  readonly #key: string;
  readonly #options: readonly T[];

  constructor(key: string, options: readonly [T, ...T[]]) {
    this.#key = key;
    this.#options = options;
    this.#value = options[0];
    // On the server, the first side
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(key) as T | null;
      if (stored && options.includes(stored)) this.#value = stored;
    } catch {
      // Private browsing: the first side
    }
  }

  get value() {
    return this.#value;
  }

  set value(value: T) {
    if (value === this.#value) return;
    this.#value = value;
    try {
      localStorage.setItem(this.#key, value);
    } catch {
      // Private browsing: the first side opens next time
    }
  }
}

export const librarySection = new Section<LibrarySection>(
  'my_library_section',
  ['projects', 'palettes'],
);

export const gallerySection = new Section<LibrarySection>(
  'gallery_section',
  ['projects', 'palettes'],
);
