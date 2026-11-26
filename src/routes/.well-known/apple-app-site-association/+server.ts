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

// Universal links: the addresses the iPhone app opens when it's installed
// (iOS reads this file through Apple's CDN when the app is installed). Without
// the app, they open here as usual. The app routes them in TBCore's
// `WebAddress`; keep the two lists the same. Answered by the Worker, not a
// static file, so it's always JSON and never redirected.

import type { RequestHandler } from './$types';

export const prerender = false;

const APP_ID = '7STKD2G4FW.com.temperature-blanket.TemperatureBlanket';

const components = [
  // Project links (an app-made link may have an empty id)
  { '/': '/', '?': { project: '*' }, comment: 'Project links' },
  // Gallery: lists, pages (projects and palettes) and makers' galleries
  { '/': '/gallery', comment: 'Project gallery' },
  { '/': '/gallery/*', comment: 'Gallery pages and lists' },
  { '/': '/globe', comment: 'Gallery globe' },
  // Old gallery addresses, redirected here to /gallery/…
  { '/': '/project/*', comment: 'Old gallery pages' },
  { '/': '/info/project/*', comment: 'Old gallery pages' },
  { '/': '/yarn-palette-gallery', comment: 'Old palette gallery' },
  // Palettes (with colors or blank) and the yarn finder
  { '/': '/yarn', comment: 'Palette links' },
  { '/': '/yarn-colorway-finder', comment: 'Yarn finder' },
  // A place's forecast
  { '/': '/weather', '?': { id: '?*' }, comment: 'Forecast links' },
  // My Library
  { '/': '/my-projects', comment: 'My Projects' },
  { '/': '/my-palettes', comment: 'My Palettes' },
];

export const GET: RequestHandler = () =>
  Response.json(
    { applinks: { details: [{ appIDs: [APP_ID], components }] } },
    { headers: { 'cache-control': 'public, max-age=3600' } },
  );
