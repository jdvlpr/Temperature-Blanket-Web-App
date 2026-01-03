// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
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
    await page.goto('/gallery/12423');
    await page.waitForSelector('#top-navbar', { timeout: 5000 });
    
    // Check for the presence of the main image
    await expect(page.getByAltText('Project Preview')).toBeVisible();
    
    // Check for "About this Project" section
    await expect(page.getByText('About this Project')).toBeVisible();
    
    // Check for the share/open buttons or similar. 
    // The "Open in Project Planner" button is a good candidate if valid.
    // Or just check for the back link.
    await expect(page.getByRole('link', { name: 'Project Gallery' })).toBeVisible();
  });
});
