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

// Every page of Guides & Help, in reading order: the index's cards, the
// contents, Previous/Next, each page's title and description, and the
// keyword search all come from here. Keywords are the words people use for
// their problem, not the site's names for things ("thermometer", not
// "weather source"); the full text is searched by Pagefind as well.

export type DocsKind = 'guide' | 'reference';

export type DocsPage = {
  kind: DocsKind;
  slug: string;
  title: string;
  /** One sentence: the card text and the page's meta description */
  summary: string;
  keywords: string[];
  /** A guide's video, once there is one: a YouTube ID, and where to start */
  video?: { id: string; start?: number };
};

export const DOCS_TITLE = 'Guides & Help';

export const GUIDES: DocsPage[] = [
  {
    kind: 'guide',
    slug: 'plan-a-blanket',
    title: 'Plan a Blanket, Start to Finish',
    summary:
      'Every step of a temperature blanket project, from choosing a place to printing the pattern.',
    keywords: [
      'start',
      'beginner',
      'first project',
      'how to',
      'tutorial',
      'overview',
      'new project',
      'getting started',
    ],
  },
  {
    kind: 'guide',
    slug: 'weather-doesnt-match',
    title: "Weather Doesn't Match My Thermometer",
    summary:
      'Why the weather can look wrong or change later, and how to use readings you trust.',
    keywords: [
      'thermometer',
      'wrong',
      'inaccurate',
      'incorrect',
      'different',
      'changed',
      'missing',
      'no weather',
      'my own data',
      'weather station',
    ],
  },
  {
    kind: 'guide',
    slug: 'choose-ranges',
    title: 'Choose Ranges for Your Yarn',
    summary:
      'How ranges work, why the numbers repeat, and how to make them fit the colors you have.',
    keywords: [
      'ranges',
      'overlap',
      'repeat',
      'numbers',
      'degrees',
      'how many colors',
      'gauge',
      'decimals',
      'equal',
    ],
  },
  {
    kind: 'guide',
    slug: 'same-date-several-years',
    title: 'The Same Date Across Several Years',
    summary:
      'A blanket of one day, like a birthday or anniversary, in every year you choose.',
    keywords: [
      'birthday',
      'anniversary',
      'one day',
      'every year',
      'multiple years',
      'specific date',
      'memorial',
      'wedding',
    ],
  },
  {
    kind: 'guide',
    slug: 'match-your-yarn',
    title: 'Match Your Own Yarn, or a Photo',
    summary:
      'Use yarn you already have or can buy, or take the colors from a photo you love.',
    keywords: [
      'stash',
      'my yarn',
      'brand',
      'colorway',
      'photo',
      'picture',
      'image',
      'colors',
      'palette',
      'buy',
    ],
  },
  {
    kind: 'guide',
    slug: 'knit-along-all-year',
    title: 'Crochet or Knit Along All Year',
    summary:
      'A blanket for this year, one row a day: keep the same project as the weather comes in.',
    keywords: [
      'this year',
      'daily',
      'row a day',
      'ongoing',
      'in progress',
      'update',
      'new days',
      'crochet along',
      'knit along',
    ],
  },
  {
    kind: 'guide',
    slug: 'move-or-back-up',
    title: 'Move or Back Up Your Projects',
    summary:
      'Keep your projects safe and open them on another phone, tablet or computer.',
    keywords: [
      'backup',
      'lost',
      'disappeared',
      'another device',
      'phone',
      'computer',
      'transfer',
      'restore',
      'deleted',
      'trash',
    ],
  },
  {
    kind: 'guide',
    slug: 'publish-and-share',
    title: 'Publish and Share a Gallery Page',
    summary:
      'Share a project or palette with a link, or publish it to the gallery and keep it up to date.',
    keywords: [
      'share',
      'gallery',
      'publish',
      'link',
      'friends',
      'anonymous',
      'unpublish',
      'update',
      'stars',
    ],
  },
  {
    kind: 'guide',
    slug: 'ravelry-sync',
    title: 'Keep Your Ravelry Project in Sync',
    summary:
      'Post a project to Ravelry, and what updates there and here, and when.',
    keywords: [
      'ravelry',
      'notes',
      'photos',
      'progress',
      'yarn',
      'sync',
      'not updating',
      'post',
    ],
  },
  {
    kind: 'guide',
    slug: 'print-and-track',
    title: 'Print the Pattern and Track Your Progress',
    summary:
      'Download the pattern as a PDF or spreadsheet, and keep your place as you work.',
    keywords: [
      'print',
      'pdf',
      'pattern',
      'spreadsheet',
      'excel',
      'csv',
      'track',
      'checklist',
      'download',
      'image',
    ],
  },
  {
    kind: 'guide',
    slug: 'rain-snow-sunshine',
    title: 'Rain, Snow and Sunshine Blankets',
    summary:
      'Blankets for rain, snow or daylight instead of temperature, and how their ranges work.',
    keywords: [
      'rain',
      'snow',
      'sunshine',
      'daylight',
      'precipitation',
      'zero',
      'moon',
      'not temperature',
    ],
  },
];

export const REFERENCE: DocsPage[] = [
  {
    kind: 'reference',
    slug: 'location-and-dates',
    title: 'Location & Dates',
    summary: 'Choosing places and dates, and what to do when one is not found.',
    keywords: ['location', 'place', 'city', 'dates', 'year', 'not found'],
  },
  {
    kind: 'reference',
    slug: 'weather',
    title: 'Weather',
    summary:
      'Where the weather comes from, and how to view, group, edit and import it.',
    keywords: [
      'weather',
      'source',
      'open-meteo',
      'meteostat',
      'import',
      'csv',
      'edit',
      'weekly',
      'monthly',
      'error',
    ],
  },
  {
    kind: 'reference',
    slug: 'gauges-and-ranges',
    title: 'Gauges & Ranges',
    summary:
      'Gauges, their ranges, and every option in the Ranges menu, explained.',
    keywords: [
      'gauge',
      'ranges',
      'auto',
      'manual',
      'equal size',
      'equal days',
      'direction',
      'includes',
    ],
  },
  {
    kind: 'reference',
    slug: 'colors-and-yarn',
    title: 'Colors & Yarn',
    summary:
      'Getting colors, choosing yarn colorways, and sorting, pasting and exporting them.',
    keywords: [
      'colors',
      'yarn',
      'colorway',
      'palette',
      'paste',
      'export',
      'sort',
      'link unavailable',
      'out of stock',
    ],
  },
  {
    kind: 'reference',
    slug: 'preview',
    title: 'Preview',
    summary: 'Preview patterns, their settings, and seasons.',
    keywords: ['preview', 'pattern', 'rows', 'squares', 'hexagons', 'seasons'],
  },
  {
    kind: 'reference',
    slug: 'download',
    title: 'Download',
    summary: 'The PDF, the weather spreadsheet (CSV), and the preview image.',
    keywords: ['download', 'pdf', 'csv', 'png', 'print', 'image'],
  },
  {
    kind: 'reference',
    slug: 'palette-creator',
    title: 'Yarn Palette Creator',
    summary:
      'Making yarn palettes on their own: from colorways, gradients or a photo.',
    keywords: ['palette', 'creator', 'gradients', 'photo', 'colors', 'yarn'],
  },
  {
    kind: 'reference',
    slug: 'library-and-account',
    title: 'My Library & Account',
    summary:
      'Saving, opening and syncing projects and palettes, the Trash, Preferences and your account.',
    keywords: [
      'save',
      'open',
      'account',
      'sign in',
      'sync',
      'trash',
      'preferences',
      'theme',
      'units',
      'privacy',
      'delete account',
      'undo',
    ],
  },
  {
    kind: 'reference',
    slug: 'gallery-and-ravelry',
    title: 'Gallery & Ravelry',
    summary:
      'Gallery pages, stars, views, and connecting your Ravelry account.',
    keywords: ['gallery', 'publish', 'stars', 'views', 'ravelry', 'anonymous'],
  },
  {
    kind: 'reference',
    slug: 'explore',
    title: 'Explore',
    summary: 'The Yarn Colorway Finder, the Globe and the Weather page.',
    keywords: ['finder', 'globe', 'map', 'forecast', 'weather page', 'search'],
  },
  {
    kind: 'reference',
    slug: 'credits',
    title: 'Data Sources & Credits',
    summary: 'Where the weather, places and yarn colors come from.',
    keywords: ['credits', 'sources', 'data', 'thanks', 'license'],
  },
];

export const DOCS_PAGES = [...GUIDES, ...REFERENCE];

export const docsHref = (page: Pick<DocsPage, 'kind' | 'slug'>) =>
  page.kind === 'guide'
    ? `/documentation/guides/${page.slug}`
    : `/documentation/${page.slug}`;

/** The page at a path, ignoring a trailing slash */
export const docsPageAt = (pathname: string) => {
  const path = pathname.replace(/\/$/, '');
  return DOCS_PAGES.find((page) => docsHref(page) === path);
};

/**
 * Links to the single-page documentation (/documentation#weather-sources)
 * are all over the web: each of its sections, and where it is now. The
 * sections keep their ids on the new pages.
 */
export const OLD_ANCHORS: Record<string, string> = {
  introduction: '/documentation',
  'about-the-project-planner': '/documentation/guides/plan-a-blanket',
  basics: '/documentation/library-and-account',
  'save-project': '/documentation/library-and-account#save-project',
  'open-project': '/documentation/library-and-account#open-project',
  'change-units': '/documentation/library-and-account#change-units',
  'change-theme': '/documentation/library-and-account#change-theme',
  navigation: '/documentation/library-and-account#navigation',
  undoredo: '/documentation/library-and-account#undoredo',
  location: '/documentation/location-and-dates',
  'choose-a-location': '/documentation/location-and-dates#choose-a-location',
  'select-dates': '/documentation/location-and-dates#select-dates',
  'multiple-locations': '/documentation/location-and-dates#multiple-locations',
  'location-errors': '/documentation/location-and-dates#location-errors',
  weather: '/documentation/weather',
  'weather-sources': '/documentation/weather#weather-sources',
  'get-weather-data': '/documentation/weather#get-weather-data',
  'grouping-weather-data': '/documentation/weather#grouping-weather-data',
  'view-weather-data': '/documentation/weather#view-weather-data',
  'edit-weather-data': '/documentation/weather#edit-weather-data',
  'import-weather-data': '/documentation/weather#import-weather-data',
  'import-weather-data-file-requirements':
    '/documentation/weather#import-weather-data-file-requirements',
  'weather-errors': '/documentation/weather#weather-errors',
  'mixed-snow-parameters': '/documentation/weather#mixed-snow-parameters',
  gauges: '/documentation/gauges-and-ranges',
  'add-a-gauge': '/documentation/gauges-and-ranges#add-a-gauge',
  'gauge-direction': '/documentation/gauges-and-ranges#gauge-direction',
  'range-calculation-methods':
    '/documentation/gauges-and-ranges#range-calculation-methods',
  'increment-modes': '/documentation/gauges-and-ranges#increment-modes',
  'adjust-ranges': '/documentation/gauges-and-ranges#adjust-ranges',
  colors: '/documentation/colors-and-yarn',
  'preset-colors': '/documentation/colors-and-yarn#preset-colors',
  'saved-palettes': '/documentation/colors-and-yarn#saved-palettes',
  'image-palette': '/documentation/colors-and-yarn#image-palette',
  importexport: '/documentation/colors-and-yarn#importexport',
  'sort-colors': '/documentation/colors-and-yarn#sort-colors',
  yarn: '/documentation/colors-and-yarn#yarn',
  'getting-yarn-colorway-data':
    '/documentation/colors-and-yarn#getting-yarn-colorway-data',
  'choose-yarn-colorways':
    '/documentation/colors-and-yarn#choose-yarn-colorways',
  'link-unavailable': '/documentation/colors-and-yarn#link-unavailable',
  preview: '/documentation/preview',
  'create-a-preview': '/documentation/preview#create-a-preview',
  'assigning-seasons': '/documentation/preview#assigning-seasons',
  gallery: '/documentation/gallery-and-ravelry',
  'share-to-gallery': '/documentation/guides/publish-and-share',
  'star-gallery-pages': '/documentation/gallery-and-ravelry#star-gallery-pages',
  download: '/documentation/download',
  'download-gauges-and-weather-data-pdf':
    '/documentation/download#download-gauges-and-weather-data-pdf',
  'download-weather-data-csv':
    '/documentation/download#download-weather-data-csv',
  'download-preview-image-png':
    '/documentation/download#download-preview-image-png',
  credits: '/documentation/credits',
};
