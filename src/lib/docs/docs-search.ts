// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

// Searching Guides & Help: first the pages whose title, keywords or summary
// match (instant, from docs-index), then every word of every page, from the
// Pagefind index the build writes to /pagefind/ (static files, searched in
// the browser; there is none under `pnpm dev`, so only keywords match there).

import { DOCS_PAGES, docsHref, type DocsPage } from './docs-index';

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Pages for a query, best first: a word in the title counts most, then a keyword, then the summary */
export function keywordSearch(query: string, pages = DOCS_PAGES): DocsPage[] {
  const queryWords = words(query);
  if (!queryWords.length) return [];
  const phrase = queryWords.join(' ');
  return pages
    .map((page) => {
      const title = words(page.title);
      const keywords = page.keywords.map((keyword) => words(keyword).join(' '));
      const keywordWords = keywords.flatMap((keyword) => keyword.split(' '));
      const summary = words(page.summary);
      let score = 0;
      if (keywords.includes(phrase) && queryWords.length > 1) score += 4;
      for (const word of queryWords) {
        // "thermometers" finds "thermometer", "rang" finds "ranges"
        const matches = (list: string[]) =>
          list.some(
            (candidate) =>
              candidate.startsWith(word) ||
              (word.length > 3 && word.startsWith(candidate)),
          );
        if (matches(title)) score += 3;
        else if (matches(keywordWords)) score += 2;
        else if (matches(summary)) score += 1;
      }
      return { page, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ page }) => page);
}

export type TextResult = { url: string; title: string; excerpt: string };

type Pagefind = {
  search: (query: string) => Promise<{
    results: {
      data: () => Promise<{
        url: string;
        meta: { title?: string };
        excerpt: string;
        sub_results?: { url: string; title: string; excerpt: string }[];
      }>;
    }[];
  } | null>;
};

let pagefind: Promise<Pagefind | null> | undefined;

/** Pagefind, loaded the first time it's needed; null where there's no index */
function loadPagefind() {
  pagefind ??= import(/* @vite-ignore */ `${'/pagefind/pagefind.js'}`)
    .then((module: Pagefind) => module)
    .catch(() => null);
  return pagefind;
}

/** The pages' own URLs, without the .html of the prerendered files */
const pageUrl = (url: string) => url.replace(/(\/index)?\.html(?=#|$)/, '');

/** Every word of every page, leaving out pages already found by keyword */
export async function textSearch(
  query: string,
  skip: DocsPage[],
  limit = 8,
): Promise<TextResult[]> {
  const search = await (await loadPagefind())?.search(query);
  if (!search) return [];
  const skipped = new Set(skip.map(docsHref));
  const found: TextResult[] = [];
  for (const result of search.results.slice(0, limit * 2)) {
    if (found.length >= limit) break;
    const data = await result.data();
    const url = pageUrl(data.url);
    if (skipped.has(url)) continue;
    // The section where the words are, when they're under a heading
    const section = data.sub_results?.find((sub) => sub.url.includes('#'));
    found.push({
      url: section ? pageUrl(section.url) : url,
      title: section
        ? `${data.meta.title ?? ''} › ${section.title}`
        : (data.meta.title ?? url),
      excerpt: section?.excerpt ?? data.excerpt,
    });
  }
  return found;
}
