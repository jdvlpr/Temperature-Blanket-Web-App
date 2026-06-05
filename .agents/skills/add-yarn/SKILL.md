---
name: add-yarn
description: Add a new yarn to the Temperature Blanket database, creating yarn structure and updating changelog. Use when adding a new yarn product to a brand's collection or creating a new brand.
---

# Add Yarn

Automate the process of adding a new yarn to the yarn database. Creates the complete directory structure, initializes yarn and colorways files with placeholder data, and updates the changelog.

## Quick start

1. Provide the following information:
   - Brand name (e.g., `caron`, `cascade`)
   - Yarn name (e.g., `Simply Soft Solids`)
   - Source URL
   - Weight *(optional)* (e.g., `worsted`, `dk`, `lace`, or `w`, `d`, `l`)

2. Run the script from the project root:

```bash
node .agents/skills/add-yarn/scripts/add-yarn.js <brandName> <yarnName> <sourceHref> [weight]
```

**Example:**
```bash
node .agents/skills/add-yarn/scripts/add-yarn.js caron "Simply Soft Solids" "https://www.joann.com/caron-simply-soft-yarn/prd23209.html" worsted
```

The script automatically:

1. Creates the yarn directory under `src/lib/data/yarns/{brand}/`
2. Generates `yarn.ts` with metadata (using snake_case for IDs)
3. Generates `colorways.ts` with two placeholder colorways (colors: white and black)
4. Updates the brand's `yarns.ts` to export the new yarn (maintains alphabetical order)
5. Updates the main `src/lib/data/yarns/brands.ts` if this is the first yarn for a new brand (maintains alphabetical order)
6. Adds a changelog entry for the current month/year

## What gets created

```
src/lib/data/yarns/{brand}/{yarn-directory}/
├── yarn.ts          # Yarn metadata
├── colorways.ts     # Placeholder colorways (2 colors)
```

**Placeholder colorways** (to be updated later):

- Color 1: White (#f2f2f2)
- Color 2: Black (#000000)

**Note:** All IDs are in `snake_case` format.

## Supported weights

Full names: thread, cobweb, lace, light fingering, fingering, sport, dk, worsted, aran, bulky, super bulky, jumbo

Short IDs: t, c, l, lf, f, s, d, w, a, b, sb, j

## Next steps after adding

- Update `colorways.ts` with actual colorway data
- Update the changelog entry version if needed
- Verify the yarn appears in the application UI

## Troubleshooting

- **Brand directory doesn't exist**: Create the brand directory first under `src/lib/data/yarns/`
- **Yarn directory already exists**: Remove it or choose a different yarn name
- **Script fails to update files**: Ensure the file paths haven't changed from the expected structure
- **Alphabetical order incorrect**: Check that the script processed imports and exports correctly
