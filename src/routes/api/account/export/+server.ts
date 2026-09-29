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

// Download everything the account holds, as JSON. The page adds synced projects.

import type { D1Database } from '@cloudflare/workers-types';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async (event) => {
  const { requireAccount } = await import('$lib/server/auth');
  const account = await requireAccount(event);
  if (account instanceof Response) return account;

  const headers = event.request.headers;
  const [signInMethods, sessions, gallery] = await Promise.all([
    account.auth.api.listUserAccounts({ headers }),
    account.auth.api.listSessions({ headers }),
    galleryPages(event.platform?.env?.DB, account.user.id, event.url.origin),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    account: account.user,
    signInMethods: signInMethods.map((method) => ({
      provider: method.providerId,
      linkedAt: method.createdAt,
    })),
    sessions: sessions.map((session) => ({
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
    })),
    gallery,
  };

  return json(data, {
    headers: {
      'Content-Disposition':
        'attachment; filename="temperature-blanket-account.json"',
      'Cache-Control': 'no-store',
    },
  });
};

/** Gallery pages published from the account, with the gallery settings. */
async function galleryPages(
  db: D1Database | undefined,
  userId: string,
  origin: string,
) {
  if (!db) return null;
  const { listPosts, getSettings } = await import('$lib/server/gallery/store');
  try {
    const [posts, settings] = await Promise.all([
      listPosts(db, userId),
      getSettings(db, userId),
    ]);
    return {
      settings,
      pages: posts.map((post) => ({
        title: post.title,
        url: `${origin}/gallery/${post.postId}`,
        projectId: post.projectId,
        publishedAt: new Date(post.publishedAt).toISOString(),
      })),
    };
  } catch (e) {
    // Before migration 0004
    console.error('Could not export gallery pages', e);
    return null;
  }
}
