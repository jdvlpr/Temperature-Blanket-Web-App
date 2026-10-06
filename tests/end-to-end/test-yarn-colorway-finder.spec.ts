import { expect, test, type Page } from '@playwright/test';

/** Each colorway's name, a button that copies it, in cards and list rows */
const colorwayNames = (page: Page) =>
  page.locator('button[aria-label^="Copy name"]');

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
      colorwayNames(page).filter({ hasText: 'Cream' }).first(),
    ).toBeVisible();
  });

  test('Search by Hex Code works', async ({ page }) => {
    const hexInput = page.getByPlaceholder('e.g., pink, #c3f4d2');
    await expect(hexInput).toBeVisible();
    // Use a hex code close to "Cream" (#FFFDD0) to ensure we get matches
    await hexInput.fill('#FFFDD0');

    // Verify that the hex input value updates
    await expect(hexInput).toHaveValue('#FFFDD0');

    // Verify results are filtered/sorted by color match
    // We expect "Cream" to be one of the top results
    await expect(
      colorwayNames(page).filter({ hasText: 'Cream' }).first(),
    ).toBeVisible();

    // Also check for the match percentage text which appears when searching by hex
    // await expect(page.getByText(/Match/).first()).toBeVisible();
  });

  test('Cards have a button to copy the hex code', async ({ page }) => {
    await page.getByPlaceholder('e.g., Wisteria, Cream').fill('Cream');
    await expect(
      page.getByRole('button', { name: /Copy hex code #/ }).first(),
    ).toBeVisible();
  });

  test('List view shows actions on each row', async ({ page }) => {
    await page.getByPlaceholder('e.g., Wisteria, Cream').fill('Cream');
    await page.getByText('List', { exact: true }).click();
    await expect(
      page.getByRole('button', { name: /Copy name .*Cream/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Copy hex code #/ }).first(),
    ).toBeVisible();
  });
});
