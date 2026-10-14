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

// A page's data that comes after the page on a move within the app (the
// server streams it), but with the page on a full load.

const isPromise = <T>(value: T | Promise<T>): value is Promise<T> =>
  typeof (value as Promise<T> | null)?.then === 'function';

/** `source`'s value: undefined until a streamed one arrives. Call while a component starts. */
export function streamed<T>(source: () => T | Promise<T>): {
  readonly current: T | undefined;
} {
  let value = $derived.by(() => {
    const from = source();
    return isPromise(from) ? undefined : from;
  });
  $effect(() => {
    const from = source();
    if (!isPromise(from)) return;
    let current = true;
    from.then(
      (found) => {
        if (current) value = found;
      },
      (e) => console.error('Could not load page data', e),
    );
    return () => {
      current = false;
    };
  });
  return {
    get current() {
      return value;
    },
  };
}
