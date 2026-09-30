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

  test('paste colors into the palette', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Colors' }).click();
    await page.getByRole('menuitem', { name: /Paste Colors or Code/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Paste Colors or Code' }),
    ).toBeVisible();
    await dialog
      .getByLabel('Enter HTML colors, a palette code, or a project URL')
      // The field listens for keyup, change and paste, not input
      .pressSequentially('red, orange, blue');
    await expect(dialog.getByText('3 Colors')).toBeVisible();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // The pasted colors are now the palette
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Link/ })
      .click();
    await expect(
      page.getByRole('dialog').getByText(/\/yarn\?s=ff0000ffa5000000ff/),
    ).toBeVisible();
  });

  test('old palette codes can still be pasted', async ({ page }) => {
    // The Palette Code export was removed, but codes people saved still work
    await page.getByRole('button', { name: 'Get Colors' }).click();
    await page.getByRole('menuitem', { name: /Paste Colors or Code/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByLabel('Enter HTML colors, a palette code, or a project URL')
      .pressSequentially('palette:ff0000ffa500');
    await expect(dialog.getByText('2 Colors')).toBeVisible();
  });

  test('a menu item chosen with the keyboard opens its dialog', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Get Colors' }).focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('menuitem', { name: /Browse Palettes/ }),
    ).toBeVisible();
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
