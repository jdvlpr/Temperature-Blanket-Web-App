#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Helper to convert strings to kebab-case
function toKebabCase(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Helper to convert kebab-case to camelCase
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
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
};

// Resolve weight name or ID to normalized ID
function resolveWeightId(input) {
  if (!input) return undefined;
  const lower = input.toLowerCase().trim();
  return weightMap[lower] || lower;
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper to prompt user
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('\n🧶 Add New Yarn to Database\n');

  // Get inputs
  const brandName = await prompt('Brand name (e.g., caron, cascade): ');
  const yarnName = await prompt('Yarn name (e.g., Simply Soft Solids): ');
  const sourceHref = await prompt('Source URL: ');
  const weightInput = await prompt('Weight (optional, e.g., worsted, dk, lace): ');

  rl.close();

  if (!brandName || !yarnName || !sourceHref) {
    console.error('❌ Brand name, yarn name, and source URL are required');
    process.exit(1);
  }

  const weightId = resolveWeightId(weightInput);

  const brandKebab = toKebabCase(brandName);
  const yarnKebab = toKebabCase(yarnName);
  const yarnCamel = toCamelCase(yarnKebab);

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

    // Create colorways.ts
    const colorwaysContent = `import type { Colorway } from '$lib/types/yarn-types';

const colorways: Colorway[] = [
  {
    source: {
      name: 'TODO',
      href: '${sourceHref}',
      accessed: '${new Date().toISOString().split('T')[0]}',
    },
    colors: [
      {
        hex: '#f2f2f2',
        name: 'White',
        variant_href: '${sourceHref}',
      },
      {
        hex: '#000000',
        name: 'Black',
        variant_href: '${sourceHref}',
      },
    ],
  },
];

export default colorways;
`;
    fs.writeFileSync(path.join(yarnDir, 'colorways.ts'), colorwaysContent);
    console.log(`✓ Created colorways.ts`);

    // Create yarn.ts
    const yarnContent = `import type { Yarn } from '$lib/types/yarn-types';
import colorways from './colorways';

export const yarn: Yarn = {
  colorways,
  name: '${yarnName}',
  id: '${yarnKebab}',${weightId ? `\n  weightId: '${weightId}',` : ''}
};
`;
    fs.writeFileSync(path.join(yarnDir, 'yarn.ts'), yarnContent);
    console.log(`✓ Created yarn.ts`);

    // Update brand's yarns.ts
    const brandYarnsFile = path.join(brandYarnsDir, 'yarns.ts');
    let brandYarnsContent = fs.readFileSync(brandYarnsFile, 'utf-8');

    // Find the last import statement and add the new one
    const lastImportMatch = brandYarnsContent.match(
      /import\s+{[^}]*}\s+from\s+['"][^'"]*['"]\s*;/g,
    );
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const newImport = `import { yarn as ${yarnCamel} } from './${yarnKebab}/yarn';`;
      brandYarnsContent = brandYarnsContent.replace(
        lastImport,
        lastImport + '\n' + newImport,
      );

      // Find the export array and add the new yarn
      const exportMatch = brandYarnsContent.match(
        /export\s+const\s+brand:\s+Brand\s*=\s*{[\s\S]*?};/,
      );
      if (exportMatch) {
        const exportBlock = exportMatch[0];
        // Find the last yarn entry in the array
        const yarrnsArrayMatch = exportBlock.match(/yarns:\s*\[[\s\S]*?\]/);
        if (yarrnsArrayMatch) {
          const yarnsArray = yarrnsArrayMatch[0];
          const newYarnsArray = yarnsArray.replace(
            /\]$/,
            `,\n    ${yarnCamel},\n  ]`,
          );
          brandYarnsContent = brandYarnsContent.replace(
            yarnsArray,
            newYarnsArray,
          );
        }
      }

      fs.writeFileSync(brandYarnsFile, brandYarnsContent);
      console.log(`✓ Updated ${brandKebab}/yarns.ts`);
    }

    // Check if brand needs to be added to brands.ts
    const brandsFile = path.join(projectRoot, 'src/lib/data/yarns/brands.ts');
    let brandsContent = fs.readFileSync(brandsFile, 'utf-8');

    if (!brandsContent.includes(`from './${brandKebab}/yarns'`)) {
      // Brand doesn't exist in brands.ts, add it (alphabetically)
      const brandCamel = toCamelCase(brandKebab);
      const newImport = `import { brand as ${brandCamel} } from './${brandKebab}/yarns';`;

      // Find where to insert (after other imports, before export)
      const importsMatch = brandsContent.match(
        /import\s+{[^}]*}\s+from\s+['"]\./g,
      );
      if (importsMatch) {
        const lastImportPos = brandsContent.lastIndexOf("from './");
        const lineEndPos = brandsContent.indexOf('\n', lastImportPos);
        brandsContent =
          brandsContent.slice(0, lineEndPos) +
          '\n' +
          newImport +
          brandsContent.slice(lineEndPos);
      }

      // Add to export array
      const exportArrayMatch = brandsContent.match(
        /export\s+const\s+brands:\s+Brand\[\]\s*=\s*\[[\s\S]*?\];/,
      );
      if (exportArrayMatch) {
        const exportArray = exportArrayMatch[0];
        const newExportArray = exportArray.replace(
          /\];$/,
          `,\n  ${brandCamel},\n];`,
        );
        brandsContent = brandsContent.replace(exportArray, newExportArray);
      }

      fs.writeFileSync(brandsFile, brandsContent);
      console.log(`✓ Updated brands.ts`);
    }

    // Update changelog.ts
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

    // Create new entry
    const newEntry = `              {
                icon: ICONS.checkCircle,
                text: \`Add yarn details (colorway count)\`,
                title: 'Added New Yarn: ${brandName} - ${yarnName}',
              },`;

    // Find the current month's items array and insert before the closing bracket
    const monthPattern = new RegExp(
      `month: '${currentMonth}',\\s*items: \\[([\\s\\S]*?)\\]`,
      'm',
    );
    const match = changelogContent.match(monthPattern);

    if (match) {
      // Month exists, add to it
      const itemsContent = match[1];
      const lastItemEnd = itemsContent.lastIndexOf('},');
      const updatedItems =
        itemsContent.slice(0, lastItemEnd + 2) +
        '\n' +
        newEntry +
        itemsContent.slice(lastItemEnd + 2);
      const newMonthBlock = `month: '${currentMonth}',\n        items: [${updatedItems}]`;
      changelogContent = changelogContent.replace(match[0], newMonthBlock);
    } else {
      // Month doesn't exist, need to create it
      // Find the current year block
      const yearPattern = new RegExp(
        `year: ${currentYear},\\s*months: \\[([\\s\\S]*?)\\]\\s*}`,
      );
      const yearMatch = changelogContent.match(yearPattern);

      if (yearMatch) {
        const monthsContent = yearMatch[1];
        const newMonthBlock = `{
        month: '${currentMonth}',
        items: [
          {
            notes: [
${newEntry}
            ],
            version: '5.x.x',
          },
        ],
      },`;
        const updatedMonths =
          monthsContent.slice(0, -1) + newMonthBlock + monthsContent.slice(-1);
        const newYearBlock = `year: ${currentYear},\n    months: [${updatedMonths}]`;
        changelogContent = changelogContent.replace(
          yearMatch[0],
          newYearBlock + '\n    }',
        );
      } else {
        console.warn('⚠ Could not find year in changelog');
      }
    }

    fs.writeFileSync(changelogFile, changelogContent);
    console.log(`✓ Updated changelog.ts`);

    console.log('\n✅ Successfully added yarn!\n');
    console.log('📝 Next steps:');
    console.log(`  1. Update colorways.ts with actual colors`);
    console.log(
      `  2. Update changelog.ts with the colorway count and proper version`,
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
