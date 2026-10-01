/** Days a deleted project or palette stays in the Trash before it's deleted for good */
export const TRASH_DAYS = 30;

/** When something deleted before now is past its time in the Trash (ms) */
export const trashCutoff = (now = Date.now()): number =>
  now - TRASH_DAYS * 24 * 60 * 60 * 1000;
