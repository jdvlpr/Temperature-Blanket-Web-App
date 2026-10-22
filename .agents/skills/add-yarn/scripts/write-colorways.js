#!/usr/bin/env node

// Replace a yarn's placeholder colorways with real ones and fix the changelog count.
//
// Usage (from the project root):
//   node .agents/skills/add-yarn/scripts/write-colorways.js <brand> <yarn> <colors.json> <sourceHref>
//
//   brand, yarn: the folder names under src/lib/data/yarns (e.g. premier cotton-fair-worsted)
//   colors.json: [{ "name": "White", "hex": "#eeeef0", "variant_href": "https://..." }, ...]
//                (variant_href is optional)
//   sourceHref:  the page the colorways came from

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const [, , brandDir, yarnDir, colorsFile, sourceHref] = process.argv;
if (!brandDir || !yarnDir || !colorsFile || !sourceHref) {
  console.error(
    '❌ Usage: node write-colorways.js <brand> <yarn> <colors.json> <sourceHref>',
  );
  process.exit(1);
}

const root = process.cwd();
const yarnPath = path.join(root, 'src/lib/data/yarns', brandDir, yarnDir);
if (!fs.existsSync(path.join(yarnPath, 'yarn.ts'))) {
  console.error(`❌ Yarn not found: ${yarnPath} (run add-yarn.js first)`);
  process.exit(1);
}

const colors = JSON.parse(fs.readFileSync(colorsFile, 'utf-8'));
const bad = colors.filter(
  (c) => !c.name || !/^#[0-9a-f]{6}$/i.test(c.hex ?? ''),
);
if (colors.length === 0 || bad.length) {
  console.error(
    `❌ Every color needs a name and a 6-digit hex (${bad.length} invalid)`,
  );
  process.exit(1);
}

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
let domain = 'TODO';
try {
  domain = new URL(sourceHref).hostname.replace(/^www\./, '');
} catch {}

const colorEntries = colors
  .map(
    (c) => `      {
        hex: ${q(c.hex.toLowerCase())},${
          c.variant_href ? `\n        variant_href: ${q(c.variant_href)},` : ''
        }
        name: ${q(c.name)},
      },`,
  )
  .join('\n');

const colorwaysFile = path.join(yarnPath, 'colorways.ts');
fs.writeFileSync(
  colorwaysFile,
  `import type { Colorway } from '$lib/types/yarn-types';

const colorways: Colorway[] = [
  {
    source: {
      name: ${q(domain)},
      href: ${q(sourceHref)},
      accessed: ${q(new Date().toISOString().split('T')[0])},
    },
    colors: [
${colorEntries}
    ],
  },
];

export default colorways;
`,
);
console.log(`✓ Wrote ${colors.length} colorways to ${colorwaysFile}`);

// Update the "N colorways" text in this yarn's changelog note
const yarnId = fs
  .readFileSync(path.join(yarnPath, 'yarn.ts'), 'utf-8')
  .match(/id:\s*'([^']+)'/)?.[1];
const brandId = fs
  .readFileSync(
    path.join(root, 'src/lib/data/yarns', brandDir, 'yarns.ts'),
    'utf-8',
  )
  .match(/id:\s*'([^']+)'/)?.[1];
const changelogFile = path.join(root, 'src/routes/changelog/changelog.ts');
let changelog = fs.readFileSync(changelogFile, 'utf-8');
const countPattern = new RegExp(
  `(text: \`)\\d+( colorways\`,\\s*title:\\s*'Added New Yarn: <a href="/yarn-colorway-finder\\?f=${brandId}-${yarnId}&)`,
);
if (brandId && yarnId && countPattern.test(changelog)) {
  changelog = changelog.replace(countPattern, `$1${colors.length}$2`);
  fs.writeFileSync(changelogFile, changelog);
  console.log(`✓ Set changelog count to ${colors.length} colorways`);
} else {
  console.warn(
    `⚠ Could not find the changelog note for ${brandId}-${yarnId}; update its colorway count by hand`,
  );
}

try {
  execFileSync(
    'npx',
    ['--no-install', 'prettier', '--write', colorwaysFile, changelogFile],
    { cwd: root, stdio: 'pipe' },
  );
  console.log('✓ Formatted files with Prettier');
} catch {
  console.warn('⚠ Could not run Prettier; format the changed files by hand');
}
