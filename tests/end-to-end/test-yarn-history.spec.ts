import { expect, test, type Page } from '@playwright/test';

const RGB = 'ff000000ff000000ff';
const BGR = '0000ff00ff00ff0000';

async function reverse(page: Page) {
  await page.getByRole('button', { name: 'Sort', exact: true }).click();
  await page.getByRole('menuitem', { name: /^Reverse/ }).click();
}

// Shortcuts don't run while a button has focus, as in the planner
const blur = (page: Page) =>
  page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

test.describe('Yarn Palette Creator history and autosave', () => {
  test.beforeEach(async ({ page, context, baseURL }) => {
    // Pre-seed the analytics-consent cookies so the consent toast can't cover buttons
    const url = baseURL ?? 'https://localhost:4173';
    await context.addCookies([
      { name: '_clck', value: '1', url },
      { name: '_clsk', value: '1', url },
    ]);
    await page.goto(`/yarn?s=${RGB}`);
    await expect(
      page.getByRole('heading', { name: 'Create a Yarn Palette' }),
    ).toBeVisible();
  });

  test('undo and redo, then a saved palette saves by itself', async ({
    page,
  }) => {
    const undo = page.locator('#undo');
    const redo = page.locator('#redo');
    const paletteButton = page.getByTestId('palette-button');
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();
    await expect(paletteButton).toHaveAttribute(
      'data-save-status',
      'Not saved',
    );

    // One change is one step, and the address bar follows the colors
    await reverse(page);
    await expect(page).toHaveURL(new RegExp(`s=${BGR}`));
    await expect(undo).toBeEnabled();

    await undo.click();
    await expect(page.getByText(/^Undo:/)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`s=${RGB}`));
    await expect(undo).toBeDisabled();
    await expect(redo).toBeEnabled();

    // Cmd/Ctrl+Shift+Z redoes, Cmd/Ctrl+Z undoes
    await blur(page);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(page).toHaveURL(new RegExp(`s=${BGR}`));
    await page.keyboard.press('ControlOrMeta+z');
    await expect(page).toHaveURL(new RegExp(`s=${RGB}`));

    // Save Palette from the Palette button: it's open now, and saves by itself
    await paletteButton.click();
    await page.getByRole('button', { name: 'Save Palette' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Save Palette', exact: true })
      .click();
    await expect(paletteButton).toHaveAttribute(
      'data-save-status',
      'Saved in this browser',
    );

    await reverse(page);
    await expect(paletteButton).toHaveAttribute('data-save-status', 'Saving…');
    await expect(paletteButton).toHaveAttribute(
      'data-save-status',
      'Saved in this browser',
    );

    // The saved palette has the new colors: they open it, the old ones don't
    await page.goto(`/yarn?s=${RGB}`);
    await expect(paletteButton).toHaveAttribute(
      'data-save-status',
      'Not saved',
    );
    await page.goto(`/yarn?s=${BGR}`);
    await expect(paletteButton).toHaveAttribute(
      'data-save-status',
      'Saved in this browser',
    );

    // A copy has the same colors: opening the original edits only the original
    await page.goto('/my-palettes');
    const list = page.getByRole('list', { name: 'Saved palettes' });
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await list.getByRole('button', { name: 'More for 3 colors' }).click();
    await page.getByRole('menuitem', { name: /^Duplicate/ }).click();
    await expect(list.getByRole('listitem')).toHaveCount(2);
    const open = (name: string) =>
      list.getByRole('link', {
        name: `Open ${name} in Yarn Palette Creator`,
        exact: true,
      });
    await open('3 colors').click();
    await expect(paletteButton).toHaveAttribute(
      'data-save-status',
      'Saved in this browser',
    );
    await reverse(page);
    await expect(page).toHaveURL(new RegExp(`s=${RGB}`));
    await expect(paletteButton).toHaveAttribute('data-save-status', 'Saving…');
    await expect(paletteButton).toHaveAttribute(
      'data-save-status',
      'Saved in this browser',
    );
    await page.goto('/my-palettes');
    await open('3 colors (copy)').click();
    await expect(page).toHaveURL(new RegExp(`s=${BGR}`));
    await page.goto('/my-palettes');
    await open('3 colors').click();
    await expect(page).toHaveURL(new RegExp(`s=${RGB}`));
  });
});
