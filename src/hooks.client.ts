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

// In the beta, errors are noted in memory (#lib/utils/recent-errors.ts) so
// Send Feedback can include them. Every build still logs them as before.

import type { HandleClientError } from '@sveltejs/kit/hooks';
import { noteError, watchErrors } from '#lib/utils/recent-errors.js';

if (__SITE_BETA__) watchErrors();

export const handleError: HandleClientError = ({ error }) => {
  console.error(error);
  if (__SITE_BETA__) noteError(error);
};
