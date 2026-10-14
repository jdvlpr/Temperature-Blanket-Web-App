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

// The "Anonymous" option on a published gallery page (stored the other way
// round, as `showOwner`): under it in a menu, what it means for that page.

/** One short line: whether the page names the owner and is on their public gallery page */
export const anonymousDetail = (anonymous: boolean, ownerName: string) =>
  anonymous
    ? 'No name; not on your public gallery page'
    : ownerName
      ? `“By ${ownerName}”, on your public gallery page`
      : 'Add a display name to be credited';
