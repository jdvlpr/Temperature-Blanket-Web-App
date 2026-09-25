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

<script lang="ts">
  import {
    accountErrorMessage,
    confirmEmailChange,
    requestEmailChange,
    sendCurrentEmailCode,
  } from '$lib/accounts/client';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { LoaderCircleIcon, MailIcon } from '@lucide/svelte';
  import CodeInput from './CodeInput.svelte';
  import EmailText from './EmailText.svelte';

  let {
    email,
    onchanged,
  }: { email: string; onchanged: (newEmail: string) => void } = $props();

  let step: 'idle' | 'current' | 'new' = $state('idle');
  let currentCode = $state('');
  let newEmail = $state('');
  let newCode = $state('');
  let busy = $state(false);
  let errorMessage = $state('');
  let doneMessage = $state('');

  async function run(action: () => Promise<void>) {
    busy = true;
    errorMessage = '';
    try {
      await action();
    } catch (e) {
      errorMessage = accountErrorMessage(e);
    } finally {
      busy = false;
    }
  }

  const start = () =>
    run(async () => {
      doneMessage = '';
      await sendCurrentEmailCode(email);
      currentCode = '';
      newEmail = '';
      step = 'current';
    });

  const submitCurrent = (event: Event) => {
    event.preventDefault();
    return run(async () => {
      await requestEmailChange(newEmail.trim(), currentCode.trim());
      newCode = '';
      step = 'new';
    });
  };

  const submitNew = (event: Event) => {
    event.preventDefault();
    return run(async () => {
      const changedTo = newEmail.trim();
      await confirmEmailChange(changedTo, newCode.trim());
      step = 'idle';
      doneMessage = `Your email is now ${changedTo}.`;
      onchanged(changedTo);
    });
  };

  const cancel = () => {
    step = 'idle';
    errorMessage = '';
  };
</script>

<div class="flex flex-col gap-3 px-4 py-3">
  <div class="flex min-h-11 items-center gap-3">
    <MailIcon class="shrink-0 opacity-70" />
    <div class="min-w-0 flex-1">
      <p class="text-sm opacity-70">Email</p>
      <p><EmailText {email} testid="account-email" /></p>
    </div>
    {#if step === 'idle'}
      <button
        type="button"
        class="btn btn-sm preset-outlined-surface-300-700 hover:preset-tonal-surface shrink-0"
        aria-label="Change email"
        onclick={start}
        disabled={busy}
      >
        {#if busy}<LoaderCircleIcon class="animate-spin" size="16" />{/if}
        Change
      </button>
    {/if}
  </div>
  {#if step === 'idle' && doneMessage}
    <p class="text-success-700-300 text-sm" role="status">{doneMessage}</p>
  {:else if step === 'current'}
    <form class="flex flex-col gap-3" onsubmit={submitCurrent} in:safeSlide>
      <p>
        First, confirm it’s you: we sent a code to <EmailText {email} />.
      </p>
      <CodeInput
        label="Code sent to your current email"
        bind:value={currentCode}
        disabled={busy}
      />
      <label class="label">
        <span class="label-text">New email</span>
        <input
          type="email"
          class="input h-11"
          autocomplete="email"
          autocapitalize="off"
          spellcheck="false"
          inputmode="email"
          required
          bind:value={newEmail}
          disabled={busy}
        />
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          type="submit"
          class="btn preset-filled-primary-500 max-sm:w-full"
          disabled={busy}
          >{#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
          Send a code to the new email</button
        >
        <button
          type="button"
          class="btn preset-tonal-surface max-sm:w-full"
          onclick={cancel}
          disabled={busy}>Cancel</button
        >
      </div>
    </form>
  {:else if step === 'new'}
    <form class="flex flex-col gap-3" onsubmit={submitNew} in:safeSlide>
      <p>
        Now enter the code we sent to <EmailText email={newEmail} />.
      </p>
      <CodeInput
        label="Code sent to your new email"
        bind:value={newCode}
        disabled={busy}
      />
      <div class="flex flex-wrap gap-2">
        <button
          type="submit"
          class="btn preset-filled-primary-500 max-sm:w-full"
          disabled={busy}
          >{#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
          Confirm new email</button
        >
        <button
          type="button"
          class="btn preset-tonal-surface max-sm:w-full"
          onclick={cancel}
          disabled={busy}>Cancel</button
        >
      </div>
    </form>
  {/if}
  {#if errorMessage}
    <p class="text-error-700-300" role="alert">{errorMessage}</p>
  {/if}
</div>
