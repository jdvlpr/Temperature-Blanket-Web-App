# v7 beta promo video

A motion-designed video (Remotion), separate from the app: its own `package.json` (npm), outside `pnpm check`, with generated data ignored by Prettier.

```bash
# 1. Data, from the app's own code (Open-Meteo, Auto ranges, image palette)
pnpm vitest run --config scripts/promo/vitest.config.ts   # from the app root

# 2. Preview and render (from promo/)
npm install
npm run studio                                   # scrub every scene
npx remotion still src/index.ts Hook out/frame.png --frame=140
npx remotion render src/index.ts MotionTest out/motion-test.mp4
npx remotion render src/index.ts Animatic45 out/animatic-45s.mp4             # the 45 s cut
npx remotion render src/index.ts Animatic45Debug out/animatic-45s-beats.mp4  # with a dot on every beat
```

## Timing

Every cut and cue is in beats of the music, never frames: `src/timing.ts` (`SCENES`, each scene's starting beat) over `src/data/beats.json` (the beat times, from `scripts/beats.py`: `python3 -m venv /tmp/beats-venv && /tmp/beats-venv/bin/pip install numpy`, then `/tmp/beats-venv/bin/python -I scripts/beats.py public/music.mp3`). The track's 0.8 s lead-in is cut (`MUSIC_START_FRAME`), so its first note lands at 0.12 s and the video opens on sound. A bar is 4 beats. The phase is a judgement call (the music moves in steady eighth notes, and from about 8 s the off-beat eighths are as strong as the beats); by ear the owner chose `shift: -0.5` (2026-11-06), which puts every cut half a beat before the detected grid. To go back, set `shift` in `beats.json` to 0 (not +0.5, which would shorten the end card's URL hold below 3 s). The song's own ending is spliced in under the end card (`TAIL` in `timing.ts`), so the music resolves at 42.7 s.

## Footage

Scenes with real UI wrap it in `FootageSlot name="<clip>.mp4"`: a drawn stand-in, tagged FOOTAGE, until `public/footage/<clip>.mp4` exists (gitignored); then the clip plays. The clips are recorded by `scripts/promo-video.ts` in the app (`pnpm dev:accounts` running, then `node scripts/promo-video.ts --base https://localhost:5173 [--only <clip>]`; frame sheets in `.svelte-kit/promo-footage/`). It builds the hero project through the planner, stops unless its colors and ranges match `src/data/hero.json`, and records each clip in a window of its slot's shape (or cropped to it), light only, with the telling moment in the first second or two. Update Weather is saved on a clock set to Nov 1, 2025 and checked on Dec 1, so it shows "Add 30 new days". A clip that should start later in its slot takes `start` on its `FootageSlot`. Clips waited for: `plan-location`, `plan-weather`, `plan-colors`, `plan-preview`, `update-weather`, `ravelry` (recorded with the owner), `more-sidebar`, `more-ranges`, `more-progress`, `more-edit-weather`.

- `src/data/`: generated (hero blanket: My Town 2025, Stylecraft Special DK; the photo palette; the gallery wall's generated blankets, from real weather, not real users' pages).
- `src/components/`: `Blanket` (knitted stripes), `KineticCaption`, `LogoMark`, `Backdrop`, `DeviceFrame` (laptop/phone, with a `lift` layer for controls that rise out of the screen), `FootageSlot`, `MockUI` (the stand-ins, and Ravelry's mark, unchanged).
- `src/scenes/`: one composition per beat; `src/Main45.tsx` puts them together with the music.
- `public/music.mp3`: "Baroque Coffee House" (YouTube Audio Library, no attribution required); gitignored, copied from `music/`.
- `out/`: renders (gitignored).

## Status (2026-11-06)

The review gates are styleframes → animatic → final.

- **Styleframes:** approved.
- **Animatic:** built (`Animatic45`); beat phase chosen (−0.5); now with real footage (`out/animatic-45s-footage.mp4`), waiting for the owner's review.

Open items, in order:

1. ~~**Beat phase.**~~ Done: the owner chose `shift: -0.5` (2026-11-06).
2. **UI footage.** Recorded (2026-11-06): every clip but `ravelry` (see Footage). `out/animatic-45s-footage.mp4` is the 45 s cut with them, for the owner's review.
3. **Ravelry clip.** Record it with the owner signed in and present.
4. **15 s teaser.** Needs its own shorter cuts (Hook, Photo, Gallery, End).
5. **Final polish and renders:** `out/v7-beta-45s.mp4`, `v7-beta-15s.mp4`, `.srt` files and a thumbnail.

Copy rules:

- No "New" labels; v7's features are improvements.
- Use Ravelry's mark only unchanged (`RavelryLumpy`).
- The PDF scene shows only pages the PDF really has.

## Instagram Reel: "A year, side to side" (2026-11-07)

A 1080×1920, ~39 s Reel in `src/reel/`, separate from the 45 s cut, in **cut paper**: flat layered pieces with slightly irregular edges, paper grain and soft shadows between layers (`parts/PaperKit.tsx`: `PaperDefs`, `Cut depth={1|2|3}`, `scallop`, `puff`, `cloud`, `rrect`, `Stitches`); no outlines, no hands (devices float on their own); no Ravelry. One wide world the camera glides across (`cameraX` in `src/reel/timing.ts`), with layers at different speeds: clouds, hills and trees (`Hills`), the scenes, the blanket knitting itself along the ground (hero.json's 365 days), the foreground ground (`Foreground`, which fills the bottom of the frame under Instagram's caption area), and leaves/snow/petals in front. Each layer's colors follow the season in view.

| Bars | Panel | v7 feature | Text |
|---|---|---|---|
| 0–9 | October: a phone photographs a maple, becomes Get Colors › From an Image (a dot on the photo and a Special DK swatch per color, one a beat, each color traveling from its dot to its swatch), and the swatches hop out, round into yarn balls and drop (bars 6.4–8 are slowed, see Timing) | Colors from a photo | Start with a / favorite fall day |
| 9–13 | A pin on the hero's town (shown as "My Town 2025"); the balls, wound into one, start the temperature line | — | — |
| 13–21 | Winter into spring along the blanket; "+31 days" tags each month | Check for Updates | Add new days / as your year goes on |
| 21–27 | Summer: phone and laptop show the same blanket, synced | Every device | On every device |
| 27–33 | Next fall: the blanket on an armchair, a mug, its gallery page "Updated" | Gallery pages you can update | Share it. / Update it anytime. |
| 33–43 | End card | — | Temperature Blanket · Try the next version / and share your feedback · next.temperature-blanket.com |

```bash
npx remotion render src/index.ts Reel out/reel/reel-35s.mp4
npx remotion render src/index.ts ReelDebug out/reel/reel-35s-beats.mp4   # a dot on every beat, big on each bar's first, and sound cues
npx remotion still src/index.ts Reel out/reel/sf-546.png --frame=546
```

- **Music:** "No.9 Esther's Waltz", Esther Abrami (`music/`, copied to `public/waltz.mp3`, gitignored). Check its license and whether it needs a credit before posting.
- **Timing:** in bars of 3 beats, from `src/data/waltz-beats.json` (`python3 -I scripts/waltz-beats.py public/waltz.mp3 40 src/data/waltz-beats.json`, numpy in a venv). Bar n starts on beat `3n + phase`. The downbeat is a judgement call (lows favor `phase: 0`, onsets `phase: 1`), and the tracker coasts through the first ~8 bars, so confirm by ear in `ReelDebug` and change `phase` (0, 1 or 2). The track's lead-in is cut (`musicStart`), and it fades out over bars 41–43. Panels count in story bars: `bar()` maps them to music bars through `toMusicBar`, which slows story bars 6.4–8 (the October colors' drop) to fill 2.6 music bars, so everything after plays one bar later, still on its downbeats.
- **Palette:** really from the October "photo": `ReelMaple` renders the maple to `../scripts/fixtures/maple.png`, and `pnpm vitest run --config scripts/promo/vitest.config.ts -t "reel palette"` (app root) runs the app's image-palette engine (Auto, Vivid, against Stylecraft Special DK) and its warm-to-cool sort, writing `src/data/maple.json`: Gingerbread, Poppy, Tomato, Spice, Dandelion, Citron, Cream, White, Nigella, Wisteria (picked again after the hills went periwinkle, 2026-11-07). The color dots land where the engine picked. The sort is a shortest path, so small changes to the maple's paint can reorder it; re-check the order after touching it.
- **Sound effects:** slots in `src/reel/sfx.ts` (and `tag-pop` on each month tag). Put `public/sfx/<name>.mp3` (gitignored) and it plays at its cue; missing files play nothing. Slots: `leaves-rustle`, `shutter`, `pick` (once per color, ten times), `yarn-drop`, `yarn-unspool`, `pin-drop`, `tag-pop`, `wind-winter`, `birds-spring`, `notification`, `mug-set`, `swoosh-soft`, `sparkle`, `logo-pop`. Keep them soft, well under the music; adjust `volume` per slot.
- **Instagram safe areas:** text stays out of the top 220 px, bottom 420 px and right 120 px (`SAFE` in `src/reel/theme.ts`); pictures fill the whole frame.
- **Status:** styleframes and the first animatic (`out/reel/`) for the owner's review; then the beat phase, sound effects and a final render.
