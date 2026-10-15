import { expect, test } from '@playwright/test';

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

  test('save, reload, rename, delete with undo, and use a palette', async ({
    page,
  }) => {
    // Save with a name
    await page.getByRole('button', { name: 'Save & Export' }).click();
    await page.getByRole('menuitem', { name: /^Save Palette/ }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name (optional)').fill('Test Sunset');
    await dialog
      .getByRole('button', { name: 'Save Palette', exact: true })
      .click();
    await expect(page.getByText('Palette saved')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // The same palette isn't saved twice
    await page.getByRole('button', { name: 'Save & Export' }).click();
    await page.getByRole('menuitem', { name: /^Save Palette/ }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Save Palette', exact: true })
      .click();
    await expect(page.getByText('This palette is already saved')).toBeVisible();

    // It survives a reload
    await page.reload();
    await page.getByRole('button', { name: 'Get Colors' }).click();
    await page.getByRole('menuitem', { name: /Browse Palettes/ }).click();
    dialog = page.getByRole('dialog');
    // The hidden phone dropdown also has a "Saved" option
    await dialog
      .getByText('Saved', { exact: true })
      .filter({ visible: true })
      .click();
    const list = dialog.getByRole('list', { name: 'Saved palettes' });
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await expect(list.getByText('Test Sunset')).toBeVisible();

    // Rename
    await list.getByRole('button', { name: 'More for Test Sunset' }).click();
    await page.getByRole('menuitem', { name: 'Rename' }).click();
    await list.getByLabel('Palette name').fill('Test Dusk');
    await list.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(list.getByText('Test Dusk')).toBeVisible();

    // Delete, then undo
    await list.getByRole('button', { name: 'More for Test Dusk' }).click();
    await page.getByRole('menuitem', { name: 'Move to Trash' }).click();
    await expect(dialog.getByText('No saved palettes yet')).toBeVisible();
    await dialog.getByRole('button', { name: 'Undo' }).click();
    await expect(list.getByText('Test Dusk')).toBeVisible();

    // Use it with its button (the name in the label): the dialog closes
    await list.getByRole('button', { name: 'Use Test Dusk' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('a name in the link is offered by Save Palette, for those colors', async ({
    page,
  }) => {
    await page.goto('/yarn?s=ff000000ff000000ff&name=Gallery%20Sunset');
    await page.getByRole('button', { name: 'Save & Export' }).click();
    await page.getByRole('menuitem', { name: /^Save Palette/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Name (optional)')).toHaveValue(
      'Gallery Sunset',
    );
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Other colors are another palette: no name
    await page.getByRole('button', { name: 'Sort', exact: true }).click();
    await page.getByRole('menuitem', { name: /^Reverse/ }).click();
    await page.getByRole('button', { name: 'Save & Export' }).click();
    await page.getByRole('menuitem', { name: /^Save Palette/ }).click();
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
      await page.getByRole('button', { name: 'Save & Export' }).click();
      await page
        .getByRole('menuitem', { name: /^Copy Link/ })
        .click({ timeout: 1000 });
    }).toPass();
    await expect(page.getByText('Palette link copied')).toBeVisible();

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    const url = new URL(copied.trim());
    expect(url.pathname).toBe('/yarn');
    expect(url.searchParams.get('s')).toMatch(/^([0-9a-f]{6})+$/i);
  });
});
