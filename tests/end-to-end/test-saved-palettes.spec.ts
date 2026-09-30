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
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name (optional)').fill('Test Sunset');
    await dialog
      .getByRole('button', { name: 'Save Palette', exact: true })
      .click();
    await expect(page.getByText('Palette saved')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // The same palette isn't saved twice
    await page.getByRole('button', { name: 'Save', exact: true }).click();
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
    await dialog.getByText('Saved', { exact: true }).click();
    const list = dialog.getByRole('list', { name: 'Saved palettes' });
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await expect(list.getByText('Test Sunset')).toBeVisible();

    // Rename
    await list.getByRole('button', { name: 'Rename Test Sunset' }).click();
    await list.getByLabel('Palette name').fill('Test Dusk');
    await list.getByRole('button', { name: 'Save Name' }).click();
    await expect(list.getByText('Test Dusk')).toBeVisible();

    // Delete, then undo
    await list.getByRole('button', { name: 'Delete Test Dusk' }).click();
    await expect(dialog.getByText('No saved palettes yet')).toBeVisible();
    await dialog.getByRole('button', { name: 'Undo' }).click();
    await expect(list.getByText('Test Dusk')).toBeVisible();

    // Use it: the dialog closes
    await list.getByTitle('Use This Palette').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('export a link that opens the palette', async ({ page }) => {
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^Link/ }).click();
    const link = dialog.getByText(/\/yarn\?s=/);
    await expect(link).toBeVisible();

    const url = new URL((await link.textContent())!.trim());
    expect(url.pathname).toBe('/yarn');
    expect(url.searchParams.get('s')).toMatch(/^([0-9a-f]{6})+$/i);
  });
});
