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

Every cut and cue is in beats of the music, never frames: `src/timing.ts` (`SCENES`, each scene's starting beat) over `src/data/beats.json` (the beat times, from `scripts/beats.py`: `python3 -m venv /tmp/beats-venv && /tmp/beats-venv/bin/pip install numpy`, then `/tmp/beats-venv/bin/python -I scripts/beats.py public/music.mp3`). Beat 0 is the music's first note, a downbeat; the track's 0.8 s lead-in is cut (`MUSIC_START_FRAME`), so that note lands at 0.12 s and the video opens on sound. A bar is 4 beats. The phase is a judgement call (the music moves in steady eighth notes, and from about 8 s the off-beat eighths are as strong as the beats), so it's checked by ear: `out/animatic-45s-beats-alt.mp4` is the same cut at `shift: -0.5`. To switch, set `shift` in `beats.json` to −0.5 (half a beat earlier), not +0.5, which would shorten the end card's URL hold below 3 s. The song's own ending is spliced in under the end card (`TAIL` in `timing.ts`), so the music resolves at 43.0 s.

## Footage

Scenes with real UI wrap it in `FootageSlot name="<clip>.mp4"`: a drawn stand-in, tagged FOOTAGE, until `public/footage/<clip>.mp4` exists (gitignored); then the clip plays. Clips waited for: `plan-location`, `plan-weather`, `plan-colors`, `plan-preview`, `update-weather`, `ravelry` (recorded with the owner), `more-sidebar`, `more-ranges`, `more-progress`, `more-edit-weather`.

- `src/data/`: generated (hero blanket: Minneapolis 2025, Stylecraft Special DK; the photo palette; the gallery wall's generated blankets, from real weather, not real users' pages).
- `src/components/`: `Blanket` (knitted stripes), `KineticCaption`, `LogoMark`, `Backdrop`, `DeviceFrame` (laptop/phone, with a `lift` layer for controls that rise out of the screen), `FootageSlot`, `MockUI` (the stand-ins, and Ravelry's mark, unchanged).
- `src/scenes/`: one composition per beat; `src/Main45.tsx` puts them together with the music.
- `public/music.mp3`: "Baroque Coffee House" (YouTube Audio Library, no attribution required); gitignored, copied from `music/`.
- `out/`: renders (gitignored).

## Status (2026-11-05)

The review gates are styleframes → animatic → final.

- **Styleframes:** approved.
- **Animatic:** built (`Animatic45`) and waiting for the owner's review.

Open items, in order:

1. **Beat phase.** Get the owner's ear check: `out/animatic-45s-beats.mp4` (`shift: 0`) vs `out/animatic-45s-beats-alt.mp4` (`shift: -0.5`). Set `shift` in `src/data/beats.json` to the one that sounds right.
2. **UI footage.** Write `scripts/promo-video.ts` in the app, reusing `scripts/docs-screenshots.ts`'s recorder helpers (exported, not copied).
   - Record at 1280×720 @2× against `pnpm dev:accounts`, with `timezoneId: 'America/Chicago'` so the days match the exported data.
   - Load the same project: Minneapolis, 2025, Open-Meteo, imperial, 10 Stylecraft Special DK colors, Auto ranges.
   - Save each clip to `public/footage/<clip>.mp4`, using the names listed under Footage above.
3. **Ravelry clip.** Record it with the owner signed in and present.
4. **15 s teaser.** Needs its own shorter cuts (Hook, Photo, Gallery, End).
5. **Final polish and renders:** `out/v7-beta-45s.mp4`, `v7-beta-15s.mp4`, `.srt` files and a thumbnail.

Copy rules:

- No "New" labels; v7's features are improvements.
- Use Ravelry's mark only unchanged (`RavelryLumpy`).
- The PDF scene shows only pages the PDF really has.
