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

import { browser } from '$app/environment';
import { writable } from 'svelte/store';

/**
 * Based off of svelte-undo (https://github.com/Rich-Harris/svelte-undo)
 */
function createHistory(current) {
  let stack = current ? [current] : [];

  let index = stack.length;

  const state = writable({
    first: true,
    last: true,
    length: stack.length,
    index,
    current,
  });

  function update() {
    current = stack[index - 1];

    state.set({
      first: index === 1,
      last: index === stack.length,
      length: stack.length,
      index,
      current,
    });

    return current;
  }

  return {
    /** @param {T | ((current: T) => T)} value */
    push: (value) => {
      if (stack[index - 1] === value) {
        return update();
      }
      stack.length = index;
      stack[index++] =
        typeof value === 'function'
          ? /** @type {(current: T) => T} */ value(current)
          : value;
      return update();
    },
    undo: () => {
      if (index > 1) index -= 1;
      return update();
    },
    redo: () => {
      if (index < stack.length) index += 1;
      return update();
    },
    subscribe: state.subscribe,
  };
}

export const history = createHistory(
  browser ? window.location.hash.substring(1) : null,
);

export const isHistoryUpdating = writable(false);

export const historyChangeMessage = writable('');
