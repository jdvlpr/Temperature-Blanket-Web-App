<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- An invite to the version 7 beta for a share of visitors; see
$lib/utils/beta-invite.ts. Pages are prerendered, so whether to show it is
known only in the browser: it appears after mount, never on the server. -->

<script lang="ts">
  import { page } from '$app/state';
  import { persistedState } from '$lib/storage/preferences.svelte';
  import { BETA_ORIGIN } from '$lib/utils/beta-handoff';
  import {
    BETA_INVITE_KEY,
    clampPercent,
    pickBucket,
    shouldShowBetaInvite,
    type BetaInvite,
  } from '$lib/utils/beta-invite';
  import { ExternalLinkIcon, XIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  const percent = clampPercent(__BETA_INVITE_PERCENT__);

  let invite = $state.raw<{ value: BetaInvite } | null>(null);

  onMount(() => {
    // Nothing is stored while the invite is off
    if (percent === 0) return;
    invite = persistedState<BetaInvite>(BETA_INVITE_KEY, {
      bucket: pickBucket(),
      dismissed: false,
    });
  });

  const show = $derived(
    !!invite &&
      !page.url.pathname.startsWith('/bring-to-beta') &&
      shouldShowBetaInvite({ percent, ...invite.value }),
  );
</script>

{#if show && invite}
  <div
    class="bg-secondary-100-900 flex w-full items-center justify-center gap-1 px-2 py-1 [view-transition-name:top-banner]"
    id="top-banner"
  >
    <!-- eslint-disable svelte/no-navigation-without-resolve -- the beta, another site -->
    <a
      href={BETA_ORIGIN}
      target="_blank"
      rel="noopener"
      class="btn preset-filled-secondary-400-600 my-2 whitespace-pre-wrap"
    >
      Try the next beta version
      <ExternalLinkIcon class="relative -top-[1px] size-5" />
    </a>
    <!-- eslint-enable svelte/no-navigation-without-resolve -->
    <button
      type="button"
      class="btn-icon hover:preset-tonal-surface shrink-0"
      aria-label="Close"
      title="Close"
      onclick={() => {
        if (invite) invite.value = { ...invite.value, dismissed: true };
      }}
    >
      <XIcon />
    </button>
  </div>
{/if}
