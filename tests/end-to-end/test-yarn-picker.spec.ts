import { expect, test, type Page } from '@playwright/test';

// The yarn picker, in the Random colors dialog

async function openRandom(page: Page, baseURL: string | undefined) {
  // Pre-seed the analytics-consent cookies so the consent toast can't cover buttons
  const url = baseURL ?? 'https://localhost:4173';
  await page.context().addCookies([
    { name: '_clck', value: '1', url },
    { name: '_clsk', value: '1', url },
  ]);
  await page.goto('/yarn');
  await expect(
    page.getByRole('heading', { name: 'Design a Yarn Palette' }),
  ).toBeVisible();
  await expect(async () => {
    await page.getByRole('button', { name: 'Get Colors' }).click();
    await page.getByRole('menuitem', { name: /^Random/ }).click({
      timeout: 1000,
    });
  }).toPass();
  await expect(
    page.getByRole('heading', { name: 'Generate Random Colors' }),
  ).toBeVisible();
}

test.describe('Yarn picker', () => {
  test.beforeEach(async ({ page, baseURL }) => openRandom(page, baseURL));

  test('searches, and picks a yarn or a whole brand', async ({ page }) => {
    const field = page.getByRole('combobox', { name: 'Yarn Name' });
    await expect(field).toHaveAttribute('placeholder', /^\d+ Yarns \(/);

    await field.click();
    const list = page.getByRole('listbox');
    await expect(list).toBeVisible();

    await field.fill('basic stitch');
    await expect(list.getByRole('option').first()).toHaveText(/^Lion Brand/);
    await list
      .getByRole('option', { name: /^Basic Stitch Anti Pilling/ })
      .click();
    await expect(field).toHaveValue(
      'Lion Brand - Basic Stitch Anti Pilling (Worsted)',
    );
    await expect(list).toBeHidden();

    // Opening again shows everything, with the pick marked
    await field.click();
    await expect(
      list.getByRole('option', { name: /^Basic Stitch Anti Pilling/ }),
    ).toHaveAttribute('aria-selected', 'true');
    await list.getByRole('option', { name: /^Bernat/ }).click();
    await expect(field).toHaveValue('Bernat (5 yarns)');

    await page
      .getByRole('button', { name: 'Clear', exact: true })
      .first()
      .click();
    await expect(field).toHaveValue('');
  });

  test('works from the keyboard', async ({ page }) => {
    const field = page.getByRole('combobox', { name: 'Yarn Name' });
    await field.fill('basic stitch');
    await field.press('ArrowDown');
    await field.press('ArrowDown');
    await field.press('Enter');
    await expect(field).toHaveValue(/^Lion Brand - Basic Stitch/);

    // Escape closes the list, not the dialog
    await field.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await field.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(
      page.getByRole('heading', { name: 'Generate Random Colors' }),
    ).toBeVisible();
  });

  test('keeps to the chosen yarn weight', async ({ page }) => {
    await page.getByRole('combobox', { name: /Yarn Weight/ }).selectOption('w');
    const field = page.getByRole('combobox', { name: 'Yarn Name' });
    await field.click();
    const weights = await page
      .getByRole('listbox')
      .getByRole('option')
      .filter({ hasNotText: /yarns?,/ })
      .allInnerTexts();
    expect(weights.length).toBeGreaterThan(0);
    for (const text of weights) expect(text).toContain('Worsted');
  });
});

test.describe('Yarn picker on a phone', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test.beforeEach(async ({ page, baseURL }) => openRandom(page, baseURL));

  test('opens a full-screen search', async ({ page }) => {
    await page.getByRole('button', { name: /^Yarn Name/ }).tap();
    const search = page.getByRole('dialog', { name: 'Choose Yarn' });
    await expect(search).toBeVisible();
    const field = search.getByRole('combobox');
    await expect(field).toBeFocused();

    await field.fill('basic stitch');
    await search
      .getByRole('option', { name: /^Basic Stitch Anti Pilling/ })
      .tap();
    await expect(search).toBeHidden();
    await expect(
      page.getByRole('button', { name: /^Yarn Name/ }),
    ).toContainText('Lion Brand - Basic Stitch Anti Pilling (Worsted)');

    // Back without picking keeps the pick
    await page.getByRole('button', { name: /^Yarn Name/ }).tap();
    await expect(search).toBeVisible();
    await search.getByRole('button', { name: 'Back' }).tap();
    await expect(search).toBeHidden();
    await expect(
      page.getByRole('button', { name: /^Yarn Name/ }),
    ).toBeFocused();
    await expect(
      page.getByRole('button', { name: /^Yarn Name/ }),
    ).toContainText('Basic Stitch Anti Pilling');
  });
});
