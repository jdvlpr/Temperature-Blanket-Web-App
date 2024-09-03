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

test('Project Planner works correctly', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('toast').locator('div').nth(3).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByPlaceholder('Enter a place')).toBeVisible();
  await page.getByPlaceholder('Enter a place').click();
  await page.getByPlaceholder('Enter a place').fill('Austin');
  await page
    .getByRole('option', { name: 'Austin, Texas, United States' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Add Location' }),
  ).toBeVisible();
  await page
    .getByLabel(
      'Year 202420232022202120202019201820172016201520142013201220112010200920082007200620052004200320022001200019991998199719961995199419931992199119901989198819871986198519841983198219811980197919781977197619751974197319721971197019691968196719661965196419631962196119601959195819571956195519541953195219511950194919481947194619451944194319421941194019391938193719361935193419331932193119301929192819271926192519241923192219211920',
      { exact: true },
    )
    .selectOption('2022');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('°C / mm °F / in')).toBeVisible();
  await page.getByText('Details', { exact: true }).click();
  await expect(
    page
      .locator('label')
      .filter({ hasText: 'Show Color Details' })
      .locator('div'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Download Weather Data (CSV)',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Import Weather Data' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Colors' }).nth(1).click();
  await expect(
    page.getByRole('button', { name: 'Browse Palettes' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Browse Palettes' }).click();
  await expect(page.getByTitle('Featured')).toBeVisible();
  await expect(page.getByTitle('Gallery', { exact: true })).toBeVisible();
  await page
    .getByLabel('1 Color 2 Colors 3 Colors 4')
    .first()
    .selectOption('6');
  await page
    .locator('button:nth-child(8) > div > div > div:nth-child(6) > .w-full')
    .click();
  await expect(
    page.getByRole('button', { name: 'Configure Ranges' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Find Matching Yarn #a6cee3' })
    .click();
  await expect(page.getByTitle('Enter a Color').getByLabel('')).toBeVisible();
  await page
    .locator('button')
    .filter({ hasText: 'Knit Picks - Mighty Stitch' })
    .click();
  await page.getByTitle('Save', { exact: true }).click();
  await expect(
    page.getByRole('button', {
      name: 'Knit Picks - Mighty Stitch Sky',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Download Gauges and Weather',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Preview' }).nth(1).click();
  await expect(page.getByRole('button', { name: 'Calendar' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Download Image (PNG)' }),
  ).toBeVisible();
});
