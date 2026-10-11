/** A menu item's look, shared by the app's Sort, View and "more" menus */
export const menuItemClass =
  'data-highlighted:bg-surface-200-800 flex items-center justify-start gap-2 text-left whitespace-normal data-highlighted:text-inherit data-disabled:opacity-50';

/** A Sort or View menu's button, shared so they sit side by side alike */
export const menuTriggerClass = 'btn hover:preset-tonal-surface';

type Placement =
  `${'top' | 'bottom' | 'left' | 'right'}${'' | '-start' | '-end'}`;

/**
 * The room a menu has: the screen below the sticky bar on top of it (the open
 * dialog's, or else the app's header, each marked `data-sticky-bar`), so a
 * menu never runs under that bar
 */
function belowStickyBar() {
  const bars = document.querySelectorAll<HTMLElement>('[data-sticky-bar]');
  const bar = [...bars].find((el) => el.closest('[role="dialog"]')) ?? bars[0];
  const top = Math.max(0, bar?.getBoundingClientRect().bottom ?? 0);
  const { clientWidth, clientHeight } = document.documentElement;
  return { x: 0, y: top, width: clientWidth, height: clientHeight - top };
}

/**
 * Every menu's positioning: a tall menu fits the room beside its button (with
 * menuContentClass, it scrolls) rather than running off the screen or under
 * a sticky bar
 */
export const menuPositioning = (
  placement: Placement,
  extra: Record<string, unknown> = {},
) => ({
  placement,
  fitViewport: true,
  boundary: belowStickyBar,
  ...extra,
});

/** The menu panel itself. With menuPositioning, a tall menu fits the room
 * beside its button and scrolls (the height is unlimited without it) */
export const menuContentClass =
  'bg-surface-100-900 z-9999 max-w-[calc(100vw-2rem)] max-h-(--available-height) overflow-y-auto';
