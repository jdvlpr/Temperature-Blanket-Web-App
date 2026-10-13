<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- Cloudflare Turnstile's check that a guest isn't a robot. Nothing loads
until getToken() is called, just before a submission; the widget shows here
only when Cloudflare needs the person to do something. Each call gets a new
token, since a token works once and expires after five minutes. -->

<script lang="ts">
  import { PUBLIC_TURNSTILE_SITE_KEY } from '$app/env/public';
  import { loadTurnstile, type TurnstileApi } from '#lib/utils/turnstile.js';
  import { onDestroy } from 'svelte';

  let container = $state<HTMLDivElement>();
  let api: TurnstileApi | undefined;
  let widgetId: string | undefined;
  let pending:
    | { resolve: (token: string) => void; reject: (error: Error) => void }
    | undefined;
  let destroyed = false;

  const settle = (token: string | null) => {
    const current = pending;
    pending = undefined;
    if (token) current?.resolve(token);
    else current?.reject(new Error('Turnstile failed'));
  };

  /**
   * A new token. Throws when the check can't run (the script is blocked, say).
   * Without a site key it gives '' and /api/project refuses the submission.
   */
  export async function getToken(): Promise<string> {
    if (!PUBLIC_TURNSTILE_SITE_KEY) return '';
    api = await loadTurnstile();
    if (destroyed || !container) throw new Error('Turnstile closed');
    settle(null);
    const promise = new Promise<string>(
      (resolve, reject) => (pending = { resolve, reject }),
    );
    if (widgetId === undefined) {
      widgetId = api.render(container, {
        sitekey: PUBLIC_TURNSTILE_SITE_KEY,
        execution: 'execute',
        appearance: 'interaction-only',
        size: 'flexible',
        theme: document.documentElement.classList.contains('dark')
          ? 'dark'
          : 'light',
        // Publishing again tries again, so Turnstile doesn't retry on its own
        retry: 'never',
        'refresh-expired': 'manual',
        callback: (token: string) => settle(token),
        'error-callback': () => {
          settle(null);
          return true;
        },
        'expired-callback': () => settle(null),
        'timeout-callback': () => settle(null),
        'unsupported-callback': () => settle(null),
      });
    } else {
      api.reset(widgetId);
    }
    api.execute(container);
    return promise;
  }

  onDestroy(() => {
    destroyed = true;
    settle(null);
    if (api && widgetId !== undefined) api.remove(widgetId);
  });
</script>

<div bind:this={container} class="empty:hidden"></div>
