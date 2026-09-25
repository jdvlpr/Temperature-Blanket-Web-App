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

// Ravelry sign-in through Better Auth's generic OAuth plugin.
//
// Ravelry doesn't say whether an email address is verified, so its email is never
// used: an account could otherwise be pre-registered with someone else's address.
// Ravelry can't create accounts (disableSignUp); people link it from the account
// page while signed in, and after that it signs them in.

import type {
  GenericOAuthConfig,
  GenericOAuthUserInfo,
} from 'better-auth/plugins/generic-oauth';

export const RAVELRY_PROVIDER_ID = 'ravelry';

export type RavelrySettings = {
  clientId: string;
  clientSecret: string;
  /** https://www.ravelry.com, or the dev fake in tests */
  oauthUrl: string;
  /** https://api.ravelry.com, or the dev fake in tests */
  apiUrl: string;
};

/** Maps Ravelry's current_user.json to Better Auth's user info. */
export function ravelryUserInfo(profile: unknown): GenericOAuthUserInfo | null {
  const user = (profile as { user?: Record<string, unknown> } | null)?.user;
  const id = user?.id;
  if (typeof id !== 'number' && typeof id !== 'string') return null;
  if (String(id).trim() === '') return null;

  const photo =
    typeof user?.photo_url === 'string' ? user.photo_url : undefined;
  return {
    id: String(id),
    // A placeholder that can never match a real account (.invalid is reserved)
    email: `ravelry-${id}@users.ravelry.invalid`,
    emailVerified: false,
    name: typeof user?.username === 'string' ? user.username : '',
    image: photo,
  };
}

export function ravelryProvider(settings: RavelrySettings): GenericOAuthConfig {
  return {
    providerId: RAVELRY_PROVIDER_ID,
    name: 'Ravelry',
    authorizationUrl: `${settings.oauthUrl}/oauth2/auth`,
    tokenUrl: `${settings.oauthUrl}/oauth2/token`,
    clientId: settings.clientId,
    clientSecret: settings.clientSecret,
    authentication: 'basic',
    disableSignUp: true,
    getUserInfo: async (tokens) => {
      const response = await fetch(`${settings.apiUrl}/current_user.json`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!response.ok) return null;
      return ravelryUserInfo(await response.json());
    },
  };
}
