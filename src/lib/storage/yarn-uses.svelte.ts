import { defaultYarn } from '$lib/state/page-state.svelte';

/**
 * How often each yarn's colors are saved, to suggest making one the default
 * yarn once it's clearly a favorite. Kept on this device only: it's a nudge,
 * not a setting.
 */
export type YarnUsesState = {
  /** Saves by yarn, as `{brandId}-{yarnId}` */
  counts: Record<string, number>;
  /** Yarns not to suggest again, after Not Now */
  declined: string[];
};

const KEY = 'yarn_uses';

/** Saves with a yarn before it's suggested, so it shows the third time */
export const SUGGEST_AFTER = 2;

export function yarnKey(brandId?: string | null, yarnId?: string | null) {
  return brandId && yarnId ? `${brandId}-${yarnId}` : '';
}

/** Whether to suggest making this yarn the default */
export function suggestsDefault(
  state: YarnUsesState,
  key: string,
  currentDefault: string,
) {
  return (
    !!key &&
    key !== currentDefault &&
    !state.declined.includes(key) &&
    (state.counts[key] ?? 0) >= SUGGEST_AFTER
  );
}

function readState(): YarnUsesState {
  try {
    const state = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (state && typeof state === 'object')
      return { counts: {}, declined: [], ...state };
  } catch {
    // Start over
  }
  return { counts: {}, declined: [] };
}

class YarnUses {
  // Empty on the server, where there's no Local Storage
  state = $state<YarnUsesState>(readState());

  // Before a change: another tab may have made one since this loaded, which
  // writing this tab's older copy would undo
  #refresh() {
    this.state = readState();
  }

  #write() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error(e);
    }
  }

  /** Call as colors from a yarn are saved */
  record(brandId?: string | null, yarnId?: string | null) {
    const key = yarnKey(brandId, yarnId);
    if (!key) return;
    this.#refresh();
    this.state.counts[key] = (this.state.counts[key] ?? 0) + 1;
    this.#write();
  }

  decline(key: string) {
    this.#refresh();
    if (!key || this.state.declined.includes(key)) return;
    this.state.declined.push(key);
    this.#write();
  }

  suggests(key: string) {
    return suggestsDefault(this.state, key, defaultYarn.value);
  }
}

export const yarnUses = new YarnUses();
