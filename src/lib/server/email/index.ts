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

import { error } from '@sveltejs/kit';
import { DevOutboxSender } from './dev-outbox';
import type { EmailSender } from './types';

export type { EmailMessage, EmailSender } from './types';

/**
 * The email sender configured by EMAIL_SENDER. Only the dev outbox exists so far;
 * the real provider is added in Phase 1 once it's chosen. Responds 503 when no
 * sender is configured, so a missing setting never sends mail somewhere unexpected.
 */
export function getEmailSender(
  platform: App.Platform | undefined,
): EmailSender {
  const env = platform?.env;
  if (env?.EMAIL_SENDER === 'dev-outbox' && env.PROJECTS) {
    return new DevOutboxSender(env.PROJECTS);
  }
  error(503, 'Email is not available');
}
