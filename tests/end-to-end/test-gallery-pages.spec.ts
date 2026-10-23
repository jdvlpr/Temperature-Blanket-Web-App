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
    const projectLink = page
      .locator('a[href^="/gallery/"]')
      .filter({ has: page.getByAltText('Preview', { exact: true }) })
      .first();
    const href = await projectLink.getAttribute('href', { timeout: 15000 });
    await page.goto(href!);
    await page.waitForSelector('#top-navbar', { timeout: 5000 });

    // Check for the presence of the main image
    await expect(page.getByAltText('Project Preview')).toBeVisible();

    // The project's details open in a dialog from the "About" button.
    await page.getByRole('button', { name: 'About this project' }).click();
    await expect(
      page.getByRole('heading', { name: 'About this project' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');

    // Check for the share/open buttons or similar.
    // The "Open in Project Planner" button is a good candidate if valid.
    // Or just check for the back link.
    await expect(
      page.getByRole('link', { name: 'Project Gallery' }),
    ).toBeVisible();
  });
});
