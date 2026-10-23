import { expect, test, type Page } from '@playwright/test';

/** Open Save Palette from the Palette menu. A click before the page finishes
 * loading does nothing, so it's retried until the dialog opens. */
const openSavePalette = async (page: Page) => {
  const name = page.getByLabel('Name (optional)');
  await expect(async () => {
    if (!(await page.getByTestId('menu-save-palette').isVisible()))
      await page.getByTestId('palette-button').click({ timeout: 1000 });
    await page.getByTestId('menu-save-palette').click({ timeout: 1000 });
    await expect(name).toBeVisible({ timeout: 1000 });
  }).toPass();
};

test.describe('Saved palettes', () => {
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

  test('save, reload, delete with undo, and use a palette', async ({
    page,
  }) => {
    // Save with a name, from the Palette menu
    await openSavePalette(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name (optional)').fill('Test Sunset');
    await dialog
      .getByRole('button', { name: 'Save Palette', exact: true })
      .click();
    await expect(page.getByText('Palette saved')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // The same palette isn't saved twice (opened fresh, it isn't open yet)
    await page.goto('/yarn');
    await openSavePalette(page);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Save Palette', exact: true })
      .click();
    await expect(page.getByText('This palette is already saved')).toBeVisible();

    // It survives a reload, and is edited and trashed on My Palettes
    await page.goto('/my-palettes');
    let list = page.getByRole('list', { name: 'Saved palettes' });
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await list.getByRole('button', { name: 'More for Test Sunset' }).click();
    await expect(
      page.getByRole('menuitem', { name: 'Edit in Yarn Palette Creator' }),
    ).toHaveAttribute('href', /\/yarn\?s=/);
    await expect(page.getByRole('menuitem', { name: 'Rename' })).toHaveCount(0);
    // Retried: the menu takes the key once focus has moved into it
    await expect(async () => {
      await page.keyboard.press('Escape');
      await expect(
        page.getByRole('menuitem', { name: 'Edit in Yarn Palette Creator' }),
      ).toBeHidden({ timeout: 500 });
    }).toPass();
    await expect(list.getByText('Test Sunset')).toBeVisible();

    // Delete, then undo
    await list.getByRole('button', { name: 'More for Test Sunset' }).click();
    await page.getByRole('menuitem', { name: 'Move to Trash' }).click();
    await expect(page.getByText('No saved palettes yet')).toBeVisible();
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(list.getByText('Test Sunset')).toBeVisible();

    // The Palette menu's Open lists it, finds it, and opens it here
    await page.goto('/yarn');
    const paletteButton = page.getByTestId('palette-button');
    await expect(paletteButton).toHaveAttribute(
      'data-save-status',
      'Not saved',
    );
    await paletteButton.click();
    const menu = page.getByRole('dialog', { name: 'Palette' });
    await menu.getByTestId('menu-open').click();
    const open = page.getByRole('dialog');
    await open.getByLabel('Search palettes').fill('nothing like it');
    await expect(open.getByText('No palettes match')).toBeVisible();
    await open.getByLabel('Search palettes').fill('sunset');
    await open.getByRole('button', { name: /^Test Sunset/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(paletteButton).toHaveAttribute(
      'data-save-status',
      'Saved in this browser',
    );

    // Move to Trash starts a new palette; Undo brings it back here
    await paletteButton.click();
    await page.getByTestId('trash-palette').click();
    await expect(
      page.getByText('Moved Test Sunset to the Trash'),
    ).toBeVisible();
    await expect(paletteButton).toHaveAttribute(
      'data-save-status',
      'Not saved',
    );
    await page
      .getByTestId('toast')
      .getByRole('button', { name: 'Undo' })
      .click();
    await expect(paletteButton).toHaveAttribute(
      'data-save-status',
      'Saved in this browser',
    );

    // New Palette leaves it in My Palettes
    await paletteButton.click();
    await menu.getByRole('button', { name: /^New Palette/ }).click();
    await expect(paletteButton).toHaveAttribute(
      'data-save-status',
      'Not saved',
    );

    // Not saved, New Palette is a step Undo takes back
    await page.getByRole('button', { name: 'Sort', exact: true }).click();
    await page.getByRole('menuitem', { name: /^Reverse/ }).click();
    await expect(page.locator('#undo')).toBeEnabled();
    const reversed = page.url();
    await paletteButton.click();
    await menu.getByRole('button', { name: /^New Palette/ }).click();
    await expect(page).not.toHaveURL(reversed);
    await page.locator('#undo').click();
    await expect(page).toHaveURL(reversed);
  });

  test('a name in the link is offered by Save Palette, for those colors', async ({
    page,
  }) => {
    await page.goto('/yarn?s=ff000000ff000000ff&name=Gallery%20Sunset');
    await openSavePalette(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Name (optional)')).toHaveValue(
      'Gallery Sunset',
    );
    // Back to the menu, then closed
    await expect(async () => {
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 500 });
    }).toPass();

    // Other colors are another palette: no name
    await page.getByRole('button', { name: 'Sort', exact: true }).click();
    await page.getByRole('menuitem', { name: /^Reverse/ }).click();
    await openSavePalette(page);
    await expect(
      page.getByRole('dialog').getByLabel('Name (optional)'),
    ).toHaveValue('');
  });

  test('Copy Link copies a link that opens the palette', async ({ page }) => {
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);
    // Retried: a click before the page finishes loading does nothing
    await expect(async () => {
      await page.getByTestId('palette-button').click();
      // Right in the Palette menu, with no Share step
      await page
        .getByRole('dialog', { name: 'Palette' })
        .getByRole('button', { name: /^Copy Link/ })
        .click({ timeout: 1000 });
    }).toPass();
    await expect(page.getByText('Link copied')).toBeVisible();

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    const url = new URL(copied.trim());
    expect(url.pathname).toBe('/yarn');
    expect(url.searchParams.get('s')).toMatch(/^([0-9a-f]{6})+$/i);
  });
});
