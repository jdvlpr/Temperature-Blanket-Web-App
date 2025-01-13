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

class HistoryStateClass {
  stack: string[] = $state([]);
  currentIndex: number = $state(-1);
  length = $derived(this.stack.length);
  isFirst = $derived(this.currentIndex === 0 || this.length === 0);
  isLast = $derived(this.currentIndex === this.length - 1 || this.length === 0);
  current = $derived.by(() => {
    if (this.length < 1 || this.currentIndex < 0) return null;
    return this.stack[this.currentIndex];
  });
  previous = $derived.by(() => {
    if (this.isFirst) return null;
    return this.stack[this.currentIndex - 1];
  });
  next = $derived.by(() => {
    if (this.isLast) return null;
    return this.stack[this.currentIndex + 1];
  });

  push(value: string) {
    // If it's the same as the previous value, don't add it, or if it's not on the last stack item
    if (this.previous === value || !this.isLast) return;
    this.stack.push(value);
    this.currentIndex = this.length - 1;
  }

  undo() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  redo() {
    if (this.currentIndex < this.stack.length) this.currentIndex++;
  }
}

export const historyState = new HistoryStateClass();

export const isHistoryUpdating = $state({ value: false });

export const historyChangeMessage = $state({ value: '' });
