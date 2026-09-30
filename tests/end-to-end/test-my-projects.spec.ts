import { expect, test, type Page } from '@playwright/test';

// Write straight to idb-keyval's default store, since saving a real project
// needs weather data
async function seedProject(page: Page, title: string) {
  await page.evaluate(async (title) => {
    const id = '1700000000000';
    const href = `${location.origin}/?project=${id}`;
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

    await seedProject(page, 'Test Town, 2024');
    await page.goto('/my-projects');

    // The project opens in this tab
    const project = page.getByRole('link', { name: 'Test Town, 2024' });
    await expect(project).toBeVisible();
    await expect(project).not.toHaveAttribute('target');

    // The palette links to the Yarn Palette Creator
    const palettes = page.getByRole('list', { name: 'Saved palettes' });
    await expect(palettes.getByText('Test Meadow')).toBeVisible();
    await expect(
      palettes.getByRole('link', { name: 'Open in Yarn Palette Creator' }),
    ).toHaveAttribute('href', /\/yarn\?s=/);

    // Delete the project
    await page.getByRole('button', { name: 'Delete Test Town, 2024' }).click();
    await expect(project).toHaveCount(0);
    await expect(page.getByText('No saved projects yet')).toBeVisible();
  });
});
