---
name: docs-clips
description: Make, re-record or fix the short looping video clips in Guides & Help (DocsClip) — e.g. "add a clip/animation/video of X to the guide", "re-record the docs clips", "the clip is wrong/stale". Recorded with Playwright by scripts/docs-screenshots.ts (CLIPS) and checked with its contact sheets.
---

# Docs clips

Short, silent, looping clips that show a step in a guide (`/documentation/guides/*`) or reference page. They sit beside the still screenshots (`DocsShot`) and are made by the same script, so they can be re-recorded whenever the UI changes.

- Component: `src/lib/components/docs/DocsClip.svelte` — `<DocsClip src="<page>/<clip>" alt="…" caption="…" />`. It plays muted on a loop while in view, has a Pause/Play button, waits on its poster with Reduce Motion on, and loads only the shown theme, only when near.
- Files: `static/images/docs/<page>/<clip>-{light,dark}.mp4`, plus `-{light,dark}.jpg` posters (the first frame). Their size goes into `src/lib/docs/docs-shots.json`, which both `DocsShot` and `DocsClip` read; `src` is typed by its keys.
- Recorder: `scripts/docs-screenshots.ts`, the `CLIPS` array and `record()`. It uses Chrome's screencast at 2× (a separate browser launched with `--force-device-scale-factor=2`, because without it the frames are 1×), draws a cursor (headless Chrome has none), and encodes with ffmpeg (`libx264`, CRF 26, 30 fps). **ffmpeg must be on the PATH.**
- Window: `CLIP_VIEWPORT`, 800×720 CSS px. That's below `lg`, so there's no sidebar, and about a guide's text width, so text shows near its real size.

## Adding a clip

1. **Plan it like a guide step:** one task, 8–16 s, starting from where the reader is (e.g. the Weather step's table) and ending on the result (a toast, a changed value). Before writing alt text, check the real labels in the component's markup.
2. **Add an entry to `CLIPS`:**

   ```ts
   {
     name: '<guide-slug>/<what-it-shows>',
     open: async (page) => { /* get to the first frame; not recorded */ },
     play: async (page) => { /* what's recorded */ },
   },
   ```

   Reuse the helpers in the script:
   - `planner(page, section, project?)` — the planner with London 2025's weather, at a step
   - `weatherTable(page)` — the Weather step with the table's first rows in view
   - `editWeather(page, date, param)` — Edit Weather Data opened on one value
   - `value(page, '2025-01-03', 'High')` — a value in the Weather step's table
   - `cell(page, row, column)` — a cell in the open dialog's grid
   - `dialog(page)` and `menu(page)` — the open dialog or menu
   - `moveTo(page, locator, ms)` — an eased, visible cursor move
   - `clickOn(page, locator, ms)` — move there, check again where the target is, then press with a visible ring
   - `page.keyboard.type(text, { delay: 180 })` — typing slow enough to read
   - `keepAt(page, locator, top)` — scroll until something stays put at `top` px (the page often scrolls back once)
   - `visit(page, path)` — any page, without the analytics question
   - `signIn(page)` — a new account signed in with an emailed code (needs the dev server, or `wrangler pages dev` on an accounts build); then `saveProject(page)` saves the planner's project to it
   - `dismissToasts(page)` — clears toasts off the frame

   Keep targets in the 800×720 window: `clickOn` doesn't scroll, so a row below the fold (like the Project panel's Share group) gets a click on nothing. Prefer a control already in view (the preview's own Share menu).

   Put pauses (`page.waitForTimeout`) after each action, so a reader can follow it. `record()` already holds 1 s on the first frame and 1.8 s on the last.

3. **Record it against the dev server** (usually running; see memory) or a preview build:
   ```bash
   node scripts/docs-screenshots.ts --base https://t-macbook-pro.tail54df88.ts.net:5173 --only <guide-slug>/<what-it-shows>
   ```
   Use `--only` always: without it the script re-takes every shot and clip.
4. **Check it** by reading the contact sheets: `.svelte-kit/docs-clips/<name>-light.png` and `-dark.png`, one frame a second. Look for:
   - the cursor landing on the right thing
   - the action actually happening
   - nothing cut off at the edges
   - no stray toasts or menus

   For a closer look at one moment: `ffmpeg -v error -y -ss <seconds> -i static/images/docs/<name>-light.mp4 -frames:v 1 -vf scale=800:-1 <scratchpad>/frame.png`.

5. **Use it on the page:** import `DocsClip`, put it after the steps it shows, and give it:
   - `alt` text describing the motion in order (what's pressed, what's typed, what changes, how it ends)
   - a short `caption`

   Make sure the alt text matches what the sheet shows, not what you meant to record.

6. **Run the checks** for what changed: `npx prettier --check`, `npx eslint` on the touched files, and `pnpm check` if a page or component changed.

## Pitfalls already met

- **The page scrolls back after you scroll it.** Changing step, or the chart laying out late, resets the scroll. `weatherTable()` scrolls again until the table stays put; copy that loop for other scroll targets.
- **A target moves between measuring and clicking.** `clickOn` checks where it is again before pressing. If a click "does nothing", read `.svelte-kit/docs-screenshot-failed.png`, which is written whenever `open` or `play` fails.
- **Dragging near a grid's edge scrolls it**, so a drag can take in one more row than aimed. Either keep away from the edge or describe what actually happens.
- **Role names differ by table.** The Weather step's table is `role="table"`; Edit Weather Data's is `role="grid"` with `gridcell`s.
- **Toolbar labels change.** The weather source button is "Source: <name>", not "Weather Source". When a selector times out, check the current labels in the component first.
- **Live weather lookups are sometimes slow.** One failed run isn't proof of a bug; run it again before changing the code.

## Size and hosting

A clip is about 0.5–0.7 MB per theme, and a poster about 0.2 MB. They're static assets on the Worker (no `run_worker_first`), so they cost no Worker requests or bandwidth. Keep clips short and silent; anything long or narrated belongs on YouTube, in the guide's `video` field in `docs-index.ts`.

## Re-recording before launch

Docs shots are re-taken just before launch, not during development (see memory), and the clips go with them. They're kept as committed files, so a UI change only makes them stale. The script re-records them in the same run as the shots.
