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

// The beta's one question, asked once: after FEEDBACK_ASK_AFTER_MS with the
// beta in view (over every visit), a small toast asks whether this version is
// ready to replace the main site. An answer opens Send Feedback with it
// picked; dismissing it is fine. It waits for the beta's warning, any dialog
// and any passing toast (not the analytics one, which stays up), and never shows again
// once shown, or once feedback was sent. Started from AppShell.

import { dialog, toast } from '#lib/state/page-state.svelte.js';
import { isThumbnailFrame } from '#lib/storage/thumbnails.js';
import {
  FEEDBACK_ASKED_KEY,
  FEEDBACK_TIME_KEY,
  READY_ANSWERS,
  shouldAskForFeedback,
} from '#lib/utils/beta-feedback.js';
import { openBetaFeedback } from '#lib/utils/open-beta-feedback.js';
import { afterBetaWarning } from '#lib/utils/open-beta-warning.js';

const TICK_MS = 15_000;

let started = false;
let warningClosed = false;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: it just won't remember
  }
}

function ask(timer: ReturnType<typeof setInterval>) {
  clearInterval(timer);
  write(FEEDBACK_ASKED_KEY, 'true');
  toast.trigger({
    message:
      '<p class="font-bold">How’s the beta working for you?</p><p class="text-sm">Would you be happy if this version replaced the main site?</p>',
    actions: READY_ANSWERS.map(({ value, label }) => ({
      label,
      response: () => openBetaFeedback({ kind: 'overall', ready: value }),
    })),
    background: 'bg-surface-50 dark:bg-surface-950',
    timeout: 30_000,
    hoverable: true,
  });
}

export function startBetaFeedbackToast() {
  if (!__SITE_BETA__ || started) return;
  started = true;
  if (isThumbnailFrame() || read(FEEDBACK_ASKED_KEY)) return;
  afterBetaWarning(() => (warningClosed = true));

  const timer = setInterval(() => {
    // Feedback sent meanwhile: nothing to ask
    if (read(FEEDBACK_ASKED_KEY)) return clearInterval(timer);
    if (document.visibilityState !== 'visible') return;
    const timeInView = Number(read(FEEDBACK_TIME_KEY)) + TICK_MS;
    write(FEEDBACK_TIME_KEY, String(timeInView));
    if (
      shouldAskForFeedback({
        timeInView,
        asked: false,
        // Not the analytics toast, which stays until it's saved
        busy:
          !warningClosed ||
          dialog.opened ||
          toast.queue.some((shown) => (shown.timeout ?? 5000) <= 60_000),
      })
    )
      ask(timer);
  }, TICK_MS);
}
