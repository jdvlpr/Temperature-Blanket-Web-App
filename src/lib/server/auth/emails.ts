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

// Stripes like a temperature blanket, in the logo's colors
const STRIPES = ['#e8837c', '#f2c46d', '#8fb8c9', '#3d6b8c'];

/** A small branded HTML email: blanket stripes, a message and a big code. */
function codeEmailHtml(action: string, code: string): string {
  const stripes = STRIPES.map(
    (color) =>
      `<td style="height:8px;background:${color};font-size:0;line-height:0">&nbsp;</td>`,
  ).join('');
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px 12px;background:#f1f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2933">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
<tr>${stripes}</tr>
<tr><td colspan="4" style="padding:28px 28px 8px;text-align:center">
<p style="margin:0 0 4px;font-size:15px;color:#3d6b8c;font-weight:600">Temperature Blanket</p>
<p style="margin:0 0 20px;font-size:16px">Your code to ${action}:</p>
<p style="margin:0 0 20px;font-size:36px;font-weight:700;letter-spacing:8px;font-family:ui-monospace,Menlo,Consolas,monospace;background:#fdf3e1;border-radius:12px;padding:14px 0 14px 8px">${code}</p>
<p style="margin:0 0 24px;font-size:14px;color:#52606d">It expires in 5 minutes. If you didn’t ask for it, you can ignore this email.</p>
</td></tr>
</table>
<p style="text-align:center;font-size:12px;color:#7b8794;margin:16px 0 0">temperature-blanket.com</p>
</body></html>`;
}

/** The email carrying a one-time code, as plain text and HTML. */
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
    // The code is only digits and the action a fixed phrase, so nothing needs escaping
    html: codeEmailHtml(action, code),
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
