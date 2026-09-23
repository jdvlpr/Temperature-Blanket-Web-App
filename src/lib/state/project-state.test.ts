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

import { describe, expect, it } from 'vitest';
import { HistoryStateClass } from './project-state.svelte';

describe('HistoryStateClass', () => {
  it('redo() at the last entry is a no-op and does not walk currentIndex out of bounds', () => {
    const history = new HistoryStateClass();
    history.push('a');
    history.push('b');

    expect(history.isLast).toBe(true);
    expect(history.currentIndex).toBe(1);

    history.redo();

    expect(history.currentIndex).toBe(1);
    expect(history.isFirst).toBe(false);
    expect(history.isLast).toBe(true);
    expect(history.current).toBe('b');
  });

  it('redo() on an empty stack is a no-op', () => {
    const history = new HistoryStateClass();

    history.redo();

    expect(history.currentIndex).toBe(-1);
    expect(history.current).toBe(null);
  });

  it('undo() at the first entry is a no-op', () => {
    const history = new HistoryStateClass();
    history.push('a');

    history.undo();

    expect(history.currentIndex).toBe(0);
    expect(history.current).toBe('a');
  });

  it('push() after an undo discards the stale redo branch and re-enables Undo', () => {
    const history = new HistoryStateClass();
    history.push('a');
    history.push('b');
    history.undo();

    expect(history.isFirst).toBe(true);

    history.push('c');

    expect(history.stack).toEqual(['a', 'c']);
    expect(history.currentIndex).toBe(1);
    expect(history.isFirst).toBe(false);
    expect(history.isLast).toBe(true);
    expect(history.previous).toBe('a');
  });

  it('push() with a value equal to current is a no-op', () => {
    const history = new HistoryStateClass();
    history.push('a');

    history.push('a');

    expect(history.stack).toEqual(['a']);
  });
});
