import { expect, test, type Page } from '@playwright/test';

// Write straight to idb-keyval's default store, since saving a real project
// needs weather data
async function seedProject(page: Page, title: string) {
  await page.evaluate(async (title) => {
    const id = '1700000000000';
    const href = `${location.origin}/?project=${id}#temp=ff0000`;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('keyval-store');
      request.onupgradeneeded = () =>
        request.result.createObjectStore('keyval');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('keyval', 'readwrite');
      const store = tx.objectStore('keyval');
      const meta = {
        date: '1/1/2024',
        href,
        title,
        isCustomWeatherData: false,
      };
      store.put([{ id, meta }], 'projects_index');
      store.put({ ...meta, weatherData: [], weatherSource: {} }, `p_${id}`);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, title);
}

test.describe('My Projects', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    // Pre-seed the analytics-consent cookies so the consent toast can't cover buttons
    const url = baseURL ?? 'https://localhost:4173';
    await context.addCookies([
      { name: '_clck', value: '1', url },
      { name: '_clsk', value: '1', url },
    ]);
  });

  test('shows empty states and is in the site menu', async ({ page }) => {
    await page.goto('/my-projects');
    await expect(page.getByText('No saved projects yet')).toBeVisible();
    await expect(page.getByText('No saved palettes yet')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'My Projects' }).first(),
    ).toHaveAttribute('href', '/my-projects');
  });

  test('lists saved projects and palettes', async ({ page }) => {
    // Save a palette
    await page.goto('/yarn');
    await page
      .getByRole('button', { name: 'Save Palette', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name (optional)').fill('Test Meadow');
    await dialog
      .getByRole('button', { name: 'Save Palette', exact: true })
      .click();
    await expect(page.getByText('Palette saved')).toBeVisible();
    // On the Yarn Palette Creator, the toast links to My Projects
    await expect(
      page.getByRole('button', { name: 'Open My Projects' }),
    ).toBeVisible();

    await seedProject(page, 'Test Town, 2024');
    await page.goto('/my-projects');

    // The project opens in this tab
    const project = page.getByRole('link', { name: 'Test Town, 2024' });
    await expect(project).toBeVisible();
    await expect(project).not.toHaveAttribute('target');
    // A full page load, so the planner loads the saved weather
    await expect(project).toHaveAttribute('data-sveltekit-reload');

    // The palette links to the Yarn Palette Creator
    const palettes = page.getByRole('list', { name: 'Saved palettes' });
    await expect(palettes.getByText('Test Meadow')).toBeVisible();
    await expect(palettes.getByText(/^Saved .+ at .+/)).toBeVisible();
    const paletteLink = palettes.getByRole('link', {
      name: 'Open Test Meadow in Yarn Palette Creator',
    });
    await expect(paletteLink).toHaveAttribute('href', /\/yarn\?s=/);
    // Nothing clickable inside the link
    await expect(paletteLink.getByRole('button')).toHaveCount(0);

    // Name the project: the name shows, with its location title in the details
    await page.getByRole('button', { name: 'Rename Test Town, 2024' }).click();
    await page.getByLabel('Project name').fill('Gift Blanket');
    await page.getByRole('button', { name: 'Save Name' }).click();
    const named = page.getByRole('link', { name: 'Gift Blanket' });
    await expect(named).toBeVisible();
    await expect(page.getByText('Test Town, 2024')).toBeVisible();
    await page.reload();
    await expect(named).toBeVisible();

    // Move to the Trash, then undo
    await page.getByRole('button', { name: 'Delete Gift Blanket' }).click();
    await expect(named).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText(
      'Moved Gift Blanket to the Trash',
    );
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(named).toBeVisible();

    // Move to the Trash, then restore it from the Trash dialog
    await page.getByRole('button', { name: 'Delete Gift Blanket' }).click();
    await expect(page.getByText('No saved projects yet')).toBeVisible();
    await page.getByRole('button', { name: 'Trash (1)' }).click();
    let trash = page.getByRole('dialog');
    await expect(trash.getByRole('list', { name: 'Trash' })).toContainText(
      'Gift Blanket',
    );
    await trash.getByRole('button', { name: 'Restore Gift Blanket' }).click();
    await expect(trash.getByText('The Trash is empty')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(named).toBeVisible();

    // Delete it for good, after confirming
    await page.getByRole('button', { name: 'Delete Gift Blanket' }).click();
    await page.getByRole('button', { name: 'Trash (1)' }).click();
    trash = page.getByRole('dialog');
    await trash
      .getByRole('button', { name: 'Delete Gift Blanket forever' })
      .click();
    await trash.getByRole('button', { name: 'Yes, Delete Forever' }).click();
    await expect(trash.getByText('The Trash is empty')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('No saved projects yet')).toBeVisible();
    // Nothing in the Trash: no button
    await expect(page.getByRole('button', { name: /^Trash/ })).toHaveCount(0);

    // Palettes go to the same Trash
    await palettes.getByRole('button', { name: 'Delete Test Meadow' }).click();
    await page.getByRole('button', { name: 'Trash (1)' }).click();
    trash = page.getByRole('dialog');
    await trash.getByRole('button', { name: 'Restore Test Meadow' }).click();
    await page.keyboard.press('Escape');
    await expect(palettes.getByText('Test Meadow')).toBeVisible();

    // A click on a swatch, not just the name, opens the palette too
    await palettes.getByRole('listitem').getByRole('button').first().click();
    await expect(page).toHaveURL(/\/yarn\?s=/);
  });

  test('names a project when saving, and opens it from My Projects with its weather', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByPlaceholder('Enter a place').click();
    await page.getByPlaceholder('Enter a place').fill('Austin');
    await page
      .getByRole('option', { name: 'Austin, Texas, United States' })
      .click();
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('°C / mm °F / in')).toBeVisible();

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Saved Locally')).toBeVisible();
    await dialog.getByLabel('Name (optional)').fill('Austin Gift');
    await dialog.getByRole('button', { name: 'Save Name' }).click();
    await expect(page.getByText('Name saved')).toBeVisible();
    await page.keyboard.press('Escape');

    // The Project menu lists it by name, without a delete button
    await page.getByRole('button', { name: 'Project Options' }).click();
    const menu = page.getByRole('dialog');
    await expect(menu.getByRole('link', { name: 'Austin Gift' })).toBeVisible();
    await expect(menu.getByRole('button', { name: /^Delete / })).toHaveCount(0);
    await page.keyboard.press('Escape');

    // Opened from My Projects, it loads with its saved weather
    await page.goto('/my-projects');
    await page.getByRole('link', { name: 'Austin Gift' }).click();
    await expect(
      page.getByText('Loaded project and weather data'),
    ).toBeVisible();
  });
});
