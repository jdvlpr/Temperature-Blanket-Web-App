import { expect, test, type Page } from '@playwright/test';

/** The colorway results, as cards or list rows */
const colorways = (page: Page) => page.getByRole('listitem');

/** A card's or row's "more" (⋮) button, which opens its link and copy options */
const moreMenuButtons = (page: Page) =>
  page.getByRole('button', { name: /^More for / });

/** Switch the results to the list, through the View menu */
const showList = async (page: Page) => {
  await page.getByRole('button', { name: /^View: / }).click();
  await page.getByRole('menuitemradio', { name: 'List' }).click();
  await expect(page.getByRole('button', { name: /^View: / })).toHaveText(
    /List/,
  );
};

test.describe('Yarn Colorway Finder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/yarn-colorway-finder');
  });

  test('Page loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle('Yarn Colorway Finder');
    await expect(page.getByText('Find Yarn by Color')).toBeVisible();
    await expect(page.getByText('Search by Color')).toBeVisible();
  });

  test('Search by Color Name works', async ({ page }) => {
    const searchInput = page.getByPlaceholder('e.g., Wisteria, Cream');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Cream');

    // Wait for results to update - looking for a result that contains "Cream"
    await expect(
      colorways(page).filter({ hasText: 'Cream' }).first(),
    ).toBeVisible();
  });

  test('Search by Hex Code works', async ({ page }) => {
    const hexInput = page.getByPlaceholder('e.g., pink, #c3f4d2');
    await expect(hexInput).toBeVisible();
    // Use a hex code close to "Cream" (#FFFDD0) to ensure we get matches
    await hexInput.fill('#FFFDD0');
    // The color is read as it's typed (on key up)
    await hexInput.press('End');

    // Verify that the hex input value updates
    await expect(hexInput).toHaveValue('#FFFDD0');

    // Verify results are filtered/sorted by color match
    // We expect "Cream" to be one of the top results
    await expect(
      colorways(page).filter({ hasText: 'Cream' }).first(),
    ).toBeVisible();

    // Also check for the match percentage text which appears when searching by hex
    // await expect(page.getByText(/Match/).first()).toBeVisible();
  });

  test("A card's more menu has its link and copy options", async ({ page }) => {
    await page.getByPlaceholder('e.g., Wisteria, Cream').fill('Cream');
    const more = moreMenuButtons(page).first();
    await more.click();

    const link = page.getByRole('menuitem', {
      name: /Buy this colorway|View on |View this colorway/,
    });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(
      page.getByRole('menuitem', { name: /Copy name/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: /Copy hex #/ }),
    ).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(link).toBeHidden();
    await expect(more).toBeFocused();
  });

  test("The more menu's link opens by keyboard", async ({ page, context }) => {
    // Don't load the shop itself, just see that the new tab opens
    await context.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
    await page.getByPlaceholder('e.g., Wisteria, Cream').fill('Cream');
    await moreMenuButtons(page).first().focus();
    await page.keyboard.press('Enter');
    const link = page.getByRole('menuitem', {
      name: /Buy this colorway|View on |View this colorway/,
    });
    await expect(link).toBeVisible();

    const popup = context.waitForEvent('page');
    await link.focus();
    await page.keyboard.press('Enter');
    await popup;
  });

  test('List view rows have the more menu', async ({ page }) => {
    await page.getByPlaceholder('e.g., Wisteria, Cream').fill('Cream');
    await showList(page);
    await expect(
      colorways(page).filter({ hasText: 'Cream' }).first(),
    ).toBeVisible();
    await moreMenuButtons(page).first().click();
    await expect(
      page.getByRole('menuitem', {
        name: /Buy this colorway|View on |View this colorway/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: /Copy hex #/ }),
    ).toBeVisible();
  });

  test('A color search sorts by best match, and other sorts can be chosen', async ({
    page,
  }) => {
    const colorInput = page.getByPlaceholder('e.g., pink, #c3f4d2');
    await colorInput.fill('#FFFDD0');
    // The color is read as it's typed (on key up)
    await colorInput.press('End');
    const sortButton = page.getByRole('button', { name: /^Sort: / });
    await expect(sortButton).toHaveText(/Best match/);
    await expect(page.getByText(/close match/)).toBeVisible();

    await sortButton.click();
    const reverse = page.getByRole('menuitemcheckbox', { name: 'Reverse' });
    await expect(reverse).toBeDisabled();
    await page.getByRole('menuitemradio', { name: 'Lightness' }).click();
    await expect(sortButton).toHaveText(/Lightness/);

    // Reverse stays on when the sort changes
    await sortButton.click();
    await reverse.click();
    await expect(reverse).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Escape');
    await expect(sortButton).toHaveText(/Lightness, reversed/);
    await sortButton.click();
    await page.getByRole('menuitemradio', { name: 'Name' }).click();
    await expect(sortButton).toHaveText(/Name, reversed/);
  });

  test('Show More adds to the end without moving the first colorways', async ({
    page,
  }) => {
    const sortButton = page.getByRole('button', { name: /^Sort: / });
    await expect(sortButton).toHaveText(/Hue/);
    await sortButton.click();
    await expect(
      page.getByRole('menuitemradio', { name: 'Best match' }),
    ).toHaveCount(0);
    await page.getByRole('menuitemradio', { name: 'Lightness' }).click();

    const first = await colorways(page).first().textContent();
    const shown = await colorways(page).count();
    await page.getByRole('button', { name: 'Show More' }).click();
    await expect(colorways(page)).toHaveCount(shown * 2);
    expect(await colorways(page).first().textContent()).toBe(first);
  });

  test('A shared link keeps its sort', async ({ page }) => {
    await page.goto('/yarn-colorway-finder?n=Cream&s=name&r=1');
    await expect(page.getByRole('button', { name: /^Sort: / })).toHaveText(
      /Name, reversed/,
    );
  });
});
