#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Helper to convert strings to snake_case
function toSnakeCase(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
}

// Helper to convert snake_case to camelCase
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Weight name to ID mapping
const weightMap = {
  'thread': 't',
  'cobweb': 'c',
  'lace': 'l',
  'light fingering': 'lf',
  'lf': 'lf',
  'fingering': 'f',
  'sport': 's',
  'dk': 'd',
  'worsted': 'w',
  'aran': 'a',
  'bulky': 'b',
  'super bulky': 'sb',
  'sb': 'sb',
  'jumbo': 'j',
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
  // Get inputs from command-line arguments
  const [, , brandNameArg, yarnNameArg, sourceHrefArg, weightArg] = process.argv;

  if (!brandNameArg || !yarnNameArg || !sourceHrefArg) {
    console.error('❌ Usage: node add-yarn.js <brandName> <yarnName> <sourceHref> [weight]');
    console.error('Example: node add-yarn.js caron "Simply Soft Solids" "https://..." worsted');
    process.exit(1);
  }

  const brandName = brandNameArg.toLowerCase();
  const yarnName = yarnNameArg;
  const sourceHref = sourceHrefArg;
  const weightId = resolveWeightId(weightArg);

  const brandSnake = toSnakeCase(brandName);
  const yarnSnake = toSnakeCase(yarnName);
  const yarnCamel = toCamelCase(yarnSnake);

  // Determine base path
  const projectRoot = process.cwd();
  const yarnDir = path.join(projectRoot, 'src/lib/data/yarns', brandSnake, yarnSnake);
  const brandYarnsDir = path.join(projectRoot, 'src/lib/data/yarns', brandSnake);

  try {
    // Validate brand directory exists
    if (!fs.existsSync(brandYarnsDir)) {
      console.error(`❌ Brand directory not found: ${brandSnake}`);
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
    console.log(`✓ Created colorways.ts`);

    // Create yarn.ts
    const yarnContent = `import type { Yarn } from '$lib/types/yarn-types';
import colorways from './colorways';

export const yarn: Yarn = {
  colorways,
  id: '${yarnSnake}',
  name: '${yarnName}',${weightId ? `\n  weightId: '${weightId}',` : ''}
};
`;
    fs.writeFileSync(path.join(yarnDir, 'yarn.ts'), yarnContent);
    console.log(`✓ Created yarn.ts`);

    // Update brand's yarns.ts
    const brandYarnsFile = path.join(brandYarnsDir, 'yarns.ts');
    let brandYarnsContent = fs.readFileSync(brandYarnsFile, 'utf-8');

    // Add new import in alphabetical order
    const importMatch = brandYarnsContent.match(/import\s+{[^}]*}\s+from\s+'\.\//g);
    if (importMatch) {
      const newImport = `import { yarn as ${yarnCamel} } from './${yarnSnake}/yarn';`;

      // Find insertion point (alphabetically between existing imports)
      const imports = [];
      const importRegex = /import\s+{\s*yarn as (\w+)\s*}\s+from\s+'\.\/([^']+)\/yarn';/g;
      let match;
      while ((match = importRegex.exec(brandYarnsContent)) !== null) {
        imports.push({ line: match[0], dir: match[2], camel: match[1] });
      }

      // Find where to insert alphabetically
      let insertAfter = null;
      for (const imp of imports) {
        if (imp.dir < yarnSnake) {
          insertAfter = imp;
        }
      }

      if (insertAfter) {
        brandYarnsContent = brandYarnsContent.replace(insertAfter.line, insertAfter.line + '\n' + newImport);
      } else if (imports.length > 0) {
        brandYarnsContent = brandYarnsContent.replace(imports[0].line, newImport + '\n' + imports[0].line);
      } else {
        const firstImportPos = brandYarnsContent.indexOf('import {');
        const lineEnd = brandYarnsContent.indexOf('\n', firstImportPos);
        brandYarnsContent = brandYarnsContent.slice(0, lineEnd) + '\n' + newImport + brandYarnsContent.slice(lineEnd);
      }

      // Find the export array and add the new yarn in alphabetical order
      const exportMatch = brandYarnsContent.match(/export\s+const\s+brand:\s+Brand\s*=\s*{[\s\S]*?};/);
      if (exportMatch) {
        const exportBlock = exportMatch[0];
        const yarnsArrayMatch = exportBlock.match(/yarns:\s*\[\s*([\s\S]*?)\s*\]/);
        if (yarnsArrayMatch) {
          const yarnsArrayContent = yarnsArrayMatch[1];
          const yarnRefs = yarnsArrayContent.match(/\b\w+\b(?=\s*[,\]])/g) || [];

          // Find insertion point alphabetically
          let insertPoint = null;
          for (let i = 0; i < yarnRefs.length; i++) {
            const ref = yarnRefs[i];
            // Convert camelCase back to compare
            const refSnake = ref.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
            if (refSnake < yarnSnake && (insertPoint === null || refSnake > insertPoint)) {
              insertPoint = ref;
            }
          }

          let newYarnsArray;
          if (insertPoint) {
            // Insert after insertPoint
            const insertAfterLine = `    ${insertPoint},`;
            newYarnsArray = yarnsArrayContent.replace(insertAfterLine, `${insertAfterLine}\n    ${yarnCamel},`);
          } else if (yarnRefs.length > 0 && yarnSnake < yarnRefs[0]) {
            // Insert at beginning
            const firstYarn = yarnRefs[0];
            const firstYarnLine = `    ${firstYarn},`;
            newYarnsArray = yarnsArrayContent.replace(firstYarnLine, `    ${yarnCamel},\n${firstYarnLine}`);
          } else {
            // Append at end
            newYarnsArray = yarnsArrayContent.trimEnd() + `,\n    ${yarnCamel},`;
          }

          const oldYarnsArray = `yarns: [\n${yarnsArrayContent}\n  ]`;
          const newExport = `yarns: [\n${newYarnsArray}\n  ]`;
          brandYarnsContent = brandYarnsContent.replace(oldYarnsArray, newExport);
        }
      }

      fs.writeFileSync(brandYarnsFile, brandYarnsContent);
      console.log(`✓ Updated ${brandSnake}/yarns.ts`);
    }

    // Check if brand needs to be added to brands.ts
    const brandsFile = path.join(projectRoot, 'src/lib/data/yarns/brands.ts');
    let brandsContent = fs.readFileSync(brandsFile, 'utf-8');

    if (!brandsContent.includes(`from './${brandSnake}/yarns'`)) {
      // Brand doesn't exist in brands.ts, add it alphabetically
      const brandCamel = toCamelCase(brandSnake);
      const newImport = `import { brand as ${brandCamel} } from './${brandSnake}/yarns';`;

      // Find alphabetical insertion point
      const imports = [];
      const importRegex = /import\s+{\s*brand as (\w+)\s*}\s+from\s+'\.\/([^']+)\/yarns';/g;
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
        brandsContent = brandsContent.replace(insertAfter.line, insertAfter.line + '\n' + newImport);
      } else if (imports.length > 0) {
        brandsContent = brandsContent.replace(imports[0].line, newImport + '\n' + imports[0].line);
      }

      // Add to export array alphabetically
      const exportArrayMatch = brandsContent.match(/export\s+const\s+brands:\s+Brand\[\]\s*=\s*\[[\s\S]*?\];/);
      if (exportArrayMatch) {
        const exportArray = exportArrayMatch[0];
        const brandRefs = exportArray.match(/\b\w+\b(?=\s*[,\]])/g) || [];

        // Find insertion point alphabetically
        let insertPoint = null;
        for (let i = 0; i < brandRefs.length; i++) {
          const ref = brandRefs[i];
          const refSnake = ref.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
          if (refSnake < brandSnake && (insertPoint === null || refSnake > insertPoint)) {
            insertPoint = ref;
          }
        }

        let newExportArray;
        if (insertPoint) {
          newExportArray = exportArray.replace(`${insertPoint},`, `${insertPoint},\n  ${brandCamel},`);
        } else if (brandRefs.length > 0 && brandSnake < brandRefs[0]) {
          newExportArray = exportArray.replace(`${brandRefs[0]},`, `${brandCamel},\n  ${brandRefs[0]},`);
        } else {
          newExportArray = exportArray.replace(/\];$/, `,\n  ${brandCamel},\n];`);
        }

        brandsContent = brandsContent.replace(exportArray, newExportArray);
      }

      fs.writeFileSync(brandsFile, brandsContent);
      console.log(`✓ Updated brands.ts`);
    }

    // Update changelog.ts
    const changelogFile = path.join(projectRoot, 'src/routes/changelog/changelog.ts');
    let changelogContent = fs.readFileSync(changelogFile, 'utf-8');

    const now = new Date();
    const currentYear = now.getFullYear();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = monthNames[now.getMonth()];

    // Create new entry
    const newEntry = `              {
                icon: ICONS.checkCircle,
                text: \`Add yarn details (colorway count)\`,
                title: 'Added New Yarn: ${brandName} - ${yarnName}',
              },`;

    // Find the current month's items array and insert before the closing bracket
    const monthPattern = new RegExp(`month: '${currentMonth}',\\s*items: \\[([\\s\\S]*?)\\]`, 'm');
    const match = changelogContent.match(monthPattern);

    if (match) {
      // Month exists, add to it
      const itemsContent = match[1];
      const lastItemEnd = itemsContent.lastIndexOf('},');
      const updatedItems = itemsContent.slice(0, lastItemEnd + 2) + '\n' + newEntry + itemsContent.slice(lastItemEnd + 2);
      const newMonthBlock = `month: '${currentMonth}',\n        items: [${updatedItems}]`;
      changelogContent = changelogContent.replace(match[0], newMonthBlock);
    } else {
      // Month doesn't exist, need to create it
      // Find the current year block
      const yearPattern = new RegExp(`year: ${currentYear},\\s*months: \\[([\\s\\S]*?)\\]\\s*}`);
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
        const updatedMonths = monthsContent.slice(0, -1) + newMonthBlock + monthsContent.slice(-1);
        const newYearBlock = `year: ${currentYear},\n    months: [${updatedMonths}]`;
        changelogContent = changelogContent.replace(yearMatch[0], newYearBlock + '\n    }');
      } else {
        console.warn('⚠ Could not find year in changelog');
      }
    }

    fs.writeFileSync(changelogFile, changelogContent);
    console.log(`✓ Updated changelog.ts`);

    console.log('\n✅ Successfully added yarn!\n');
    console.log('📝 Next steps:');
    console.log(`  1. Update colorways.ts with actual colors`);
    console.log(`  2. Update changelog.ts with the colorway count and proper version`);
    console.log(`  3. Test the application to verify the yarn displays correctly\n`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
