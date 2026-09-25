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
    clearSignedInHint,
    deleteAccount,
    needsFreshSession,
    sendSignInCode,
    signInWithCode,
  } from '$lib/accounts/client';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { LoaderCircleIcon, Trash2Icon } from '@lucide/svelte';
  import CodeInput from './CodeInput.svelte';
  import EmailText from './EmailText.svelte';

  let { email, ondeleted }: { email: string; ondeleted: () => void } = $props();

  let step: 'idle' | 'confirm' | 'reconfirm' = $state('idle');
  let code = $state('');
  let busy = $state(false);
  let errorMessage = $state('');

  async function remove() {
    busy = true;
    errorMessage = '';
    try {
      await deleteAccount();
      clearSignedInHint();
      ondeleted();
    } catch (e) {
      if (needsFreshSession(e)) {
        // More than 10 minutes since sign-in: confirm with a new code first
        try {
          await sendSignInCode(email);
          code = '';
          step = 'reconfirm';
        } catch (sendError) {
          errorMessage = accountErrorMessage(sendError);
        }
      } else {
        errorMessage = accountErrorMessage(e);
      }
    } finally {
      busy = false;
    }
  }

  async function reconfirm(event: Event) {
    event.preventDefault();
    busy = true;
    errorMessage = '';
    try {
      await signInWithCode(email, code.trim());
    } catch (e) {
      errorMessage = accountErrorMessage(e);
      busy = false;
      return;
    }
    await remove();
  }
</script>

<div class="flex flex-col gap-3">
  {#if step === 'idle'}
    <p class="text-sm opacity-80">
      Permanently deletes your account and signs you out everywhere. Projects
      saved in this browser stay here.
    </p>
    <button
      type="button"
      class="btn preset-tonal-error w-fit max-sm:w-full"
      onclick={() => (step = 'confirm')}
    >
      <Trash2Icon /> Delete account
    </button>
  {:else if step === 'confirm'}
    <div class="flex flex-col gap-3" in:safeSlide>
      <p class="font-bold">Delete your account for good?</p>
      <p class="text-sm opacity-80">
        This can’t be undone. Projects saved in this browser stay here.
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn preset-filled-error-500 max-sm:w-full"
          onclick={remove}
          disabled={busy}
          >{#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
          Yes, delete my account</button
        >
        <button
          type="button"
          class="btn preset-tonal-surface max-sm:w-full"
          onclick={() => (step = 'idle')}
          disabled={busy}>Cancel</button
        >
      </div>
    </div>
  {:else}
    <form class="flex flex-col gap-3" onsubmit={reconfirm} in:safeSlide>
      <p>
        To delete your account, confirm it’s you: we sent a code to
        <EmailText {email} />.
      </p>
      <CodeInput bind:value={code} disabled={busy} />
      <div class="flex flex-wrap gap-2">
        <button
          type="submit"
          class="btn preset-filled-error-500 max-sm:w-full"
          disabled={busy}
          >{#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
          Confirm and delete</button
        >
        <button
          type="button"
          class="btn preset-tonal-surface max-sm:w-full"
          onclick={() => (step = 'idle')}
          disabled={busy}>Cancel</button
        >
      </div>
    </form>
  {/if}
  {#if errorMessage}
    <p class="text-error-700-300" role="alert">{errorMessage}</p>
  {/if}
</div>
