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
    const dialog = page.getByRole('dialog');
    // Retried: a click before the page finishes loading does nothing
    await expect(async () => {
      await page
        .getByRole('button', { name: 'Save Palette', exact: true })
        .click();
      await expect(dialog.getByLabel('Name (optional)')).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await dialog.getByLabel('Name (optional)').fill('Test Meadow');
    await dialog
      .getByRole('button', { name: 'Save Palette', exact: true })
      .click();
    await expect(page.getByText('Palette saved')).toBeVisible();

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

    // Before saving, the Project menu has no rename
    await page.getByRole('button', { name: 'Project Options' }).click();
    const menu = page.getByRole('dialog');
    await expect(
      menu.getByRole('button', { name: /Rename|Name this/ }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');

    // Save is in the top bar: it saves right away
    await page.getByTestId('save-button').click();
    await expect(page.getByText('Saved in this browser')).toBeVisible();
    await expect(page.getByTestId('save-button')).toHaveAccessibleName('Saved');

    // Its name is in the top bar too, as a field: rename it there
    const title = page.getByTestId('top-bar-project-name');
    await title.click();
    // Not named yet, its location title is there to edit
    await expect(title).toHaveValue(/Austin/);
    await title.fill('Austin Gift');
    await title.press('Enter');
    await expect(page.getByText('Project renamed')).toBeVisible();
    await expect(title).toHaveValue('Austin Gift');
    await expect(title).not.toBeFocused();

    // Escape puts the name back
    await title.click();
    await title.fill('Not this');
    await title.press('Escape');
    await expect(title).toHaveValue('Austin Gift');

    // Clicking away keeps it
    await title.click();
    await title.fill('Austin Gift 2025');
    await page
      .getByText('Average Temperature', { exact: true })
      .first()
      .click();
    await expect(title).not.toBeFocused();
    await title.click();
    await title.fill('Austin Gift');
    await title.press('Enter');
    await expect(title).toHaveValue('Austin Gift');

    // Saved, the icon beside the name says where
    await page.getByTestId('save-button').click();
    await expect(
      page.getByText('Press Save after making changes'),
    ).toBeVisible();
    // Opening moves the focus into it
    await expect(page.getByRole('dialog')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(
      page.getByText('Press Save after making changes'),
    ).toBeHidden();

    // ...and renames it again from the menu's project card
    await page.getByRole('button', { name: 'Project Options' }).click();
    await menu.getByRole('button', { name: 'Rename Austin Gift' }).click();
    await menu.getByLabel('Project name').fill('Austin Blanket');
    await menu.getByLabel('Project name').press('Enter');
    await expect(menu.getByTestId('project-name')).toHaveText('Austin Blanket');
    await expect(menu.getByText('Saved in this browser')).toBeVisible();

    // Keyboard Shortcuts, opened from the menu, goes back to it
    await menu.getByRole('button', { name: 'Keyboard Shortcuts' }).click();
    await menu.getByRole('button', { name: 'Back' }).click();
    await expect(menu.getByTestId('project-name')).toHaveText('Austin Blanket');

    // Download / Export is a screen of its own, and PDF one over that: Cancel
    // and Back step back out to the menu
    await menu.getByRole('button', { name: /Download \/ Export/ }).click();
    await expect(
      menu.getByRole('heading', { name: 'Download / Export' }),
    ).toBeVisible();
    await menu.getByRole('button', { name: /^PDF/ }).click();
    await expect(
      menu.getByRole('heading', { name: 'Download PDF' }),
    ).toBeVisible();
    await menu.getByText('Cancel').click();
    await expect(
      menu.getByRole('heading', { name: 'Download / Export' }),
    ).toBeVisible();
    await menu.getByRole('button', { name: 'Back' }).click();
    await expect(menu.getByTestId('project-name')).toHaveText('Austin Blanket');
    await page.keyboard.press('Escape');

    // Opened from My Projects, it loads with its saved weather
    await page.goto('/my-projects');
    await page.getByRole('link', { name: 'Austin Blanket' }).click();
    await expect(
      page.getByText('Loaded project and weather data'),
    ).toBeVisible();
  });
});
