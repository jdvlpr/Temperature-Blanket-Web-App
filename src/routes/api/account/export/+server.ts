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

// Download everything the account holds, as JSON. Projects are added with sync (Phase 2).

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async (event) => {
  const { requireAccount } = await import('$lib/server/auth');
  const account = await requireAccount(event);
  if (account instanceof Response) return account;

  const headers = event.request.headers;
  const [signInMethods, sessions] = await Promise.all([
    account.auth.api.listUserAccounts({ headers }),
    account.auth.api.listSessions({ headers }),
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
  };

  return json(data, {
    headers: {
      'Content-Disposition':
        'attachment; filename="temperature-blanket-account.json"',
      'Cache-Control': 'no-store',
    },
  });
};
