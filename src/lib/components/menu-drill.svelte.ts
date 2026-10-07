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

import { getContext, setContext } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';

const KEY = Symbol('menu-drill');

/**
 * Which of a menu's submenus is open in its place, on a phone: there, a
 * submenu replaces the menu's items, with Back to return, rather than opening
 * beside it where there's no room.
 */
export class MenuDrill {
  open: string | null = $state(null);
  #narrow = new MediaQuery('(max-width: 639px)');

  /** Whether submenus open in the menu's place */
  get inPlace() {
    return this.#narrow.current;
  }

  /** Whether the menu's own items show: not while a submenu is in their place */
  get showsMenu() {
    return !this.inPlace || this.open === null;
  }
}

/** For a menu with submenus (MenuSubmenu), in its component */
export const provideMenuDrill = () => setContext(KEY, new MenuDrill());

export const getMenuDrill = () => getContext<MenuDrill | undefined>(KEY);
