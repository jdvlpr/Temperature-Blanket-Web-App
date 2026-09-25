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

import type { EmailMessage } from '$lib/server/email';
import type { SignInCodePurpose } from './options';

/** The email carrying a one-time code. Plain text only. */
export function signInCodeEmail(
  to: string,
  code: string,
  purpose: SignInCodePurpose,
): EmailMessage {
  const action =
    purpose === 'change-email'
      ? 'confirm your new email address'
      : purpose === 'email-verification'
        ? 'verify your email address'
        : 'sign in';

  return {
    to,
    subject: `${code} is your Temperature Blanket code`,
    text: [
      `Your code to ${action} on temperature-blanket.com is:`,
      '',
      code,
      '',
      'It expires in 5 minutes. If you didn’t ask for it, you can ignore this email.',
    ].join('\n'),
  };
}

/** Sent to the old address after the account's email changes. */
export function emailChangedNotice(to: string, newEmail: string): EmailMessage {
  const [name, domain] = newEmail.split('@');
  const masked = `${name.slice(0, 1)}***@${domain ?? ''}`;
  return {
    to,
    subject: 'Your Temperature Blanket email was changed',
    text: [
      `The email address for your temperature-blanket.com account was changed to ${masked}.`,
      '',
      'If you made this change, you don’t need to do anything.',
      'If you didn’t, contact info@temperature-blanket.com.',
    ].join('\n'),
  };
}
