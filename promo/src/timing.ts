// Every cut and cue in the animatic, in beats of the music (src/data/beats.json).
// Beat 0 is the music's first note, a downbeat, right at the start of the
// video (MUSIC_START_FRAME); a bar is 4 beats. Change a
// scene's length here (in beats) and everything after it moves with it.
import beatsData from './data/beats.json';
import { FPS } from './brand';

const BEATS: number[] = beatsData.beats;
export const BEAT_COUNT = BEATS.length;

/**
 * The song's own lead-in before its first note is cut, so the video opens on
 * sound: the music starts this many frames into the track (the first note then
 * lands about 3 frames in, its attack intact).
 */
export const MUSIC_START_FRAME = Math.floor((BEATS[0] - 0.1) * FPS);
const MUSIC_START = MUSIC_START_FRAME / FPS;

/** Video seconds at beat `b` (fractional beats interpolate; past the list, extrapolate) */
export const beatTime = (b: number): number => songTime(b) - MUSIC_START;

/** Song seconds at beat `b` */
const songTime = (b: number): number => {
  const x = b + beatsData.shift;
  const n = BEATS.length;
  if (x <= 0) return BEATS[0] + x * (BEATS[1] - BEATS[0]);
  if (x >= n - 1)
    return BEATS[n - 1] + (x - (n - 1)) * (BEATS[n - 1] - BEATS[n - 2]);
  const i = Math.floor(x);
  return BEATS[i] + (x - i) * (BEATS[i + 1] - BEATS[i]);
};

/** The video frame at beat `b` */
export const beatFrame = (b: number): number => Math.round(beatTime(b) * FPS);

export const TOTAL = 45 * FPS;

export type SceneId =
  | 'hook'
  | 'plan'
  | 'photo'
  | 'newDays'
  | 'sync'
  | 'gallery'
  | 'ravelry'
  | 'pdf'
  | 'more'
  | 'end';

/**
 * The 45 s cut. `beat`: where the scene starts (the hook starts at frame 0,
 * before the first note). Cuts are on downbeats (multiples of 4) or half bars.
 * Storyboard seconds for comparison are in the plan.
 */
export const SCENES: { id: SceneId; beat: number; caption: string }[] = [
  { id: 'hook', beat: 0, caption: 'A year of weather. Knit together.' },
  {
    id: 'plan',
    beat: 8,
    caption: 'Pick a place. Get its weather. Choose colors.',
  },
  { id: 'photo', beat: 16, caption: 'Your photo. Your yarn colors.' },
  { id: 'newDays', beat: 24, caption: 'Add new days as your year goes on.' },
  { id: 'sync', beat: 30, caption: 'Your projects, on every device.' },
  { id: 'gallery', beat: 36, caption: 'Share it. Update it anytime.' },
  { id: 'ravelry', beat: 44, caption: 'Post to Ravelry in one step.' },
  { id: 'pdf', beat: 50, caption: 'A redesigned PDF printout.' },
  { id: 'more', beat: 56, caption: '…and so much more.' },
  { id: 'end', beat: 60, caption: 'Try the v7 beta' },
];

/** Each scene's first frame, length in frames, and first beat */
export const sceneSpans = () =>
  SCENES.map((s, i) => {
    const from = i === 0 ? 0 : beatFrame(s.beat);
    const next = SCENES[i + 1];
    const to = next ? beatFrame(next.beat) : TOTAL;
    return { ...s, from, dur: to - from };
  });

/**
 * Cues inside a scene: frames from the scene's start to its n-th beat.
 * Scenes take this as `cue`, so their motion follows the music too.
 */
export type Cue = (n: number) => number;
export const cueFor =
  (startBeat: number, from: number): Cue =>
  (n) =>
    beatFrame(startBeat + n) - from;

/** A steady cue for scenes rendered on their own (about 96 BPM from frame 0) */
export const steadyCue: Cue = (n) => Math.round(n * 18.9);

// The music's ending: its final cadence is spliced in under the end card so
// the piece resolves. The tail starts 8 of its beats before the final hit,
// at the end card's first downbeat.
export const TAIL = {
  /** Song seconds where the spliced tail starts */
  start: beatsData.tail.finalHit - 8 * beatsData.tail.period,
  /** Video beat where it comes in */
  atBeat: 60,
};
