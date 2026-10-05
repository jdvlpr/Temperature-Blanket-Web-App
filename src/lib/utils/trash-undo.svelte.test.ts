import { describe, expect, it } from 'vitest';
import { TrashUndos } from './trash-undo.svelte';

// The list as shown: undos in place, as 'undo:<id>'
function shown(undos: TrashUndos, listed: string[]) {
  const spots = undos.placed(listed);
  return [
    ...listed.flatMap((id) => [
      ...(spots.get(id) ?? []).map((entry) => `undo:${entry.id}`),
      id,
    ]),
    ...(spots.get(null) ?? []).map((entry) => `undo:${entry.id}`),
  ];
}

describe('TrashUndos', () => {
  it('shows an undo where its item was', () => {
    const undos = new TrashUndos();
    undos.add('b', 'B', ['a', 'b', 'c']);
    expect(shown(undos, ['a', 'c'])).toEqual(['a', 'undo:b', 'c']);
  });

  it('shows an undo for the last item at the end', () => {
    const undos = new TrashUndos();
    undos.add('c', 'C', ['a', 'b', 'c']);
    expect(shown(undos, ['a', 'b'])).toEqual(['a', 'b', 'undo:c']);
  });

  it('stacks undos for neighbors in their order, deleted top down', () => {
    const undos = new TrashUndos();
    undos.add('a', 'A', ['a', 'b', 'c']);
    undos.add('b', 'B', ['b', 'c']);
    expect(shown(undos, ['c'])).toEqual(['undo:a', 'undo:b', 'c']);
  });

  it('stacks undos for neighbors in their order, deleted bottom up', () => {
    const undos = new TrashUndos();
    undos.add('b', 'B', ['a', 'b', 'c']);
    undos.add('a', 'A', ['a', 'c']);
    expect(shown(undos, ['c'])).toEqual(['undo:a', 'undo:b', 'c']);
  });

  it('keeps the others in place when one is undone', () => {
    const undos = new TrashUndos();
    undos.add('b', 'B', ['a', 'b', 'c']);
    undos.add('a', 'A', ['a', 'c']);
    undos.remove('a');
    expect(shown(undos, ['a', 'c'])).toEqual(['a', 'undo:b', 'c']);
  });

  it('drops an undo whose item is listed again', () => {
    const undos = new TrashUndos();
    undos.add('b', 'B', ['a', 'b', 'c']);
    // Restored from the Trash instead
    expect(shown(undos, ['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('shows them all at the end when nothing is left', () => {
    const undos = new TrashUndos();
    undos.add('a', 'A', ['a', 'b']);
    undos.add('b', 'B', ['b']);
    expect(shown(undos, [])).toEqual(['undo:a', 'undo:b']);
  });

  it('focuses the newest undo', () => {
    const undos = new TrashUndos();
    undos.add('a', 'A', ['a', 'b']);
    undos.add('b', 'B', ['b']);
    expect(undos.focusId).toBe('b');
  });
});
