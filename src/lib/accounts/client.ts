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

// Browser-side calls to the account API (Better Auth, under /api/auth).

export type AccountUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
};

export class AccountError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

/** A message for people, from an account API error. */
export function accountErrorMessage(error: unknown): string {
  if (!(error instanceof AccountError))
    return 'Something went wrong. Check your connection and try again.';
  if (error.code === 'TOO_MANY_ATTEMPTS')
    return 'Too many tries. Request a new code.';
  if (error.status === 429)
    return 'Too many requests. Wait a few minutes and try again.';
  if (error.status === 404 || error.status === 503)
    return 'Accounts aren’t available right now.';
  if (error.code === 'INVALID_OTP' || error.code === 'OTP_EXPIRED')
    return 'That code isn’t right, or it has expired.';
  if (error.status === 400) return 'Check what you entered and try again.';
  return 'Something went wrong. Try again.';
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(
      `/api/auth${path}`,
      body === undefined
        ? {}
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
    );
  } catch {
    throw new AccountError(0, undefined, 'Network error');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new AccountError(
      response.status,
      data?.code,
      data?.message ?? response.statusText,
    );
  return data as T;
}

export const sendSignInCode = (email: string) =>
  call<{ success: boolean }>('/email-otp/send-verification-otp', {
    email,
    type: 'sign-in',
  });

export const signInWithCode = (email: string, otp: string) =>
  call<{ user: AccountUser }>('/sign-in/email-otp', { email, otp });

export const getSession = () =>
  call<{ user: AccountUser } | null>('/get-session');

export const signOut = () => call<{ success: boolean }>('/sign-out', {});
