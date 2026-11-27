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

<!-- Report Page… on a gallery page (utils/open-report-page.ts): why, an
optional message and, signed out, an optional email for a reply. Block this
person too, when the page has a publisher to block. Sent to POST
/api/gallery/report and read by the site's owner on /gallery/reports. The page
stays unless they blocked too. -->

<script lang="ts">
  import { PUBLIC_BASE_DOMAIN_NAME } from '$app/env/public';
  import { galleryBlocks } from '#lib/accounts/gallery-blocks.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import DialogFooter from '#lib/components/modals/DialogFooter.svelte';
  import {
    BTN_PRIMARY,
    BTN_SECONDARY,
  } from '#lib/constants/class-constants.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import {
    REPORT_REASON_LABELS,
    type ReportReason,
  } from '#lib/utils/gallery-report.js';
  import { LoaderCircleIcon } from '@lucide/svelte';

  interface Props {
    postId: number;
    kind: 'project' | 'palette';
    /** The page's name */
    title: string;
    /** Published from an account, so its publisher can be blocked */
    blockable: boolean;
  }

  let { postId, kind, title, blockable }: Props = $props();

  let reason = $state<ReportReason | null>(null);
  let message = $state('');
  let email = $state('');
  let alsoBlock = $state(false);
  let busy = $state(false);
  let problem = $state<string | null>(null);

  const MESSAGE_MAX = 1000;
  const signedIn = $derived(__ACCOUNTS_ENABLED__ && !!account.summary);
  const contact = `hello@${PUBLIC_BASE_DOMAIN_NAME}`;
  const emailOk = $derived(
    signedIn ||
      !email.trim() ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
  );

  async function send(event: SubmitEvent) {
    event.preventDefault();
    if (!reason || !emailOk || busy) return;
    busy = true;
    problem = null;
    try {
      const response = await fetch('/api/gallery/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          kind,
          reason,
          message: message.trim(),
          email: signedIn ? null : email.trim() || null,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        problem = body?.message
          ? `${body.message}.`
          : 'It couldn’t be sent. Try again later.';
        return;
      }
      let blocked = false;
      if (alsoBlock && blockable)
        try {
          await galleryBlocks.block({ postId, kind, title });
          blocked = true;
        } catch (e) {
          toast.trigger({
            message: `Reported, but blocking didn’t work. ${(e as Error).message}`,
            category: 'error',
          });
          dialog.close();
          return;
        }
      dialog.close();
      toast.trigger({
        message: blocked
          ? 'Thanks. We’ll look at this page. You won’t see this person’s pages.'
          : 'Thanks. We’ll look at this page.',
      });
    } catch {
      problem = 'It couldn’t be sent. Are you online?';
    } finally {
      busy = false;
    }
  }

  const chip =
    'btn btn-sm preset-outlined-surface-300-700 has-checked:preset-filled-primary-500 has-focus-visible:ring-2 cursor-pointer';
</script>

<form class="flex flex-col gap-5 px-4 pt-2 text-left" onsubmit={send}>
  <p class="text-sm">
    Tell us what’s wrong with {title ? `“${title}”` : 'this page'}. Only the
    site’s owner sees reports, and the person who published it isn’t told who
    sent one.
  </p>

  <fieldset class="flex flex-col gap-2">
    <legend class="mb-2 font-bold">What’s wrong?</legend>
    <div class="flex flex-wrap gap-2">
      {#each REPORT_REASON_LABELS as option (option.value)}
        <label class={chip}>
          <input
            type="radio"
            name="report-reason"
            value={option.value}
            bind:group={reason}
            class="sr-only"
            required
          />
          {option.label}
        </label>
      {/each}
    </div>
  </fieldset>

  <label class="label">
    <span class="label-text font-bold"
      >Anything to add? <span class="font-normal opacity-70">(optional)</span
      ></span
    >
    <textarea
      class="textarea"
      rows="3"
      bind:value={message}
      maxlength={MESSAGE_MAX}></textarea>
  </label>

  {#if !signedIn}
    <label class="label">
      <span class="label-text font-bold"
        >Email <span class="font-normal opacity-70"
          >(optional, for a reply)</span
        ></span
      >
      <input
        type="email"
        class="input"
        bind:value={email}
        maxlength={254}
        autocomplete="email"
        aria-invalid={!emailOk}
      />
    </label>
  {/if}

  {#if blockable}
    <label class="flex items-start gap-2">
      <input type="checkbox" class="checkbox mt-0.5" bind:checked={alsoBlock} />
      <span
        >Block this person too
        <span class="block text-sm opacity-80"
          >You won’t see their pages in the Gallery, on the globe, or in
          Popular. They won’t be told.</span
        ></span
      >
    </label>
  {/if}

  {#if problem}
    <p class="text-error-700-300" role="alert">
      {problem}
      You can also email
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- mailto -->
      <a href="mailto:{contact}" class="link">{contact}</a>.
    </p>
  {/if}

  <DialogFooter>
    <button type="button" class={BTN_SECONDARY} onclick={() => dialog.close()}
      >Cancel</button
    >
    <button
      type="submit"
      class={BTN_PRIMARY}
      disabled={!reason || !emailOk || busy}
    >
      {#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
      Send Report
    </button>
  </DialogFooter>
</form>
