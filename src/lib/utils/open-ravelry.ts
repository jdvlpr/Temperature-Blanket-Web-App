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

// Whether a saved project can go to Ravelry: it has to be in the account.

import { account } from '#lib/accounts/summary.svelte.js';
import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';

/** Whether the project is in the account, which posting to Ravelry needs. */
export const inAccount = (item: StoredProjectIndexItem) =>
  !!item.sync && item.sync.ownerUserId === account.summary?.id;
