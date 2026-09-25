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
  import { LoaderCircleIcon } from '@lucide/svelte';

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

<div class="flex flex-col gap-2">
  {#if step === 'idle'}
    <p>Email: <strong data-testid="account-email">{email}</strong></p>
    {#if doneMessage}<p role="status">{doneMessage}</p>{/if}
    <button
      type="button"
      class="btn preset-tonal-surface w-fit"
      onclick={start}
      disabled={busy}
    >
      {#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
      Change email
    </button>
  {:else if step === 'current'}
    <form class="flex flex-col gap-2" onsubmit={submitCurrent}>
      <p>
        First, confirm it’s you: we sent a code to <strong>{email}</strong>.
      </p>
      <label class="label">
        <span class="label-text">Code sent to your current email</span>
        <input
          type="text"
          class="input tracking-widest"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern={'[0-9]{6}'}
          maxlength="6"
          required
          bind:value={currentCode}
          disabled={busy}
        />
      </label>
      <label class="label">
        <span class="label-text">New email</span>
        <input
          type="email"
          class="input"
          autocomplete="email"
          required
          bind:value={newEmail}
          disabled={busy}
        />
      </label>
      <div class="flex gap-2">
        <button
          type="submit"
          class="btn preset-filled-primary-500 w-fit"
          disabled={busy}
          >{#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
          Send a code to the new email</button
        >
        <button
          type="button"
          class="btn preset-tonal-surface w-fit"
          onclick={cancel}
          disabled={busy}>Cancel</button
        >
      </div>
    </form>
  {:else}
    <form class="flex flex-col gap-2" onsubmit={submitNew}>
      <p>We sent a code to <strong>{newEmail}</strong>.</p>
      <label class="label">
        <span class="label-text">Code sent to your new email</span>
        <input
          type="text"
          class="input tracking-widest"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern={'[0-9]{6}'}
          maxlength="6"
          required
          bind:value={newCode}
          disabled={busy}
        />
      </label>
      <div class="flex gap-2">
        <button
          type="submit"
          class="btn preset-filled-primary-500 w-fit"
          disabled={busy}
          >{#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
          Change email</button
        >
        <button
          type="button"
          class="btn preset-tonal-surface w-fit"
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
