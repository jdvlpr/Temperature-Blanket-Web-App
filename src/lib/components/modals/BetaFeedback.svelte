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

<!-- The beta's Send Feedback dialog (utils/open-beta-feedback.ts): what it's
about, whether this version is ready to replace the main site, a message and,
signed out, an email for a reply. What's sent with it is listed before
sending. Saved by POST /api/beta/feedback and read on /beta/feedback; when it
can't be saved, email is offered instead. -->

<script lang="ts">
  import { PUBLIC_BASE_DOMAIN_NAME } from '$app/env/public';
  import { page } from '$app/state';
  import { account } from '#lib/accounts/summary.svelte.js';
  import Turnstile from '#lib/components/Turnstile.svelte';
  import DialogFooter from '#lib/components/modals/DialogFooter.svelte';
  import {
    BTN_PRIMARY,
    BTN_SECONDARY,
  } from '#lib/constants/class-constants.js';
  import { MAIN_SITE_ORIGIN } from '#lib/constants/site.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import {
    canSend,
    EMAIL_MAX,
    FEEDBACK_ASKED_KEY,
    FEEDBACK_KINDS,
    isEmail,
    MESSAGE_MAX,
    READY_ANSWERS,
    type FeedbackKind,
    type ReadyAnswer,
  } from '#lib/utils/beta-feedback.js';
  import { feedbackContext } from '#lib/utils/open-beta-feedback.js';
  import { TURNSTILE_HEADER } from '#lib/utils/turnstile.js';
  import { CircleCheckIcon, LoaderCircleIcon, MailIcon } from '@lucide/svelte';

  interface Props {
    kind?: FeedbackKind;
    ready?: ReadyAnswer;
  }

  let { kind: startKind, ready: startReady }: Props = $props();

  // Where it starts: from the toast, an answer picked
  // svelte-ignore state_referenced_locally
  let kind = $state<FeedbackKind>(
    startKind ?? (startReady ? 'overall' : 'broken'),
  );
  // svelte-ignore state_referenced_locally
  let ready = $state<ReadyAnswer | null>(startReady ?? null);
  let message = $state('');
  let email = $state('');

  let turnstile = $state<Turnstile>();
  let busy = $state(false);
  let sent = $state(false);
  let problem = $state<string | null>(null);
  /** It can't be saved here: offer email */
  let offerEmail = $state(false);

  const signedIn = $derived(__ACCOUNTS_ENABLED__ && !!account.summary);
  const mainName = new URL(
    MAIN_SITE_ORIGIN ?? 'https://temperature-blanket.com',
  ).host;
  const contact = `hello@${PUBLIC_BASE_DOMAIN_NAME}`;
  // A snapshot, so what's listed is what's sent
  const context = feedbackContext();
  const pagePath = page.url.pathname;

  const prompts: Record<FeedbackKind, string> = {
    broken: 'What did you do, and what happened?',
    confusing: 'What were you trying to do, and where did you get stuck?',
    idea: 'What would make it better?',
    overall: 'Anything to add?',
  };

  const messageOptional = $derived(kind === 'overall' && ready !== null);
  const emailOk = $derived(signedIn || !email.trim() || isEmail(email.trim()));
  const sendable = $derived(
    canSend({ kind, ready, message: message.trim() }) && emailOk && !busy,
  );

  const mailto = $derived(
    `mailto:${contact}?subject=${encodeURIComponent('Beta feedback')}&body=${encodeURIComponent(
      `${message}\n\n(Page: ${pagePath} · Version ${context.version} · ${context.userAgent})`,
    )}`,
  );

  function markAsked() {
    try {
      localStorage.setItem(FEEDBACK_ASKED_KEY, 'true');
    } catch {
      // Storage blocked: the toast may ask once more
    }
  }

  async function send(event: SubmitEvent) {
    event.preventDefault();
    if (!sendable) return;
    busy = true;
    problem = null;
    offerEmail = false;
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (!signedIn) {
        try {
          headers[TURNSTILE_HEADER] = (await turnstile?.getToken()) ?? '';
        } catch {
          problem = 'The check that you’re not a robot couldn’t run.';
          offerEmail = true;
          return;
        }
      }
      const response = await fetch('/api/beta/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          kind,
          ready,
          message,
          email: signedIn ? null : email.trim() || null,
          page: pagePath,
          context,
        }),
      });
      if (response.ok) {
        sent = true;
        markAsked();
        if (typeof window.clarity === 'function')
          window.clarity('event', 'beta_feedback');
        return;
      }
      const body = await response.json().catch(() => null);
      problem = body?.message ? `${body.message}.` : 'It couldn’t be sent.';
      // Not something they can fix here
      offerEmail = response.status >= 500 || response.status === 403;
    } catch {
      problem = 'It couldn’t be sent. Are you online?';
      offerEmail = true;
    } finally {
      busy = false;
    }
  }

  const chip =
    'btn btn-sm preset-outlined-surface-300-700 has-checked:preset-filled-primary-500 has-focus-visible:ring-2 cursor-pointer';
</script>

{#if sent}
  <div class="flex flex-col items-center gap-3 px-4 pt-2 pb-2 text-center">
    <CircleCheckIcon class="text-success-600-400 size-10" aria-hidden="true" />
    <p class="text-lg font-bold">Thank you!</p>
    <p>
      Your feedback was sent. It helps decide when this version is ready for {mainName}.
    </p>
    <DialogFooter>
      <button type="button" class={BTN_PRIMARY} onclick={() => dialog.close()}
        >Done</button
      >
    </DialogFooter>
  </div>
{:else}
  <form class="flex flex-col gap-5 px-4 pt-2 text-left" onsubmit={send}>
    <fieldset class="flex flex-col gap-2">
      <legend class="mb-2 font-bold">What’s it about?</legend>
      <div class="flex flex-wrap gap-2">
        {#each FEEDBACK_KINDS as option (option.value)}
          <label class={chip}>
            <input
              type="radio"
              name="feedback-kind"
              value={option.value}
              bind:group={kind}
              class="sr-only"
            />
            {option.label}
          </label>
        {/each}
      </div>
    </fieldset>

    <fieldset class="flex flex-col gap-2">
      <legend class="mb-2 font-bold"
        >Would you be happy if this version replaced {mainName} today?
        <span class="font-normal opacity-70">(optional)</span></legend
      >
      <div class="flex flex-wrap gap-2">
        {#each READY_ANSWERS as option (option.value)}
          <label class={chip}>
            <input
              type="radio"
              name="feedback-ready"
              value={option.value}
              bind:group={ready}
              class="sr-only"
            />
            {option.label}
          </label>
        {/each}
        {#if ready}
          <button
            type="button"
            class="btn btn-sm hover:preset-tonal-surface"
            onclick={() => (ready = null)}>Clear</button
          >
        {/if}
      </div>
    </fieldset>

    <label class="label">
      <span class="label-text font-bold"
        >{prompts[kind]}
        {#if messageOptional}<span class="font-normal opacity-70"
            >(optional)</span
          >{/if}</span
      >
      <textarea
        class="textarea"
        rows="5"
        bind:value={message}
        maxlength={MESSAGE_MAX}
        required={!messageOptional}></textarea>
    </label>

    {#if signedIn}
      <p class="text-sm opacity-80">
        Sent from your account, so a reply can go to {account.summary?.email}.
      </p>
    {:else}
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
          maxlength={EMAIL_MAX}
          autocomplete="email"
          aria-invalid={!emailOk}
        />
      </label>
    {/if}

    <details class="text-sm">
      <summary class="cursor-pointer opacity-80">What’s sent with it</summary>
      <ul class="mt-2 list-disc space-y-1 pl-6 opacity-80">
        <li>
          This page: {pagePath}{#if context.hadQuery}
            (not its link, which holds your project){/if}
        </li>
        <li>The site’s version: {context.version}</li>
        <li>Your browser, screen size and language</li>
        <li>
          {#if context.errors.length}
            {context.errors.length}
            {context.errors.length === 1 ? 'error' : 'errors'} from this visit
          {:else}
            Any errors from this visit (none so far)
          {/if}
        </li>
        <li>Not your projects, location or weather data</li>
      </ul>
    </details>

    {#if !signedIn}
      <Turnstile bind:this={turnstile} />
    {/if}

    {#if problem}
      <div class="flex flex-col gap-1" role="alert">
        <p class="text-error-700-300">{problem}</p>
        {#if offerEmail}
          <p>
            You can email it instead:
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- mailto -->
            <a href={mailto} class="link">{contact}</a>
          </p>
        {/if}
      </div>
    {/if}

    <DialogFooter>
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- mailto -->
      <a href={mailto} class={BTN_SECONDARY}>
        <MailIcon />
        Email Instead
      </a>
      <button type="submit" class={BTN_PRIMARY} disabled={!sendable}>
        {#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
        Send Feedback
      </button>
    </DialogFooter>
  </form>
{/if}
