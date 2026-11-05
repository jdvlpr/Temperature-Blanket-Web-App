// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// Opens the beta's Send Feedback dialog (modals/BetaFeedback.svelte): from the
// beta's banner, About the Beta, and its one-time toast with an answer picked.

import BetaFeedback from '#lib/components/modals/BetaFeedback.svelte';
import { version } from '$app/env';
import {
  consentToMSClarityCookies,
  dialog,
} from '#lib/state/page-state.svelte.js';
import type {
  FeedbackContext,
  FeedbackKind,
  ReadyAnswer,
} from '#lib/utils/beta-feedback.js';
import { recentErrors } from '#lib/utils/recent-errors.js';

/** What's sent with feedback from this page, now */
export function feedbackContext(): FeedbackContext {
  return {
    version,
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    language: navigator.language,
    hadQuery: window.location.search.length > 1,
    analytics: consentToMSClarityCookies.value,
    errors: recentErrors(),
  };
}

export function openBetaFeedback(
  start: { kind?: FeedbackKind; ready?: ReadyAnswer } = {},
) {
  dialog.trigger({
    type: 'component',
    component: { ref: BetaFeedback, props: start },
    options: { title: 'Send Feedback', size: 'medium' },
  });
}
