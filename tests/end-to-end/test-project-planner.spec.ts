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

import { test, expect } from '@playwright/test';

test.describe('Project Planner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Close any initial toasts or dialogs if they appear consistently
    // The original test clicked a toast, we'll keep that if it's a consistent blocker,
    // but usually it's better to handle it conditionally or ignore if not blocking.
    // Assuming the toast click was to dismiss a "welcome" or "update" message.
    // We'll try to be robust.
    const toastClose = page
      .getByTestId('toast')
      .locator('button[aria-label="Close"]');
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
        'Year 20262025202420232022202120202019201820172016201520142013201220112010200920082007200620052004200320022001200019991998199719961995199419931992199119901989198819871986198519841983198219811980197919781977197619751974197319721971197019691968196719661965196419631962196119601959195819571956195519541953195219511950194919481947194619451944194319421941194019391938193719361935193419331932193119301929192819271926192519241923192219211920',
        { exact: true },
      )
      .selectOption('2022');

    // 4. Search
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    // 5. Verify Results
    await expect(page.getByText('°C / mm °F / in')).toBeVisible();
  });

  test('Tab Navigation', async ({ page }) => {
    // Perform a search first to populate tabs (needed for Colors/Preview to be meaningful usually)
    await page.getByPlaceholder('Enter a place').click();
    await page.getByPlaceholder('Enter a place').fill('Austin');
    const option = page.getByRole('option', {
      name: 'Austin, Texas, United States',
    });
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

    // Go to Preview Tab
    await page.getByRole('button', { name: 'Preview' }).nth(1).click();
    await expect(page.getByRole('button', { name: 'Calendar' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Download Image (PNG)' }),
    ).toBeVisible();
  });

  test('Shared-URL preview restore and Undo/Redo (B2 async preview lazy-load)', async ({
    page,
    context,
  }) => {
    // Pre-seed the analytics-consent cookies so the app's persistent,
    // non-auto-dismissing consent toast (bottom-anchored, same collision zone as
    // the fixed bottom-section-nav tab bar) never renders and can't intercept
    // clicks below -- re-navigate so this take effect on the page from
    // `beforeEach`, not just pages created later in this test.
    await context.addCookies([
      { name: '_clck', value: '1', url: 'https://localhost:4173' },
      { name: '_clsk', value: '1', url: 'https://localhost:4173' },
    ]);
    await page.goto('/');

    // 1. Build a project with a non-default preview ("Rows" is the default; switch to "Calendar").
    await page.getByPlaceholder('Enter a place').click();
    await page.getByPlaceholder('Enter a place').fill('Austin');
    await page
      .getByRole('option', { name: 'Austin, Texas, United States' })
      .click();
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('°C / mm °F / in')).toBeVisible();

    const toast = page.getByTestId('toast');
    if (await toast.isVisible()) {
      const closeButton = toast.locator('button').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(200);
      }
    }

    // The bottom section-nav tab bar renders exactly one button per section, but
    // several other elements on the page also have "Weather"/"Colors"/"Preview"
    // as a substring of their accessible name (e.g. "Weather Source: Open-Meteo"),
    // so scope to the tab bar's own container instead of matching by name alone.
    const tabBar = page.locator('#bottom-section-nav');
    await tabBar.getByRole('button', { name: 'Colors', exact: true }).click();
    await tabBar.getByRole('button', { name: 'Preview', exact: true }).click();
    await page
      .locator('#select-pattern-type')
      .selectOption({ label: 'Calendar' });
    await expect(page.locator('#select-pattern-type')).toHaveValue('clnr');

    // 2. Save -- this is the app's own mechanism for writing the current project
    // state into a shareable URL (SaveProjectModal calls replaceState on mount).
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByText(/Saved Locally|problem saving your project/),
    ).toBeVisible();
    const savedUrl = page.url();
    expect(savedUrl).toContain('#');

    // 3. Restore in a brand-new tab -- reusing the same tab can be intercepted by
    // SvelteKit's client-side router as a same-document navigation and never
    // re-run onMount/loadProjectFromURL, which would make this test pass
    // vacuously even if the async restore path were broken. (Consent cookies
    // seeded above already cover this new page -- they're context-scoped.)
    const restoredPage = await context.newPage();
    restoredPage.on('dialog', (dialog) => dialog.accept());
    await restoredPage.goto(savedUrl);
    // A restored project lands on the Location tab, not Weather -- confirm the
    // restore actually happened before navigating to Colors/Preview.
    await expect(
      restoredPage.getByText('Loaded project and weather data'),
    ).toBeVisible();

    const restoredTabBar = restoredPage.locator('#bottom-section-nav');
    await restoredTabBar
      .getByRole('button', { name: 'Weather', exact: true })
      .click();
    await expect(restoredPage.getByText('°C / mm °F / in')).toBeVisible();

    await restoredTabBar
      .getByRole('button', { name: 'Colors', exact: true })
      .click();
    await restoredTabBar
      .getByRole('button', { name: 'Preview', exact: true })
      .click();
    await expect(restoredPage.locator('#select-pattern-type')).toHaveValue(
      'clnr',
    );

    // 4. Undo/Redo must both be disabled immediately after a fresh restore --
    // no user edits have happened yet on this page.
    const undoButton = restoredPage.locator('#undo');
    const redoButton = restoredPage.locator('#redo');
    await expect(undoButton).toBeDisabled();
    await expect(redoButton).toBeDisabled();

    // 5. Switching the pattern is a new edit -- Undo should enable, and Undo must
    // restore the true pristine preview (Calendar), not a default/broken one.
    await restoredPage
      .locator('#select-pattern-type')
      .selectOption({ label: 'Chevrons' });
    await expect(restoredPage.locator('#select-pattern-type')).toHaveValue(
      'chev',
    );
    await expect(undoButton).toBeEnabled();

    await undoButton.click();
    await expect(restoredPage.locator('#select-pattern-type')).toHaveValue(
      'clnr',
    );
    await expect(undoButton).toBeDisabled();
    await expect(redoButton).toBeEnabled();

    // 6. Redo restores the discarded edit.
    await redoButton.click();
    await expect(restoredPage.locator('#select-pattern-type')).toHaveValue(
      'chev',
    );
    await expect(redoButton).toBeDisabled();

    await restoredPage.close();
  });
});
