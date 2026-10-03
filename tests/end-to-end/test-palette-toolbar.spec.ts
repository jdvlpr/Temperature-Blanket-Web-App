import { expect, test } from '@playwright/test';

test.describe('Palette toolbar', () => {
  test.beforeEach(async ({ page, context, baseURL }) => {
    // Pre-seed the analytics-consent cookies so the consent toast can't cover buttons
    const url = baseURL ?? 'https://localhost:4173';
    await context.addCookies([
      { name: '_clck', value: '1', url },
      { name: '_clsk', value: '1', url },
    ]);
    await page.goto('/yarn');
    await expect(
      page.getByRole('heading', { name: 'Design a Yarn Palette' }),
    ).toBeVisible();
  });

  test('Get Colors lists every color source', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Colors' }).click();
    for (const name of [
      'Browse Palettes',
      'Choose Colorways',
      'From an Image',
      'Random',
      'Paste Colors or Code',
    ]) {
      await expect(
        page.getByRole('menuitem', { name: new RegExp(name) }),
      ).toBeVisible();
    }
  });

  test('Save & Export lists saving and every export', async ({ page }) => {
    await page.getByRole('button', { name: 'Save & Export' }).click();
    for (const name of ['Save Palette', 'Link', 'HTML Color Codes', 'Image']) {
      await expect(
        page.getByRole('menuitem', { name: new RegExp(`^${name}`) }),
      ).toBeVisible();
    }

    // Each export opens straight on its format, with no list to go back to
    await page.getByRole('menuitem', { name: /^HTML Color Codes/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'HTML Color Codes' }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Copy HTML Color Codes' }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'All Export Options' }),
    ).toHaveCount(0);
  });

  test('Image opens a preview to download', async ({ page }) => {
    await page.getByRole('button', { name: 'Save & Export' }).click();
    await page.getByRole('menuitem', { name: /^Image/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Palette Image' }),
    ).toBeVisible();
    const preview = dialog.getByRole('img', { name: 'Palette preview' });
    await expect(preview).toBeVisible();
    // Always 1080 wide; Square is 1080 tall
    await dialog.getByLabel('Shape').selectOption('square');
    await expect
      .poll(() =>
        preview.evaluate((img: HTMLImageElement) => img.naturalHeight),
      )
      .toBe(1080);
    expect(
      await preview.evaluate((img: HTMLImageElement) => img.naturalWidth),
    ).toBe(1080);

    const download = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Download' }).click();
    expect((await download).suggestedFilename()).toMatch(/\.png$/);
  });

  test('paste colors into the palette', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Colors' }).click();
    await page.getByRole('menuitem', { name: /Paste Colors or Code/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Paste Colors or Code' }),
    ).toBeVisible();
    const field = dialog.getByLabel('Colors, a code, or a link');
    // What can't be read is named, and the rest is kept
    await field.fill('red, orange, blu');
    await expect(dialog.getByText('blu', { exact: true })).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Use 2 Colors' }),
    ).toBeEnabled();
    // One color per line, as from a spreadsheet
    await field.fill('red\norange\nblue');
    await dialog.getByRole('button', { name: 'Use 3 Colors' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // The pasted colors are now the palette; Link copies it straight away
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Save & Export' }).click();
    await page.getByRole('menuitem', { name: /^Link/ }).click();
    await expect(page.getByText('Palette link copied')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
      /\/yarn\?s=ff0000ffa5000000ff/,
    );
  });

  test('old palette codes can still be pasted', async ({ page }) => {
    // The Palette Code export was removed, but codes people saved still work
    await page.getByRole('button', { name: 'Get Colors' }).click();
    await page.getByRole('menuitem', { name: /Paste Colors or Code/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByLabel('Colors, a code, or a link')
      .fill('palette:ff0000ffa500');
    await expect(
      dialog.getByRole('button', { name: 'Use 2 Colors' }),
    ).toBeEnabled();
  });

  test('a menu item chosen with the keyboard opens its dialog', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Get Colors' }).focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('menuitem', { name: /Browse Palettes/ }),
    ).toBeVisible();
    // Keys pressed before the menu takes focus go nowhere
    await expect(page.getByRole('menu', { name: 'Get Colors' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('Browse Palettes shows categories as a grid on phones', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.getByRole('button', { name: 'Get Colors' }).click();
    await page.getByRole('menuitem', { name: /Browse Palettes/ }).click();

    const dialog = page.getByRole('dialog');
    const categories = dialog.getByRole('group', { name: 'Category' });
    await expect(categories.getByRole('button')).toHaveCount(4);
    await categories.getByRole('button', { name: 'Saved' }).click();
    await expect(
      categories.getByRole('button', { name: 'Saved' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.getByText('No saved palettes yet')).toBeVisible();
  });
});
