// The Reel's clock, in bars of the waltz (3 beats a bar), from
// src/data/waltz-beats.json (scripts/waltz-beats.py). Bar n starts on beat
// 3n + phase; `phase` is chosen by ear with the ReelDebug composition.
import { Easing } from 'remotion';
import data from '../data/waltz-beats.json';
import { lerp } from '../components/anim';

export const FPS = 30;
const B: number[] = data.beats;
/** Song seconds before video frame 0 (the track's lead-in is cut) */
export const MUSIC_START = data.musicStart;
export const MUSIC_START_FRAME = Math.round(MUSIC_START * FPS);

/** Video seconds at beat k (fractional ok; extrapolated past the list) */
const beatTime = (k: number): number => {
  const n = B.length;
  const t =
    k <= 0
      ? B[0] + k * (B[1] - B[0])
      : k >= n - 1
        ? B[n - 1] + (k - (n - 1)) * (B[n - 1] - B[n - 2])
        : B[Math.floor(k)] +
          (k - Math.floor(k)) * (B[Math.floor(k) + 1] - B[Math.floor(k)]);
  return t - MUSIC_START;
};

/** Frame at beat k of the music (counted from bar 0's downbeat) */
export const beatFrame = (k: number) => beatTime(k + data.phase) * FPS;

/**
 * Story bars → music bars. The October colors' drop (story bars 6.4–8) is
 * slowed to fill 2.6 music bars, so everything after it plays one whole bar
 * later and still lands on its downbeat. Panels count in story bars.
 */
const STRETCH = { from: 6.4, to: 8, by: 1 };
export const toMusicBar = (n: number) => {
  const { from, to, by } = STRETCH;
  if (n <= from) return n;
  if (n >= to) return n + by;
  return from + ((n - from) * (to - from + by)) / (to - from);
};

/** Frame at story bar n (fractional bars are thirds of beats apart) */
export const bar = (n: number) => beatFrame(toMusicBar(n) * 3);

/** The fractional bar at frame f */
export const barAt = (f: number) => {
  let lo = -2;
  let hi = 60;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (bar(mid) <= f) lo = mid;
    else hi = mid;
  }
  return lo;
};

export const BARS = 43;
export const TOTAL = Math.round(bar(BARS)) + 6;

/** A 0..1 waltz lilt: a lift on each bar's downbeat, easing out over the bar */
export const lilt = (f: number) => {
  const b = toMusicBar(barAt(f));
  const t = b - Math.floor(b);
  return b < 0 ? 0 : Math.exp(-t * 4);
};

// ---- The world: one wide strip the camera glides along ----

/** Where the camera's left edge is at each bar (holds between, eased glides) */
const CAMERA: { at: number; x: number; ease?: (t: number) => number }[] = [
  { at: 0, x: 0 },
  { at: 8, x: 0 },
  { at: 9.25, x: 1080 },
  { at: 12.5, x: 1080 },
  // One long side-scroll through winter into spring, then into summer
  { at: 21.25, x: 4560, ease: Easing.inOut(Easing.sin) },
  { at: 26, x: 4560 },
  { at: 27.25, x: 6120 },
  { at: 32, x: 6120 },
  // The end card, with the finished blanket's end and the last of the yarn
  { at: 33.25, x: 7300 },
];

export const cameraX = (f: number) => {
  const b = barAt(f);
  if (b <= CAMERA[0].at) return CAMERA[0].x;
  for (let i = 1; i < CAMERA.length; i++) {
    const a = CAMERA[i - 1];
    const c = CAMERA[i];
    if (b <= c.at) {
      const t = (b - a.at) / (c.at - a.at);
      const e = (c.ease ?? Easing.inOut(Easing.cubic))(t);
      return lerp(a.x, c.x, e);
    }
  }
  return CAMERA[CAMERA.length - 1].x;
};

/** Panels' left edges in the world */
export const PANEL = {
  october: 0,
  stitches: 1080,
  seasons: 2160,
  summer: 4560,
  nextFall: 6120,
  end: 7300,
};
export const WORLD_W = 8640;

// ---- The ground blanket: the year's days, left to right along the world ----

export const DAYS = 365;
export const GROUND = { x0: 1080, dayW: 18, top: 1330, bottom: 1500 };
export const dayX = (i: number) => GROUND.x0 + i * GROUND.dayW;
/** The temperature line's band, above the ground */
export const LINE = { top: 1110, bottom: 1300 };

/** How many days are knit by frame f (the yarn ball's head) */
const HEAD: [number, number][] = [
  [9.5, 0],
  [12.5, 45],
  [21.25, 236],
  [26, 252],
  [27.25, 322],
  [32, 352],
  [33.25, 365],
];
export const headDay = (f: number) => {
  const b = barAt(f);
  if (b <= HEAD[0][0]) return 0;
  for (let i = 1; i < HEAD.length; i++) {
    const [a, da] = HEAD[i - 1];
    const [c, dc] = HEAD[i];
    if (b <= c) {
      const t = (b - a) / (c - a);
      return lerp(da, dc, Easing.inOut(Easing.quad)(t));
    }
  }
  return DAYS;
};

// ---- Seasons by world x: weights for autumn, winter, spring, summer ----

export type Season = { autumn: number; winter: number; spring: number; summer: number };
const SEASON_AT: [number, keyof Season][] = [
  [1100, 'autumn'],
  [1900, 'winter'],
  [2900, 'winter'],
  [3600, 'spring'],
  [4300, 'spring'],
  [4900, 'summer'],
  [5800, 'summer'],
  [6400, 'autumn'],
];
export const seasonAt = (x: number): Season => {
  const s: Season = { autumn: 0, winter: 0, spring: 0, summer: 0 };
  if (x <= SEASON_AT[0][0]) {
    s[SEASON_AT[0][1]] = 1;
    return s;
  }
  for (let i = 1; i < SEASON_AT.length; i++) {
    const [a, ka] = SEASON_AT[i - 1];
    const [c, kc] = SEASON_AT[i];
    if (x <= c) {
      const t = (x - a) / (c - a);
      s[ka] += 1 - t;
      s[kc] += t;
      return s;
    }
  }
  s[SEASON_AT[SEASON_AT.length - 1][1]] = 1;
  return s;
};
