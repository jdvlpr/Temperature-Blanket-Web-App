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

import { emailConfigProblem, type EmailEnv } from '$lib/server/email';
import type { AuthConfig } from './options';

/** Where the app's own settings for accounts come from (platform.env on Cloudflare). */
export type AuthEnv = EmailEnv & {
  ACCOUNTS_ENABLED?: string;
  BETTER_AUTH_SECRET?: string;
  AUTH_ALLOWED_HOSTS?: string;
  AUTH_PROTOCOL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  RAVELRY_CLIENT_ID?: string;
  RAVELRY_CLIENT_SECRET?: string;
  /** Overrides for tests; default to Ravelry's real URLs */
  RAVELRY_OAUTH_URL?: string;
  RAVELRY_API_URL?: string;
};

export type AuthSettings =
  | { status: 'disabled' }
  | { status: 'misconfigured'; reason: string }
  | {
      status: 'ready';
      settings: Pick<
        AuthConfig,
        'secret' | 'allowedHosts' | 'protocol' | 'google' | 'ravelry'
      >;
    };

const MIN_SECRET_LENGTH = 32;

/**
 * Reads and checks the account settings. Fails closed: accounts are off unless
 * ACCOUNTS_ENABLED is "true", and refuse to run without a real secret and an
 * explicit list of hosts (Better Auth would otherwise fall back to a default
 * secret, or to the request's Host header).
 */
export function readAuthSettings(env: AuthEnv | undefined): AuthSettings {
  if (env?.ACCOUNTS_ENABLED !== 'true') return { status: 'disabled' };

  const secret = env.BETTER_AUTH_SECRET ?? '';
  if (secret.length < MIN_SECRET_LENGTH)
    return {
      status: 'misconfigured',
      reason: `BETTER_AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters`,
    };

  const allowedHosts = (env.AUTH_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
  if (!allowedHosts.length)
    return { status: 'misconfigured', reason: 'AUTH_ALLOWED_HOSTS is empty' };
  if (
    allowedHosts.some((host) => host === '*' || host.startsWith('*.pages.dev'))
  )
    return {
      status: 'misconfigured',
      reason: 'AUTH_ALLOWED_HOSTS must not allow every host',
    };

  const protocol = env.AUTH_PROTOCOL ?? 'https';
  if (protocol !== 'https' && protocol !== 'http' && protocol !== 'auto')
    return {
      status: 'misconfigured',
      reason: 'AUTH_PROTOCOL must be https, http or auto',
    };

  const emailProblem = emailConfigProblem(env);
  if (emailProblem) return { status: 'misconfigured', reason: emailProblem };

  // Each sign-in provider is on only when both its ID and secret are set
  const google =
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        }
      : undefined;
  const ravelry =
    env.RAVELRY_CLIENT_ID && env.RAVELRY_CLIENT_SECRET
      ? {
          clientId: env.RAVELRY_CLIENT_ID,
          clientSecret: env.RAVELRY_CLIENT_SECRET,
          oauthUrl: env.RAVELRY_OAUTH_URL || 'https://www.ravelry.com',
          apiUrl: env.RAVELRY_API_URL || 'https://api.ravelry.com',
        }
      : undefined;

  return {
    status: 'ready',
    settings: { secret, allowedHosts, protocol, google, ravelry },
  };
}
