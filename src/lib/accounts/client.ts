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
  if (error.code === 'TOO_MANY_REQUESTS')
    return 'Too many codes have been sent to this email. Try again in an hour.';
  if (error.code === 'NAME_TOO_LONG') return 'Use 80 characters or fewer.';
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

export const updateName = (name: string) =>
  call<{ status: boolean }>('/update-user', { name });

/** Step 1 of changing email: a code to the current address. */
export const sendCurrentEmailCode = (currentEmail: string) =>
  call<{ success: boolean }>('/email-otp/send-verification-otp', {
    email: currentEmail,
    type: 'email-verification',
  });

/** Step 2: prove the current address, and send a code to the new one. */
export const requestEmailChange = (
  newEmail: string,
  currentEmailCode: string,
) =>
  call<{ success: boolean }>('/email-otp/request-email-change', {
    newEmail,
    otp: currentEmailCode,
  });

/** Step 3: prove the new address. */
export const confirmEmailChange = (newEmail: string, newEmailCode: string) =>
  call<{ status: boolean }>('/email-otp/change-email', {
    newEmail,
    otp: newEmailCode,
  });

/**
 * Deletes the account. Throws an AccountError with code SESSION_EXPIRED when
 * the session is more than 10 minutes old: sign in again with a code first.
 */
export const deleteAccount = () =>
  call<{ success: boolean }>('/delete-user', {});

export type SignInProvider = 'google';

/** Which providers are configured on the server. */
export async function getSignInOptions(): Promise<
  Record<SignInProvider, boolean>
> {
  try {
    const response = await fetch('/api/account/sign-in-options');
    if (response.ok) return await response.json();
  } catch {
    // Fall through: offer email only
  }
  return { google: false };
}

/** Starts signing in with a provider; the browser leaves for its site. */
export async function signInWithProvider(provider: SignInProvider) {
  const { url } = await call<{ url: string }>('/sign-in/social', {
    provider,
    callbackURL: '/account',
    errorCallbackURL: '/auth/sign-in',
  });
  window.location.assign(url);
}

/** Starts linking a provider to the signed-in account. */
export async function linkProvider(provider: SignInProvider) {
  const { url } = await call<{ url: string }>('/link-social', {
    provider,
    callbackURL: '/account',
    errorCallbackURL: '/account',
  });
  window.location.assign(url);
}

export const listLinkedProviders = () =>
  call<{ providerId: string }[]>('/list-accounts');

export const unlinkProvider = (provider: SignInProvider) =>
  call<{ status: boolean }>('/unlink-account', { providerId: provider });

/** A message for the ?error= that a failed provider sign-in or link returns with. */
export function providerErrorMessage(error: string): string {
  if (error === 'account_not_linked')
    return 'An account with this email already exists. Sign in with your email, then link it from your account page.';
  if (error === 'access_denied') return 'Sign-in was canceled.';
  return 'That didn’t work. Try again, or use your email.';
}

/** Ends every session for this account, including this one. */
export async function signOutEverywhere() {
  await call<{ status: boolean }>('/revoke-sessions', {});
  // Revoking leaves this browser's cookie in place; signing out clears it
  await signOut().catch(() => undefined);
  clearSignedInHint();
}

const SIGNED_IN_HINT_COOKIE = 'tb_signed_in';

/**
 * Whether this browser may be signed in (a readable hint set by the server).
 * Without it, skip asking the server for the session.
 */
export function hasSignedInHint(): boolean {
  return document.cookie
    .split(';')
    .some((part) => part.trim().startsWith(`${SIGNED_IN_HINT_COOKIE}=1`));
}

/** Clears a hint left behind after the session ended on the server. */
export function clearSignedInHint() {
  document.cookie = `${SIGNED_IN_HINT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}
