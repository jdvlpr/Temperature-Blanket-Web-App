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

// The /api/sync routes under `wrangler pages dev`, against real local D1 and R2.
// The browser side is covered by test-sync.spec.ts.

import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
} from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { SYNC_HEADERS } from '../../src/lib/sync/protocol';
import { latestCode, localD1, randomTestIp, uniqueEmail } from './helpers';

/** An API client signed in with an emailed code. */
async function signedInApi(
  baseURL: string,
  email = uniqueEmail('sync-api'),
): Promise<APIRequestContext> {
  const api = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL, 'CF-Connecting-IP': randomTestIp() },
  });
  const sent = await api.post('/api/auth/email-otp/send-verification-otp', {
    data: { email, type: 'sign-in' },
  });
  expect(sent.ok()).toBe(true);
  const signedIn = await api.post('/api/auth/sign-in/email-otp', {
    data: { email, otp: await latestCode(api, email) },
  });
  expect(signedIn.ok()).toBe(true);
  return api;
}

function save(
  api: APIRequestContext,
  id: string,
  { baseRev, title = 'Blanket' }: { baseRev?: number; title?: string } = {},
) {
  const json = JSON.stringify({ title, weatherData: [] });
  const headers: Record<string, string> = {
    'Content-Type': 'application/gzip',
    [SYNC_HEADERS.clientUpdatedAt]: String(Date.now()),
    [SYNC_HEADERS.schemaVersion]: '1',
    [SYNC_HEADERS.title]: encodeURIComponent(title),
    [SYNC_HEADERS.contentHash]: createHash('sha256').update(json).digest('hex'),
  };
  if (baseRev !== undefined) headers[SYNC_HEADERS.baseRev] = String(baseRev);
  return api.put(`/api/sync/projects/${id}`, {
    data: gzipSync(json),
    headers,
  });
}

const changes = async (api: APIRequestContext, since = 0) =>
  (await api.get(`/api/sync/changes?since=${since}`)).json();

test.describe('Sync API', () => {
  test('needs a signed-in account', async ({ request }) => {
    expect((await request.get('/api/sync/changes')).status()).toBe(401);
    expect((await request.get('/api/sync/projects/1')).status()).toBe(401);
  });

  test('save, list, download, and reject stale saves and deletions', async ({
    baseURL,
  }) => {
    const api = await signedInApi(baseURL!);
    const id = String(Date.now());

    const created = await save(api, id, { title: 'Montréal · 東京' });
    expect(created.status()).toBe(200);
    expect((await created.json()).meta).toMatchObject({
      id,
      rev: 1,
      title: 'Montréal · 東京',
    });

    expect(await changes(api)).toMatchObject({
      fullResyncRequired: false,
      changes: [{ id, rev: 1, deleted: false }],
      nextSince: 1,
      hasMore: false,
    });

    const download = await api.get(`/api/sync/projects/${id}`);
    expect(download.headers()['etag']).toBe('"1"');
    expect(download.headers()['content-type']).toBe('application/gzip');
    expect(JSON.parse(gunzipSync(await download.body()).toString())).toEqual({
      title: 'Montréal · 東京',
      weatherData: [],
    });

    expect(
      (await save(api, id, { baseRev: 1, title: 'Edited' })).status(),
    ).toBe(200);

    // Another device still on revision 1
    const stale = await save(api, id, { baseRev: 1, title: 'Stale' });
    expect(stale.status()).toBe(409);
    expect(await stale.json()).toMatchObject({
      code: 'CONFLICT',
      current: { rev: 2, title: 'Edited' },
    });
    const staleDelete = await api.delete(`/api/sync/projects/${id}?baseRev=1`);
    expect(staleDelete.status()).toBe(409);

    const deleted = await api.delete(`/api/sync/projects/${id}?baseRev=2`);
    expect((await deleted.json()).meta).toMatchObject({
      rev: 5,
      deleted: true,
    });
    expect((await api.get(`/api/sync/projects/${id}`)).status()).toBe(404);
    expect(await changes(api, 2)).toMatchObject({
      changes: [{ id, rev: 5, deleted: true }],
    });
  });

  test('an edit saved over a deletion brings the project back', async ({
    baseURL,
  }) => {
    const api = await signedInApi(baseURL!);
    const id = `edit-wins-${Date.now()}`;
    await save(api, id);
    await api.delete(`/api/sync/projects/${id}?baseRev=1`);
    const restored = await save(api, id, { baseRev: 2, title: 'Kept' });
    expect((await restored.json()).meta).toMatchObject({
      deleted: false,
      title: 'Kept',
    });
  });

  test('rejects bad requests', async ({ baseURL }) => {
    const api = await signedInApi(baseURL!);
    expect((await api.get('/api/sync/projects/..%2Fx')).status()).toBe(400);
    expect((await api.get('/api/sync/changes?since=-1')).status()).toBe(400);
    const noHash = await api.put('/api/sync/projects/x', {
      data: gzipSync('{}'),
      headers: { [SYNC_HEADERS.schemaVersion]: '1' },
    });
    expect(noHash.status()).toBe(400);
  });

  test('deleting the account deletes its synced projects', async ({
    baseURL,
  }) => {
    const api = await signedInApi(baseURL!);
    const id = `account-delete-${Date.now()}`;
    await save(api, id);
    const [{ blobKey, userId }] = localD1(
      `select "blobKey", "userId" from "project" where "projectId" = '${id}'`,
    );
    const r2Get = () =>
      execFileSync(
        'pnpm',
        [
          'exec',
          'wrangler',
          'r2',
          'object',
          'get',
          `tb-projects/${blobKey}`,
          '--local',
          '--pipe',
        ],
        { stdio: 'pipe' },
      );
    expect(gunzipSync(r2Get()).toString()).toContain('Blanket');

    // Signed in moments ago, so the session is fresh enough to delete
    expect((await api.post('/api/auth/delete-user', { data: {} })).ok()).toBe(
      true,
    );

    expect(
      localD1(`select * from "project" where "userId" = '${userId}'`),
    ).toEqual([]);
    expect(r2Get).toThrow();
  });
});
