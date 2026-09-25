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

// Better Auth configuration. Kept free of SvelteKit imports ($lib, $env) so that
// scripts/generate-auth-migration.ts can build the same options in Node.

import type { BetterAuthOptions } from 'better-auth';
import { emailOTP } from 'better-auth/plugins/email-otp';

export type SignInCodePurpose =
  'sign-in' | 'email-verification' | 'forget-password' | 'change-email';

export type AuthConfig = {
  database: BetterAuthOptions['database'];
  /** At least 32 characters; checked by the caller */
  secret: string;
  /** Hosts the app may be reached on, e.g. temperature-blanket.com or *.<project>.pages.dev */
  allowedHosts: string[];
  protocol: 'http' | 'https' | 'auto';
  sendSignInCode: (
    email: string,
    code: string,
    purpose: SignInCodePurpose,
  ) => Promise<void>;
  /** Keeps a promise alive after the response is sent (ctx.waitUntil on Workers) */
  runInBackground: (promise: Promise<unknown>) => void;
  /** Introspects the database when the instance starts; used locally to catch schema drift */
  validateSchema: boolean;
  /** Sign in with Google, when configured */
  google?: { clientId: string; clientSecret: string };
  /** Deletes what the account stores outside the auth tables (synced projects in R2) */
  deleteUserData?: (userId: string) => Promise<void>;
};

export const AUTH_BASE_PATH = '/api/auth';
export const SESSION_EXPIRES_DAYS = 60;

const DAY = 24 * 60 * 60;

/** The origins Better Auth accepts requests from, for each allowed host. */
export function trustedOriginsFor(
  allowedHosts: string[],
  protocol: AuthConfig['protocol'],
): string[] {
  const protocols = protocol === 'auto' ? ['https', 'http'] : [protocol];
  return allowedHosts.flatMap((host) =>
    protocols.map((scheme) => `${scheme}://${host}`),
  );
}

export function buildAuthOptions(config: AuthConfig) {
  return {
    appName: 'Temperature Blanket',
    basePath: AUTH_BASE_PATH,
    // Never derived from the request's Host header alone: only these hosts are accepted
    baseURL: { allowedHosts: config.allowedHosts, protocol: config.protocol },
    trustedOrigins: trustedOriginsFor(config.allowedHosts, config.protocol),
    secret: config.secret,
    database: config.database,
    // No passwords: sign in with an emailed code or Google
    emailAndPassword: { enabled: false },
    session: {
      expiresIn: SESSION_EXPIRES_DAYS * DAY,
      // Extend the session at most once a day while it's in use
      updateAge: DAY,
      // Sensitive actions need a sign-in within the last 10 minutes
      freshAge: 10 * 60,
    },
    rateLimit: {
      // Off by default outside production; always on here
      enabled: true,
      // Worker isolates don't share memory
      storage: 'database',
      window: 60,
      max: 100,
    },
    advanced: {
      // Set by Cloudflare and not spoofable by the client
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
      cookiePrefix: 'tb',
      database: { validateSchema: config.validateSchema },
      backgroundTasks: { handler: config.runInBackground },
    },
    account: {
      // Sign-in doesn't need provider tokens afterwards; don't keep them readable
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
        // Linking happens while signed in, so a Google account with another address is fine
        allowDifferentEmails: true,
        // Every account can still sign in with an emailed code
        allowUnlinkingAll: true,
      },
    },
    socialProviders: config.google
      ? { google: { ...config.google, prompt: 'select_account' as const } }
      : undefined,
    user: {
      // Needs a session less than freshAge old; the account page confirms with a new code first
      deleteUser: {
        enabled: true,
        // Before the user row goes, so a failure here leaves nothing orphaned
        beforeDelete: async (user) => {
          await config.deleteUserData?.(user.id);
        },
      },
    },
    telemetry: { enabled: false },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 5 * 60,
        allowedAttempts: 3,
        storeOTP: 'hashed',
        // A code to the current address and another to the new one
        changeEmail: { enabled: true, verifyCurrentEmail: true },
        // Not awaited, so response time doesn't reveal whether an account exists
        sendVerificationOTP: async ({ email, otp, type }) => {
          config.runInBackground(config.sendSignInCode(email, otp, type));
        },
      }),
    ],
  } satisfies BetterAuthOptions;
}
