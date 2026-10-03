/**
 * Quick undos for things just moved to the Trash from a list, each shown
 * where its item was, so it's right there to undo. Several can be open at
 * once, one per item.
 *
 * Each remembers the item that came after it. An undo shows just before that
 * item, or just before its undo if that item went to the Trash too, so undos
 * for neighbors stack in the order their items were in.
 */
export type TrashUndoEntry = {
  id: string;
  label: string;
  /** The item after it when it went, or null if it was last */
  beforeId: string | null;
};

export class TrashUndos {
  entries = $state<TrashUndoEntry[]>([]);
  /** The undo to take keyboard focus, as the pressed Delete button is gone */
  focusId = $state<string | null>(null);

  /** Call as an item goes to the Trash, with the ids listed right then */
  add(id: string, label: string, listedIds: string[]) {
    // What's next on screen, counting undos already showing, so one going
    // just above an earlier undo stays above it
    const spots = this.placed(listedIds);
    const onScreen = [
      ...listedIds.flatMap((listedId) => [
        ...(spots.get(listedId) ?? []).map((entry) => entry.id),
        listedId,
      ]),
      ...(spots.get(null) ?? []).map((entry) => entry.id),
    ];
    const at = onScreen.indexOf(id);
    const beforeId = at === -1 ? null : (onScreen[at + 1] ?? null);
    this.entries = [
      ...this.entries.filter((entry) => entry.id !== id),
      { id, label, beforeId },
    ];
    this.focusId = id;
  }

  remove(id: string) {
    this.entries = this.entries.filter((entry) => entry.id !== id);
    if (this.focusId === id) this.focusId = null;
  }

  /**
   * The undos to show before each listed item (by its id), and at the end
   * (null). Ones whose items are listed again (restored some other way) drop.
   */
  placed(listedIds: string[]): Map<string | null, TrashUndoEntry[]> {
    const listed = new Set(listedIds);
    const open = this.entries.filter((entry) => !listed.has(entry.id));
    const byId = new Map(open.map((entry) => [entry.id, entry]));
    const spots = new Map<string | null, TrashUndoEntry[]>();
    const ordered = open
      .map((entry) => {
        // Past any neighbors that went too, to the next listed item
        let anchor = entry.beforeId;
        let depth = 0;
        const seen = new Set<string>();
        while (anchor && byId.has(anchor) && !seen.has(anchor)) {
          seen.add(anchor);
          anchor = byId.get(anchor)!.beforeId;
          depth++;
        }
        if (anchor && !listed.has(anchor)) anchor = null;
        return { entry, anchor, depth };
      })
      // Further from the anchor came earlier in the list
      .sort((a, b) => b.depth - a.depth);
    for (const { entry, anchor } of ordered) {
      spots.set(anchor, [...(spots.get(anchor) ?? []), entry]);
    }
    return spots;
  }
}
