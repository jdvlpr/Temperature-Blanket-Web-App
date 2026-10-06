/** A menu item's look, shared by the app's Sort, View and "more" menus */
export const menuItemClass =
  'data-highlighted:bg-surface-200-800 flex items-center justify-start gap-2 text-left whitespace-normal data-highlighted:text-inherit data-disabled:opacity-50';

/** A Sort or View menu's button, shared so they sit side by side alike */
export const menuTriggerClass = 'btn hover:preset-tonal-surface';

/** The menu panel itself */
export const menuContentClass =
  'bg-surface-100-900 z-9999 max-w-[calc(100vw-2rem)]';
