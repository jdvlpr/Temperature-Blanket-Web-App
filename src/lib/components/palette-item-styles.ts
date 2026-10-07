/** A palette's colors as cards (View › Grid), shared by the palette editor and the read-only view */
export const paletteGridClass =
  'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4';

/** A palette's colors as rows (View › List); the end rows round their own corners, so nothing is clipped */
export const paletteListClass =
  'rounded-container border-surface-200-800 bg-surface-50-950 flex flex-col border';

/** One color's card in the grid */
export const paletteCardClass =
  'card border-surface-200-800 bg-surface-50-950 flex min-w-0 flex-col border';

/** One color's row in the list */
export const paletteRowClass =
  'bg-surface-50-950 border-surface-200-800 first:rounded-t-container last:rounded-b-container @container border-b last:border-b-0';
