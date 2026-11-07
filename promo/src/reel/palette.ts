// The year's colors: picked from the October maple photo (src/data/maple.json,
// the app's image-palette engine against Stylecraft Special DK), warm first,
// so index 0 is the hottest range, like hero.json's.
import hero from '../data/hero.json';
import maple from '../data/maple.json';

export const PALETTE: string[] = maple.palette.map((c) => c.hex);
/** Where each color was picked in the photo (0..1 of the maple square) */
export const PICKS = maple.palette.map((c) => ({ x: c.x, y: c.y, hex: c.hex }));
/** Each day's color index */
export const ROWS: number[] = hero.days.map((d) => d.color);
/** Each day's high (°F) */
export const HIGHS: number[] = hero.days.map((d) => d.tmax ?? 0);
