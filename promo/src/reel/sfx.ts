// Sound-effect slots: drop public/sfx/<name>.mp3 in and it plays at its bar
// (a missing file plays nothing). Soft, close sounds, well under the music.
// The October picks and yarn drops follow panels/October.tsx (PICK_BARS, FLY).
import { FLY_BAR, PICK_BARS } from './panels/October';

export type Sfx = { name: string; at: number; volume: number };

export const SFX: Sfx[] = [
  { name: 'leaves-rustle', at: 0.3, volume: 0.25 },
  { name: 'shutter', at: 2, volume: 0.35 },
  ...PICK_BARS.map((at) => ({ name: 'pick', at, volume: 0.29 })),
  { name: 'yarn-drop', at: FLY_BAR + 0.3, volume: 0.32 },
  { name: 'yarn-unspool', at: 8.1, volume: 0.42 },
  { name: 'pin-drop', at: 9.4, volume: 0.45 },
  { name: 'wind-winter', at: 12.5, volume: 0.3 },
  { name: 'birds-spring', at: 16.5, volume: 0.14 },
  { name: 'notification', at: 22.8, volume: 0.1 },
  { name: 'mug-set', at: 28.5, volume: 0.07 },
  { name: 'swoosh-soft', at: 29.5, volume: 0.08 },
  { name: 'sparkle', at: 30.6, volume: 0.08 },
  { name: 'logo-pop', at: 33.5, volume: 0.3 },
];
// "+N days" tags pop as the knitting reaches each month (see MonthTags); their
// sound is the `tag-pop` slot, placed from the same frames in Reel.tsx.
