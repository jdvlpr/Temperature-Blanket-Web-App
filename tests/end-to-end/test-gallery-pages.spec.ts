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

import { expect, test } from '@playwright/test';

test.describe('Project Gallery Pages', () => {
  test('Project Gallery Page loads', async ({ page }) => {
    // Take a project from the gallery list rather than a fixed ID, so the
    // test works against whichever WordPress site the build points at.
    await page.goto('/gallery');
    // The card pictures are decorative, so take the card's name link, which
    // says when the project was published
    const projectLink = page
      .locator('a[href^="/gallery/"]')
      .filter({ hasText: /Published/ })
      .first();
    const href = await projectLink.getAttribute('href', { timeout: 15000 });
    await page.goto(href!);
    await page.waitForSelector('#top-navbar', { timeout: 5000 });

    // Check for the presence of the main image
    await expect(page.getByAltText('Project Preview')).toBeVisible();

    // Each gauge links to its yarn palette
    await expect(
      page.getByRole('link', { name: /yarn palette/i }).first(),
    ).toBeVisible();

    // Check for the share/open buttons or similar.
    // The "Open a Copy" button is a good candidate if valid.
    // Or just check for the back link.
    await expect(
      page.getByRole('link', { name: 'Project Gallery' }),
    ).toBeVisible();
  });
});
