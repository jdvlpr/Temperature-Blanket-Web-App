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

import type { R2Bucket } from '@cloudflare/workers-types';
import { error } from '@sveltejs/kit';
import { DevOutboxSender } from './dev-outbox';
import { ResendSender } from './resend';
import type { EmailSender } from './types';

export type { EmailMessage, EmailSender } from './types';

export type EmailEnv = {
  EMAIL_SENDER?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ENABLE_DEV_ROUTES?: string;
  PROJECTS?: R2Bucket;
};

/**
 * Why email can't be sent with these settings, or null when it can. Accounts
 * treat a problem here as misconfiguration (503), so a sign-in never says
 * "check your email" when nothing can be sent.
 */
export function emailConfigProblem(env: EmailEnv | undefined): string | null {
  switch (env?.EMAIL_SENDER) {
    case 'resend':
      if (!env.RESEND_API_KEY) return 'RESEND_API_KEY is not set';
      if (!env.EMAIL_FROM) return 'EMAIL_FROM is not set';
      return null;
    case 'dev-outbox':
      // Anyone who can reach /api/dev/outbox can read every code, so only where dev routes are on
      if (env.ENABLE_DEV_ROUTES !== 'true')
        return 'EMAIL_SENDER=dev-outbox needs ENABLE_DEV_ROUTES=true';
      if (!env.PROJECTS)
        return 'EMAIL_SENDER=dev-outbox needs the PROJECTS binding';
      return null;
    default:
      return 'EMAIL_SENDER must be "resend" or "dev-outbox"';
  }
}

/** The configured email sender. Responds 503 when email isn't configured. */
export function getEmailSender(
  platform: App.Platform | undefined,
): EmailSender {
  const env = platform?.env;
  if (emailConfigProblem(env) || !env) error(503, 'Email is not available');
  return env.EMAIL_SENDER === 'resend'
    ? new ResendSender(env.RESEND_API_KEY!, env.EMAIL_FROM!)
    : new DevOutboxSender(env.PROJECTS!);
}
