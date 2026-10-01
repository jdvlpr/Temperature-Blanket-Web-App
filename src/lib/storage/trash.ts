/** Days a deleted project or palette stays in the Trash before it's deleted for good */
export const TRASH_DAYS = 30;

/** When something deleted before now is past its time in the Trash (ms) */
export const trashCutoff = (now = Date.now()): number =>
  now - TRASH_DAYS * 24 * 60 * 60 * 1000;

/**
 * The project just moved to the Trash from the Project menu, for the new
 * project's page to offer Undo once the page has started over
 */
export type JustTrashed = { id: string; label: string; href: string };

const JUST_TRASHED_KEY = 'just_trashed_project';

export function rememberJustTrashed(trashed: JustTrashed): void {
  try {
    sessionStorage.setItem(JUST_TRASHED_KEY, JSON.stringify(trashed));
  } catch {
    // No Undo, then: it's still in the Trash
  }
}

/** The project just moved to the Trash, once: reading it forgets it */
export function takeJustTrashed(): JustTrashed | null {
  try {
    const value = sessionStorage.getItem(JUST_TRASHED_KEY);
    sessionStorage.removeItem(JUST_TRASHED_KEY);
    return value ? (JSON.parse(value) as JustTrashed) : null;
  } catch {
    return null;
  }
}
