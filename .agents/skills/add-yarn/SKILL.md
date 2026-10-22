---
name: add-yarn
description: Add a new yarn to the Temperature Blanket database — scaffold the yarn files, replace the placeholder colorways with real ones (names + sampled hex colors), and add the changelog entry.
---

# Add Yarn

Adding a yarn has two parts:

1. **Scaffold** with `add-yarn.js` (offline, deterministic): creates the files, exports the yarn from its brand, adds a changelog entry, bumps the version and formats everything.
2. **Colorways** (you, following the recipe below): fetch the real colorway names and photos, sample a hex color for each, review them, and write them in.

Do both. A yarn left with the two placeholder colorways is not finished.

## 1. Scaffold

Provide: brand (a folder that already exists under `src/lib/data/yarns/`, e.g. `premier`), yarn name, source URL, and optionally weight.

```bash
node .agents/skills/add-yarn/scripts/add-yarn.js <brandName> <yarnName> <sourceHref> [weight] [--version x.y.z]
```

```bash
node .agents/skills/add-yarn/scripts/add-yarn.js premier "Cotton Fair Worsted" "https://www.premieryarns.com/collections/cotton/products/cotfairwor" worsted
```

What it does:

- Creates `src/lib/data/yarns/{brand}/{yarn-kebab}/yarn.ts` and `colorways.ts` (kebab-case folders, snake_case IDs). `colorways.ts` has two **placeholder** colorways (white, black).
- Adds the yarn to the brand's `yarns.ts` (and the brand to `brands.ts` if it's missing), alphabetically.
- Bumps `package.json` by one **minor** version (`6.3.2` → `6.4.0`) and adds a changelog note under the current year and month, as its own new item, linking to `/yarn-colorway-finder?f={brand_id}-{yarn_id}&v={version}`. It creates the month or year if they don't exist yet.
- Runs Prettier on the files it wrote.

Adding several yarns in one release: pass the same `--version` to the later runs (e.g. `--version 6.4.0`). That sets `package.json` to it and adds the note to the existing changelog item for that version instead of bumping again.

Weights: thread, cobweb, lace, light fingering, fingering, sport, dk, worsted, aran, bulky, super bulky, jumbo (short IDs `t c l lf f s d w a b sb j`).

The script never touches the network. **The colorway step below does: fetching the product page, its data feed and its photos is expected and allowed.**

## 2. Find the real colorways

Goal: for every colorway, a **name**, a **hex** color, and ideally a **`variant_href`** (a link straight to that colorway). Work through these in order and use the first that works. Keep notes on which you used, since it changes what you can trust.

**A. Shopify store (most yarn brands).** Look for `cdn.shopify.com` or `/products/` in the URL or page. Fetch `<store>/products/<handle>.js` (strip any `/collections/...` and query string). It returns JSON: `variants[]` with `id`, `title`, and `featured_image.src`. Then:

- name = variant `title`, minus any leading catalog number (`2178-01 White` → `White`)
- `variant_href` = `<product page URL>?variant=<id>`
- photo = `featured_image.src`; append `?width=400` to download a small version
- Check `variants.length` against the count the page claims ("30 shades"). If they differ (discontinued, bundle or sizes as options, a variant with no image), work out why before continuing.
- Multiple options (size and color)? Pick the option that is color. Be sure you don't have duplicates.

**B. Not Shopify.** Try, in order: JSON-LD (`<script type="application/ld+json">`), other embedded JSON (`__NEXT_DATA__`, `window.__INITIAL_STATE__`, a "variants" or "swatches" array), a swatch grid in the HTML (`<img alt="...">`, `data-color`, `title=` attributes), then a color-chart page or PDF. WebFetch/curl with a normal browser User-Agent; if the page needs JavaScript to render, use the Chrome tools to read it. If nothing gives per-color names and images, **stop and ask the user** instead of guessing.

**C. Where hex codes come from.** Order of trust:

1. The site publishes hex or RGB values (swatch `style="background:#..."`, a `hex` field): use them as given, no sampling needed.
2. A **swatch image** (a flat square of color): sample the center.
3. A **photo of the ball/skein**: sample a region of yarn (below). Lighting makes this approximate, especially for white/cream/black.
4. Only a photo of finished fabric or a lifestyle shot: don't use it. Ask the user.

## 3. Sample colors from photos

The helper is macOS-only (CoreGraphics), no dependencies:

```bash
# 1. Download the photos (parallel is fine) into <workdir>/img/, where <workdir> is .dev/yarn-work/<brand>-<yarn>/ (create it; it's gitignored)
# 2. Write manifest.json next to it: [{ "name": "White", "image": "img/01.jpg", "variant_href": "..." }, ...]
# 3. Sample + build the contact sheet
swift .agents/skills/add-yarn/scripts/sample-swatches.swift <workdir>/manifest.json <workdir>/sheet [--box x,y,w,h]
open <workdir>/sheet/contact-sheet.html
```

`<workdir>` (`.dev/yarn-work/<brand>-<yarn>/`) holds the downloaded photos, the manifest and the contact sheet. It's for local review only: `.dev` is gitignored, so **never commit anything from it**. Tell the user the full path of `contact-sheet.html` when it's ready.

**Pick the sampling box by looking at one photo first** (open it with the image Read tool). The box is a fraction (0–1) of the photo: `x,y,w,h`. The default (`0.125,0.4125,0.1875,0.175`) suits a ball photographed head-on with the label in the middle: it takes the left skein, in from the edges and clear of the label. Choose the box to sit **inside the yarn, away from the photo edges, labels, background, cast shadow and highlights**, in an area that's representative of the whole color. If the brand's photos are framed differently (single skein, hank, cone, angled), choose a different box. Don't assume the default.

The helper averages the middle of the luminance range in the box (drops the darkest 20% — gaps between strands and shadow — and the brightest 5% — highlights) and writes `colors.json` plus `contact-sheet.html` (each photo with the box drawn on it, the sampled swatch beside it, and a "current" swatch if the manifest has a `hex`).

**Review the contact sheet. Do not skip this, and look at all of them, not a few.** For each colorway, check that the box is on yarn (not label, edge or background), that the swatch looks like the photo, and that similar shades (e.g. the blues) are distinguishable from each other and in the right order of light-to-dark. Re-run with a different `--box` if needed; if one photo needs special handling, you can set that hex by hand in `colors.json` (and say you did). If the photos are not shot consistently, check more carefully, not less.

Known limits to mention to the user when you report: hex values from photos are approximations. Light shades (white, cream) reflect the lighting in the photo, and very dark ones lose detail.

## 4. Write the colorways

```bash
node .agents/skills/add-yarn/scripts/write-colorways.js <brand> <yarn-folder> <workdir>/sheet/colors.json "<sourceHref>"
```

This replaces the placeholders in `colorways.ts` (with `source` and today's `accessed` date, `variant_href` where you have it), sets the real count in the changelog note, and runs Prettier. Colorway objects look like `{ hex, variant_href?, name }`; see `src/lib/data/yarns/premier/cotton-fair-worsted/colorways.ts` for a real example.

If the brand has multiple distinct product pages for one yarn (e.g. different sizes or color sets), use a separate `{ source, colors }` group for each page. Keep the group order the site uses.

## 5. Finish

- Confirm the changelog item reads right (version, link, `N colorways`) and that the version in `package.json` matches.
- Run the formatter/type check the project normally uses and the relevant tests, and report anything that fails, including failures that were already there.
- If you can, look at the yarn in the app (`/yarn-colorway-finder`) to confirm it appears.
- Tell the user: which source you used for names and for hex codes (published values or sampled from photos), the sampling box, anything you adjusted by hand, and any colorways you are unsure of.

## Troubleshooting

- **Brand directory doesn't exist:** create `src/lib/data/yarns/{brand}/` with a `yarns.ts` (`export const brand: Brand = { name, id, yarns: [] }`); the script then wires it into `brands.ts`.
- **Yarn directory already exists:** remove it or pick a different yarn name.
- **Alphabetical order looks off:** re-check imports and the `yarns` array in the brand's `yarns.ts` by hand.
- **Changelog note not found by `write-colorways.js`:** it looks for the `f={brand_id}-{yarn_id}` link the scaffold wrote; if you edited that, update the count manually.
