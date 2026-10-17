// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

// Stars under `wrangler pages dev`: private bookmarks of gallery pages, kept in
// D1. WordPress isn't running here, so the gallery's two reads stand in for it
// in the browser: Popular's IDs and the posts by ID (the gallery and Starred).

import { expect, test, type BrowserContext } from '@playwright/test';
import { localD1, signIn, uniqueEmail, useTestIp } from './helpers';

test.beforeEach(async ({ page, context, baseURL }) => {
  await useTestIp(page);
  await context.addCookies([
    { name: '_clck', value: '1', url: baseURL },
    { name: '_clsk', value: '1', url: baseURL },
  ]);
});

const NAME = 'Star Test Blanket';

/** A gallery with one project page, whatever is asked */
async function fakeGallery(context: BrowserContext, postId: number) {
  await context.route('**/wp-json/tbgalleryapi/v1/popular**', (route) =>
    route.fulfill({ json: { ids: [postId], total: 1, hasMore: false } }),
  );
  await context.route('**/graphql', (route) =>
    route.fulfill({
      json: {
        data: {
          projects: {
            nodes: [
              {
                title: NAME,
                projectName: NAME,
                databaseId: postId,
                views: 3,
                projectUrl: 'https://example.test/',
                yarnUrls: '[]',
                locations: '',
                featuredImage: null,
                date: '2026-10-01T00:00:00',
              },
            ],
          },
        },
      },
    }),
  );
}

const starsOf = (userId: string) =>
  localD1(
    `select "postId", "kind" from "galleryStar" where "userId" = '${userId}'`,
  );

test('a gallery project is starred from its card, found under Starred in My Library and unstarred there', async ({
  page,
  request,
  context,
}) => {
  const postId = 900_000_000 + Math.floor(Math.random() * 1e7);
  await fakeGallery(context, postId);

  // Signed out, the star asks to sign in
  await page.goto('/gallery');
  await expect(
    page.getByRole('link', { name: `Sign in to star ${NAME}` }),
  ).toHaveAttribute('href', /\/auth\/sign-in\?redirect=%2Fgallery/);

  const email = uniqueEmail('gallery-stars');
  await signIn(page, request, email);
  const userId = String(
    localD1(`select "id" from "user" where "email" = '${email}'`)[0].id,
  );

  await page.goto('/gallery');
  const star = page.getByRole('button', { name: `Star ${NAME}` });
  await expect(star).toHaveAttribute('aria-pressed', 'false');
  await expect(star).not.toHaveAttribute('aria-disabled', 'true');
  await star.click();
  await expect(star).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() => starsOf(userId))
    .toEqual([{ postId, kind: 'project' }]);

  // In My Library, as the gallery's card, still starred
  await page.goto('/my-projects');
  const starred = page.getByRole('list', { name: 'Starred projects' });
  await expect(starred.getByRole('link', { name: NAME })).toBeVisible();
  const again = starred.getByRole('button', { name: `Star ${NAME}` });
  await expect(again).toHaveAttribute('aria-pressed', 'true');

  // Unstarred: stays until the next visit, so it can be put back
  await again.click();
  await expect(again).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => starsOf(userId)).toEqual([]);
  await expect(starred.getByRole('link', { name: NAME })).toBeVisible();

  // One's own page has no star
  localD1(
    `insert into "galleryPost" ("postId", "userId", "projectId", "title", "publishedAt")
     values (${postId}, '${userId}', 'p-star', '${NAME}', ${Date.now()})`,
  );
  await page.goto('/gallery');
  await expect(page.getByRole('link', { name: NAME })).toBeVisible();
  await expect(page.getByTestId('gallery-star')).toHaveCount(0);
});
