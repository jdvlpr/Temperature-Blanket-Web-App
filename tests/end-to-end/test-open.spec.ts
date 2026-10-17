import { expect, test } from '@playwright/test';

// The Palette and Project menus' Open screens
test('Open lists, searches and opens a palette in place; Cmd+O opens it on both pages', async ({
  page,
  context,
  baseURL,
}) => {
  const url = baseURL ?? 'https://localhost:4173';
  await context.addCookies([
    { name: '_clck', value: '1', url },
    { name: '_clsk', value: '1', url },
  ]);
  await page.goto('/yarn');
  await expect(
    page.getByRole('heading', { name: 'Design a Yarn Palette' }),
  ).toBeVisible();
  await page.getByTestId('palette-button').click();
  await page.getByTestId('menu-save-palette').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name (optional)').fill('Test Sunset');
  await dialog
    .getByRole('button', { name: 'Save Palette', exact: true })
    .click();
  await expect(page.getByText('Palette saved')).toBeVisible();

  // Open shows it as open now
  const paletteButton = page.getByTestId('palette-button');
  await paletteButton.click();
  await page.getByTestId('menu-open').click();
  await expect(
    dialog.getByRole('listitem').filter({ hasText: 'Test Sunset' }),
  ).toContainText('Open now');
  await page.keyboard.press('Escape');

  // A new palette, then Cmd+O opens Test Sunset again
  await paletteButton.click();
  await page.getByRole('button', { name: /^New Palette/ }).click();
  await expect(paletteButton).toHaveAttribute('data-save-status', 'Not saved');
  // (once the menu's panel has closed)
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('ControlOrMeta+o');
  await dialog.getByLabel('Search palettes').fill('nothing like it');
  await expect(dialog.getByText('No palettes match')).toBeVisible();
  await dialog.getByLabel('Search palettes').fill('sunset');
  await dialog.getByRole('button', { name: /^Test Sunset/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(paletteButton).toHaveAttribute(
    'data-save-status',
    'Saved in this browser',
  );

  // On the planner, before there's a project, Cmd+O opens Open a Project
  await page.goto('/');
  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+o');
    await expect(page.getByLabel('Search projects')).toBeVisible({
      timeout: 1000,
    });
  }).toPass();
});
