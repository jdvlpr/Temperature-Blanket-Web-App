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
    // On the Yarn page, saved and gallery palettes open as palettes of their
    // own (from My Library, the Gallery or the Palette menu), not from here
    for (const name of ['My Palettes', 'Palette Gallery', 'Browse Palettes'])
      await expect(
        page.getByRole('menuitem', { name: new RegExp(name) }),
      ).toHaveCount(0);
    for (const name of [
      'Gradients',
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

  test('Choose Colorways picks from colorway cards', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Colors' }).click();
    await page.getByRole('menuitem', { name: /Choose Colorways/ }).click();
    const dialog = page.getByRole('dialog');

    // A color to match ranks them, best match first
    await dialog.getByPlaceholder('e.g., pink, #c3f4d2').fill('#ff0000');
    await expect(
      dialog.getByRole('button', { name: /^Sort: Best match/ }),
    ).toBeVisible();

    // The card itself toggles; its ⋮ menu is a separate button
    const card = dialog.getByRole('listitem').first();
    const toggle = card.getByRole('button').first();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(
      card.getByRole('button', { name: /^More for / }),
    ).toBeVisible();
    await expect(dialog.getByText('1 Colorway', { exact: true })).toBeVisible();

    // Clear empties the picks, and Undo (focused) brings them back
    await dialog.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(dialog.getByText('Cleared 1 colorway')).toBeVisible();
    const undo = dialog.getByRole('button', { name: 'Undo' });
    await expect(undo).toBeFocused();
    await undo.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(
      dialog.getByRole('button', { name: 'Clear', exact: true }),
    ).toBeFocused();
  });

  test('Choose Colorways on a phone: Escape leaves Photo, badges clear the menu', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Get Colors' }).click();
    await page.getByRole('menuitem', { name: /Choose Colorways/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('e.g., pink, #c3f4d2').fill('#ff0000');

    // The match badge wraps below the check circle rather than under the ⋮
    const card = dialog.getByRole('listitem').first();
    const badge = await card.getByText(/% match/).boundingBox();
    const more = await card
      .getByRole('button', { name: /^More for / })
      .boundingBox();
    expect(badge && more).toBeTruthy();
    const overlaps =
      badge!.x < more!.x + more!.width &&
      more!.x < badge!.x + badge!.width &&
      badge!.y < more!.y + more!.height &&
      more!.y < badge!.y + badge!.height;
    expect(overlaps).toBe(false);

    const toggle = card.getByRole('button').first();
    await toggle.click();

    // Escape in the photo picker goes back, keeping what's chosen
    await dialog
      .getByRole('button', { name: 'Pick color from a photo' })
      .click();
    await expect(
      dialog.getByRole('region', { name: 'Pick a color from a photo' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(
      dialog.getByRole('button', { name: 'Pick color from a photo' }),
    ).toBeFocused();
  });

  test('Sort offers each sort one way round, with Reverse for the other', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Sort', exact: true }).click();
    for (const name of ['Gradient', 'Hue', 'Lightness', 'Reverse', 'Shuffle'])
      await expect(
        page.getByRole('menuitem', { name: new RegExp(`^${name}`) }),
      ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: /Warm to Cool|Dark to Light/ }),
    ).toHaveCount(0);

    // Lightness, then Reverse: still Lightness, the other way round
    await page.getByRole('menuitem', { name: /^Lightness/ }).click();
    await page.getByRole('button', { name: 'Sort', exact: true }).click();
    await page.getByRole('menuitem', { name: /^Reverse/ }).click();
    await page.getByRole('button', { name: 'Sort', exact: true }).click();
    await expect(
      page.getByRole('menuitem', { name: /^Lightness/ }).getByLabel('Current'),
    ).toBeVisible();
  });

  test('the Palette menu’s Download / Export lists every export', async ({
    page,
  }) => {
    await page.getByTestId('palette-button').click();
    await page
      .getByRole('dialog', { name: 'Palette' })
      .getByRole('button', { name: /^Download \/ Export/ })
      .click();
    const dialog = page.getByRole('dialog');
    for (const name of ['Image', 'HTML Color Codes'])
      await expect(
        dialog.getByRole('button', { name: new RegExp(`^${name}`) }),
      ).toBeVisible();

    // Each export opens straight on its format, with no list to go back to
    await dialog.getByRole('button', { name: /^HTML Color Codes/ }).click();
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

  test('Share, signed out, offers signing in that comes back to the colors', async ({
    page,
  }) => {
    await page.getByTestId('palette-button').click();
    await page
      .getByRole('dialog', { name: 'Palette' })
      .getByRole('button', { name: /^Share/ })
      .click();
    const signIn = page
      .getByRole('dialog')
      .getByRole('link', { name: /^Sign In to Publish/ });
    // Only in builds with accounts (PUBLIC_ACCOUNTS_ENABLED)
    test.skip((await signIn.count()) === 0, 'Accounts aren’t built in');
    const href = (await signIn.getAttribute('href')) ?? '';
    const back = new URL(href, 'https://x.test').searchParams.get('redirect');
    expect(href).toMatch(/^\/auth\/sign-in\?redirect=/);
    expect(back).toMatch(/^\/yarn\?s=[0-9a-f]+/);
  });

  test('Image opens a preview to download', async ({ page }) => {
    await page.getByTestId('palette-button').click();
    await page
      .getByRole('dialog', { name: 'Palette' })
      .getByRole('button', { name: /^Download \/ Export/ })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Image/ })
      .click();
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

  test('Start a Project with It, not saved, asks first, then opens the planner', async ({
    page,
  }) => {
    await page.getByTestId('palette-button').click();
    await page
      .getByRole('dialog', { name: 'Palette' })
      .getByRole('button', { name: /^Start a Project with It/ })
      .click();
    await page
      .getByRole('dialog', { name: 'Start a Project' })
      .getByRole('button', { name: 'Don’t Save' })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByText('Your palette goes on the Temperature gauge'),
    ).toBeVisible();
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

    // The pasted colors are now the palette; Copy Link copies it straight away
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByTestId('palette-button').click();
    await page
      .getByRole('dialog', { name: 'Palette' })
      .getByRole('button', { name: /^Share/ })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Copy Link/ })
      .click();
    await expect(page.getByText('Link copied')).toBeVisible();
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
      page.getByRole('menuitem', { name: /Gradients/ }),
    ).toBeVisible();
    // Keys pressed before the menu takes focus go nowhere
    await expect(page.getByRole('menu', { name: 'Get Colors' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('Gradients opens on its own, fitting a phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.getByRole('button', { name: 'Get Colors' }).click();
    await page.getByRole('menuitem', { name: /Gradients/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Gradients' });
    await expect(
      dialog.getByRole('list', { name: /gradients$/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
