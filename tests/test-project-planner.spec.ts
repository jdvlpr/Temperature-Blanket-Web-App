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

import { test, expect } from '@playwright/test';

test.describe('Project Planner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Close any initial toasts or dialogs if they appear consistently
    // The original test clicked a toast, we'll keep that if it's a consistent blocker,
    // but usually it's better to handle it conditionally or ignore if not blocking.
    // Assuming the toast click was to dismiss a "welcome" or "update" message.
    // We'll try to be robust.
    const toastClose = page.getByTestId('toast').locator('button[aria-label="Close"]');
    if (await toastClose.isVisible()) {
        await toastClose.click();
    }
  });

  test('Loads successfully', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter a place')).toBeVisible();
  });

  test('Create Project Flow', async ({ page }) => {
    // 1. Enter Location
    await page.getByPlaceholder('Enter a place').click();
    await page.getByPlaceholder('Enter a place').fill('Austin');
    await page
      .getByRole('option', { name: 'Austin, Texas, United States' })
      .click();
    
    // 2. Verify "Add Location" appears (confirming selection)
    await expect(
      page.getByRole('button', { name: 'Add Location' }),
    ).toBeVisible();

    // 3. Select Year
    await page
      .getByLabel(
        'Year 2025202420232022202120202019201820172016201520142013201220112010200920082007200620052004200320022001200019991998199719961995199419931992199119901989198819871986198519841983198219811980197919781977197619751974197319721971197019691968196719661965196419631962196119601959195819571956195519541953195219511950194919481947194619451944194319421941194019391938193719361935193419331932193119301929192819271926192519241923192219211920',
        { exact: true },
      )
      .selectOption('2022');

    // 4. Search
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    // 5. Verify Results
    await expect(page.getByText('°C / mm °F / in')).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Download Weather Data (CSV)',
      }),
    ).toBeVisible();
  });

  test('Tab Navigation', async ({ page }) => {
    // Perform a search first to populate tabs (needed for Colors/Preview to be meaningful usually)
    await page.getByPlaceholder('Enter a place').click();
    await page.getByPlaceholder('Enter a place').fill('Austin');
    const option = page.getByRole('option', { name: 'Austin, Texas, United States' });
    await expect(option).toBeVisible();
    await option.click();
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('°C / mm °F / in')).toBeVisible();

    // Dismiss any toasts that might block interactions
    const toast = page.getByTestId('toast');
    if (await toast.isVisible()) {
      const closeButton = toast.locator('button').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(200); // Brief wait for toast to dismiss
      }
    }

    // Go to Colors Tab (using nth(1) as there are 2 "Colors" buttons)
    await page.getByRole('button', { name: 'Colors' }).nth(1).click();
    await expect(
      page.getByRole('button', { name: 'Browse Palettes' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Download Gauges and Weather',
      }),
    ).toBeVisible();

    // Go to Preview Tab
    await page.getByRole('button', { name: 'Preview' }).nth(1).click();
    await expect(page.getByRole('button', { name: 'Calendar' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Download Image (PNG)' }),
    ).toBeVisible();
  });
});
