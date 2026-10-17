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

// For rows that run edge to edge inside a rounded list with overflow-hidden.
// The browser's focus outline is drawn outside the element, so the list cuts
// it off. This draws it inside the row instead.
export const ROW_FOCUS =
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500';

// A palette or project as a card, wherever they're listed: a raised box. Its
// colors or picture take rounded-*-nested corners, so they follow the box's,
// less its padding. CARD_HOVER steps it darker, when it opens something (and
// its buttons' hovers a step further, card-hover in main.css).
export const CARD_BOX =
  'bg-surface-100 dark:bg-surface-900 rounded-container card-border p-2';
export const CARD_HOVER =
  'card-hover hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors';

// For the list itself: its first row rounds its top corners and its last row
// its bottom ones, like the list does, so a focused row's ring follows the
// list's shape. Rows can be the list's children or sit in its <li>s.
export const LIST_ENDS =
  '[&>:first-child]:rounded-t-container [&>:last-child]:rounded-b-container [&>li:first-child>*]:rounded-t-container [&>li:last-child>*]:rounded-b-container';

// The Project menu's lists and their rows, shared by the screens it opens.
// A row's trailing icon says where it goes: a chevron opens a screen in the
// panel, an external-link icon opens a new tab, and none acts in place (or
// goes to another page in this tab, as My Projects: it lists this project
// too, which shouldn't be open in two tabs).
export const PANEL_LIST = `bg-surface-100 dark:bg-surface-900 rounded-container card-border divide-surface-200-800 flex flex-col divide-y overflow-hidden ${LIST_ENDS}`;
export const PANEL_ROW = `hover:bg-surface-200-800 flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left transition-colors ${ROW_FOCUS}`;

// A Skeleton field group drawn as one field: a single border around the icon,
// input and buttons (its children drop their own), in the theme's roundness.
// Drawn as an outline, which paints over the children's backgrounds (an inset
// ring would sit under them).
// The border thickens in the primary color while anything inside has focus,
// since the input inside no longer shows its own focus ring. While its field is
// disabled the whole group fades, not just the field (whose own fade is undone
// so it isn't faded twice).
export const FIELD_GROUP =
  'field-group gap-0 [&>.label:first-child]:pr-0! overflow-hidden rounded-base bg-surface-50-950 outline-1 -outline-offset-1 outline-surface-300-700 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary-500 *:rounded-none! *:[box-shadow:none]! has-[>.input:disabled]:cursor-not-allowed has-[>.input:disabled]:opacity-50 has-[>.input:disabled]:*:opacity-100!';

// An icon at the start of a select (or any field), as far in as a field
// group's icon cell puts its icon. The select needs pl-11, so its text starts
// where a field group's does. Inside a `relative flex items-center` wrapper.
export const FIELD_ICON = 'pointer-events-none absolute left-3';

// A row of small text links that wraps, spaced apart with no separators (a dot
// would dangle at the end of a wrapped line): the sidebar's footer links and
// the Project menu's Help links.
export const SMALL_LINKS = 'flex flex-wrap gap-x-4 gap-y-2 text-sm';
export const SMALL_LINK = 'hover:underline opacity-80 hover:opacity-100';

/** Palettes as rows (List view): two side by side on large screens, so the
 * colors beside each name don't sit in a mostly empty row */
export const PALETTE_LIST =
  'grid grid-cols-1 items-start gap-x-6 gap-y-6 lg:grid-cols-2';

/** A switcher pinned to the bottom of the screen on small screens, in thumb
 * reach, with the content scrolling behind it: a dialog's sources on
 * phones, and Projects | Yarn Palettes (CollectionNav) below lg */
export const BOTTOM_BAR =
  'bg-surface-50/90 dark:bg-surface-950/90 border-surface-200-800 border-t px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur';
