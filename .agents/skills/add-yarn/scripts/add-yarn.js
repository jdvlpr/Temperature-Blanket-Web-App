#!/usr/bin/env node

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to convert strings to snake_case for IDs
function toSnakeCase(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
}

// Helper to convert strings to kebab-case for directory names
function toKebabCase(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to convert snake_case to camelCase
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Escape single quotes for use inside generated single-quoted TS strings
function escapeQuotes(str) {
  return str.replace(/'/g, "\\'");
}

// Weight name to ID mapping
const weightMap = {
  thread: 't',
  cobweb: 'c',
  lace: 'l',
  'light fingering': 'lf',
  lf: 'lf',
  fingering: 'f',
  sport: 's',
  dk: 'd',
  worsted: 'w',
  aran: 'a',
  bulky: 'b',
  'super bulky': 'sb',
  sb: 'sb',
  jumbo: 'j',
  any: 'any',
  'any weight': 'any',
  'all weights': 'any',
};

// Resolve weight name or ID to normalized ID
function resolveWeightId(input) {
  if (!input) return undefined;
  const lower = input.toLowerCase().trim();
  return weightMap[lower] || lower;
}

// Extract domain from URL (e.g., https://www.michaels.com/... -> michaels.com)
function extractDomain(href) {
  try {
    const url = new URL(href);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return 'TODO';
  }
}

async function main() {
  // Get inputs from command-line arguments (--version <x.y.z> may appear anywhere)
  const args = [];
  let versionOverride;
  const rawArgs = process.argv.slice(2);
  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === '--version') versionOverride = rawArgs[++i];
    else args.push(rawArgs[i]);
  }
  const [brandNameArg, yarnNameArg, sourceHrefArg, weightArg] = args;

  if (versionOverride && !/^\d+\.\d+\.\d+$/.test(versionOverride)) {
    console.error(
      `❌ --version must look like 6.5.0 (got "${versionOverride}")`,
    );
    process.exit(1);
  }

  if (!brandNameArg || !yarnNameArg || !sourceHrefArg) {
    console.error(
      '❌ Usage: node add-yarn.js <brandName> <yarnName> <sourceHref> [weight] [--version x.y.z]',
    );
    console.error(
      'Example: node add-yarn.js caron "Simply Soft Solids" "https://..." worsted',
    );
    process.exit(1);
  }

  const brandName = brandNameArg.toLowerCase();
  const yarnName = yarnNameArg;
  const sourceHref = sourceHrefArg;
  const weightId = resolveWeightId(weightArg);

  const brandSnake = toSnakeCase(brandName);
  const brandKebab = toKebabCase(brandName);
  const yarnSnake = toSnakeCase(yarnName);
  const yarnKebab = toKebabCase(yarnName);
  const yarnCamel = toCamelCase(yarnSnake);

  // Determine base path
  const projectRoot = process.cwd();
  const yarnDir = path.join(
    projectRoot,
    'src/lib/data/yarns',
    brandKebab,
    yarnKebab,
  );
  const brandYarnsDir = path.join(
    projectRoot,
    'src/lib/data/yarns',
    brandKebab,
  );

  // Files to format with Prettier once everything is written
  const touchedFiles = [];

  try {
    // Validate brand directory exists
    if (!fs.existsSync(brandYarnsDir)) {
      console.error(`❌ Brand directory not found: ${brandKebab}`);
      process.exit(1);
    }

    // Check if yarn directory already exists
    if (fs.existsSync(yarnDir)) {
      console.error(`❌ Yarn directory already exists: ${yarnDir}`);
      process.exit(1);
    }

    // Create yarn directory
    fs.mkdirSync(yarnDir, { recursive: true });
    console.log(`✓ Created directory: ${yarnDir}`);

    // Create colorways.ts — always uses 2 placeholder colorways (update manually after)
    const sourceName = extractDomain(sourceHref);
    const colorwaysContent = `import type { Colorway } from '$lib/types/yarn-types';

const colorways: Colorway[] = [
  {
    source: {
      name: '${sourceName}',
      href: '${sourceHref}',
      accessed: '${new Date().toISOString().split('T')[0]}',
    },
    colors: [
      {
        hex: '#f2f2f2',
        name: 'White',
      },
      {
        hex: '#000000',
        name: 'Black',
      },
    ],
  },
];

export default colorways;
`;
    fs.writeFileSync(path.join(yarnDir, 'colorways.ts'), colorwaysContent);
    touchedFiles.push(path.join(yarnDir, 'colorways.ts'));
    console.log(`✓ Created colorways.ts`);

    // Create yarn.ts
    const yarnContent = `import type { Yarn } from '$lib/types/yarn-types';
import colorways from './colorways';

export const yarn: Yarn = {
  colorways,
  id: '${yarnSnake}',
  name: '${escapeQuotes(yarnName)}',${weightId ? `\n  weightId: '${weightId}',` : ''}
};
`;
    fs.writeFileSync(path.join(yarnDir, 'yarn.ts'), yarnContent);
    touchedFiles.push(path.join(yarnDir, 'yarn.ts'));
    console.log(`✓ Created yarn.ts`);

    // Update brand's yarns.ts
    const brandYarnsFile = path.join(brandYarnsDir, 'yarns.ts');
    let brandYarnsContent = fs.readFileSync(brandYarnsFile, 'utf-8');

    // Add new import in alphabetical order
    const importMatch = brandYarnsContent.match(
      /import\s+{[^}]*}\s+from\s+'\.\//g,
    );
    if (importMatch) {
      const newImport = `import { yarn as ${yarnCamel} } from './${yarnKebab}/yarn';`;

      // Find insertion point (alphabetically between existing imports)
      const imports = [];
      const importRegex =
        /import\s+{\s*yarn as (\w+)\s*}\s+from\s+'\.\/([^']+)\/yarn';/g;
      let match;
      while ((match = importRegex.exec(brandYarnsContent)) !== null) {
        imports.push({ line: match[0], dir: match[2], camel: match[1] });
      }

      // Find where to insert alphabetically
      let insertAfter = null;
      for (const imp of imports) {
        if (imp.dir < yarnKebab) {
          insertAfter = imp;
        }
      }

      if (insertAfter) {
        brandYarnsContent = brandYarnsContent.replace(
          insertAfter.line,
          insertAfter.line + '\n' + newImport,
        );
      } else if (imports.length > 0) {
        brandYarnsContent = brandYarnsContent.replace(
          imports[0].line,
          newImport + '\n' + imports[0].line,
        );
      } else {
        const firstImportPos = brandYarnsContent.indexOf('import {');
        const lineEnd = brandYarnsContent.indexOf('\n', firstImportPos);
        brandYarnsContent =
          brandYarnsContent.slice(0, lineEnd) +
          '\n' +
          newImport +
          brandYarnsContent.slice(lineEnd);
      }

      // Find the yarns array and add the new yarn in alphabetical order
      const yarnsArrayMatch = brandYarnsContent.match(/yarns:\s*\[([^\]]*)\]/);
      if (yarnsArrayMatch) {
        const fullMatch = yarnsArrayMatch[0];
        const yarnsArrayContent = yarnsArrayMatch[1];
        const yarnRefs = (yarnsArrayContent.match(/\b\w+\b/g) || []).filter(
          (r) => r !== 'yarns',
        );

        // Find insertion point alphabetically
        let insertAfterRef = null;
        for (const ref of yarnRefs) {
          const refSnake = ref
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
          if (refSnake < yarnSnake) {
            insertAfterRef = ref;
          }
        }

        let newYarnsArray;
        if (insertAfterRef) {
          // Insert after insertAfterRef
          newYarnsArray = yarnsArrayContent.replace(
            new RegExp(`\\b${insertAfterRef}\\b`),
            `${insertAfterRef}, ${yarnCamel}`,
          );
        } else if (yarnRefs.length > 0) {
          // Insert at beginning
          newYarnsArray = yarnsArrayContent.replace(
            new RegExp(`\\b${yarnRefs[0]}\\b`),
            `${yarnCamel}, ${yarnRefs[0]}`,
          );
        } else {
          newYarnsArray = ` ${yarnCamel} `;
        }

        brandYarnsContent = brandYarnsContent.replace(
          fullMatch,
          `yarns: [${newYarnsArray}]`,
        );
      }

      fs.writeFileSync(brandYarnsFile, brandYarnsContent);
      touchedFiles.push(brandYarnsFile);
      console.log(`✓ Updated ${brandKebab}/yarns.ts`);
    } else {
      // Brand file has no yarn imports yet (a brand with an empty `yarns: []`)
      const newImport = `import { yarn as ${yarnCamel} } from './${yarnKebab}/yarn';`;
      const updated = brandYarnsContent
        .replace(/(import type[^\n]*\n)/, `$1${newImport}\n`)
        .replace(/yarns:\s*\[\s*\]/, `yarns: [${yarnCamel}]`);
      if (updated === brandYarnsContent) {
        throw new Error(
          `Could not add the yarn to ${brandKebab}/yarns.ts; add it by hand`,
        );
      }
      fs.writeFileSync(brandYarnsFile, updated);
      touchedFiles.push(brandYarnsFile);
      console.log(`✓ Updated ${brandKebab}/yarns.ts`);
    }

    // Check if brand needs to be added to brands.ts
    const brandsFile = path.join(projectRoot, 'src/lib/data/yarns/brands.ts');
    let brandsContent = fs.readFileSync(brandsFile, 'utf-8');

    if (!brandsContent.includes(`from './${brandKebab}/yarns'`)) {
      // Brand doesn't exist in brands.ts, add it alphabetically
      const brandCamel = toCamelCase(brandSnake);
      const newImport = `import { brand as ${brandCamel} } from './${brandKebab}/yarns';`;

      // Find alphabetical insertion point
      const imports = [];
      const importRegex =
        /import\s+{\s*brand as (\w+)\s*}\s+from\s+'\.\/([^']+)\/yarns';/g;
      let match;
      while ((match = importRegex.exec(brandsContent)) !== null) {
        imports.push({ line: match[0], dir: match[2], camel: match[1] });
      }

      // Find where to insert alphabetically
      let insertAfter = null;
      for (const imp of imports) {
        if (imp.dir < brandSnake) {
          insertAfter = imp;
        }
      }

      if (insertAfter) {
        brandsContent = brandsContent.replace(
          insertAfter.line,
          insertAfter.line + '\n' + newImport,
        );
      } else if (imports.length > 0) {
        brandsContent = brandsContent.replace(
          imports[0].line,
          newImport + '\n' + imports[0].line,
        );
      }

      // Add to export array alphabetically
      const exportArrayMatch = brandsContent.match(
        /export\s+const\s+brands:\s+Brand\[\]\s*=\s*\[[\s\S]*?\];/,
      );
      if (exportArrayMatch) {
        const exportArray = exportArrayMatch[0];
        const brandRefs = exportArray.match(/\b\w+\b(?=\s*[,\]])/g) || [];

        // Find insertion point alphabetically
        let insertPoint = null;
        for (let i = 0; i < brandRefs.length; i++) {
          const ref = brandRefs[i];
          const refSnake = ref
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
          if (
            refSnake < brandSnake &&
            (insertPoint === null || refSnake > insertPoint)
          ) {
            insertPoint = ref;
          }
        }

        let newExportArray;
        if (insertPoint) {
          newExportArray = exportArray.replace(
            `${insertPoint},`,
            `${insertPoint},\n  ${brandCamel},`,
          );
        } else if (brandRefs.length > 0 && brandSnake < brandRefs[0]) {
          newExportArray = exportArray.replace(
            `${brandRefs[0]},`,
            `${brandCamel},\n  ${brandRefs[0]},`,
          );
        } else {
          newExportArray = exportArray.replace(
            /\];$/,
            `,\n  ${brandCamel},\n];`,
          );
        }

        brandsContent = brandsContent.replace(exportArray, newExportArray);
      }

      fs.writeFileSync(brandsFile, brandsContent);
      touchedFiles.push(brandsFile);
      console.log(`✓ Updated brands.ts`);
    }

    // Brand display name and ID as the app knows them (used in the changelog)
    const brandDisplayName =
      brandYarnsContent.match(/name:\s*'([^']+)'/)?.[1] ??
      brandNameArg.charAt(0).toUpperCase() + brandNameArg.slice(1);
    const brandId =
      brandYarnsContent.match(/id:\s*'([^']+)'/)?.[1] ?? brandSnake;

    // New yarns are a minor version bump (e.g. 6.3.2 -> 6.4.0) unless --version is given
    const packageFile = path.join(projectRoot, 'package.json');
    const packageContent = fs.readFileSync(packageFile, 'utf-8');
    const versionMatch = packageContent.match(
      /"version":\s*"(\d+)\.(\d+)\.\d+"/,
    );
    if (!versionMatch) {
      throw new Error('Could not read the version from package.json');
    }
    const newVersion =
      versionOverride ?? `${versionMatch[1]}.${Number(versionMatch[2]) + 1}.0`;
    fs.writeFileSync(
      packageFile,
      packageContent.replace(versionMatch[0], `"version": "${newVersion}"`),
    );
    touchedFiles.push(packageFile);
    console.log(`✓ Updated package.json version to ${newVersion}`);

    // Update changelog.ts (newest first: year > month > item)
    const changelogFile = path.join(
      projectRoot,
      'src/routes/changelog/changelog.ts',
    );
    let changelogContent = fs.readFileSync(changelogFile, 'utf-8');

    const now = new Date();
    const currentYear = now.getFullYear();
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const currentMonth = monthNames[now.getMonth()];

    // The colorway count is a placeholder (2) until real colorways are added
    const newNote = `              {
                icon: ICONS.checkCircle,
                text: \`2 colorways\`,
                title:
                  'Added New Yarn: <a href="/yarn-colorway-finder?f=${brandId}-${yarnSnake}&v=${newVersion}" class="link">${escapeQuotes(brandDisplayName)} - ${escapeQuotes(yarnName)}</a>',
              },
`;
    const newItem = `          {
            notes: [
${newNote}            ],
            version: '${newVersion}',
          },
`;
    const monthBlock = `      {
        month: '${currentMonth}',
        items: [
${newItem}        ],
      },
`;
    const yearHeader = `    year: ${currentYear},\n    months: [\n`;
    const monthHeader = `      {\n        month: '${currentMonth}',\n        items: [\n`;

    // With --version, join an existing changelog item for that version if there is one
    const itemTail = `            ],\n            version: '${newVersion}',`;
    const itemTailAt = versionOverride
      ? changelogContent.indexOf(itemTail)
      : -1;

    const yearStart = changelogContent.indexOf(yearHeader);
    if (itemTailAt !== -1) {
      changelogContent =
        changelogContent.slice(0, itemTailAt) +
        newNote +
        changelogContent.slice(itemTailAt);
    } else if (yearStart === -1) {
      // First entry of a new year
      const entriesHeader = 'export const entries: ChangelogItemGroup[] = [\n';
      const entriesStart = changelogContent.indexOf(entriesHeader);
      if (entriesStart === -1) {
        throw new Error('Could not find the changelog entries array');
      }
      const at = entriesStart + entriesHeader.length;
      changelogContent =
        changelogContent.slice(0, at) +
        `  {\n${yearHeader}${monthBlock}    ],\n  },\n` +
        changelogContent.slice(at);
    } else {
      const monthsStart = yearStart + yearHeader.length;
      if (changelogContent.startsWith(monthHeader, monthsStart)) {
        // Current month is the newest month of this year: add a new item at its top
        const at = monthsStart + monthHeader.length;
        changelogContent =
          changelogContent.slice(0, at) + newItem + changelogContent.slice(at);
      } else {
        // First entry of a new month
        changelogContent =
          changelogContent.slice(0, monthsStart) +
          monthBlock +
          changelogContent.slice(monthsStart);
      }
    }

    fs.writeFileSync(changelogFile, changelogContent);
    touchedFiles.push(changelogFile);
    console.log(`✓ Updated changelog.ts`);

    // Format everything the script wrote
    try {
      execFileSync(
        'npx',
        ['--no-install', 'prettier', '--write', ...touchedFiles],
        { cwd: projectRoot, stdio: 'pipe' },
      );
      console.log(`✓ Formatted files with Prettier`);
    } catch {
      console.warn(
        '⚠ Could not run Prettier; run `npx prettier --write` on the changed files',
      );
    }

    console.log('\n✅ Successfully added yarn!\n');
    console.log('📝 Next steps:');
    console.log(
      `  1. Replace the placeholder colorways in colorways.ts (see SKILL.md)`,
    );
    console.log(
      `  2. Update the "2 colorways" text in changelog.ts with the real count`,
    );
    console.log(
      `  3. Test the application to verify the yarn displays correctly\n`,
    );
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
