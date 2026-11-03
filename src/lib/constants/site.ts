// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// This build's site: the beta (PUBLIC_SITE_CHANNEL=beta, at
// next.temperature-blanket.com) or the main site, PUBLIC_BASE_URL.

import { PUBLIC_BASE_URL } from '$app/env/public';
import { lastingOriginFor, originOf } from '#lib/utils/site-origin.js';

/** Whether this build is the beta */
export const IS_BETA = __SITE_BETA__;

/** The main site's origin (PUBLIC_BASE_URL), e.g. https://temperature-blanket.com */
export const MAIN_SITE_ORIGIN = originOf(PUBLIC_BASE_URL);

/**
 * The origin for links that last (gallery pages, their links, Ravelry notes):
 * the main site in the beta, else `here` (the browser's own origin by default).
 */
export const lastingOrigin = (here: string = window.location.origin) =>
  lastingOriginFor(here, { beta: IS_BETA, main: MAIN_SITE_ORIGIN });
