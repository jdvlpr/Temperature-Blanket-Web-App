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

<!-- Save, in the top bar: saves right away (see saveProject), and shows the
state. Once saved, a project saves by itself, so it's a status (Saved,
Saving…, Not saved); a problem opens the Project menu. Green means saved, and
the icon says where: a cloud for the account, a screen for this browser only.
Beside the project's name (wider screens), saved is just the icon there, which
opens a popover saying where it's saved, like Google Docs' cloud icon. -->

<script lang="ts">
  import SaveStatus from '$lib/components/SaveStatus.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { project } from '$lib/state/project-state.svelte';
  import { autosave } from '$lib/storage/autosave.svelte';
  import { saveProject } from '$lib/utils/save-project.svelte';
  import {
    BookmarkCheckIcon,
    BookmarkIcon,
    CloudAlertIcon,
    CloudCheckIcon,
    LoaderCircleIcon,
    MonitorCheckIcon,
    MonitorXIcon,
  } from '@lucide/svelte';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';

  let { beside }: { beside?: 'title' } = $props();

  let busy = $state(false);

  const status = $derived.by(() => {
    if (autosave.on) {
      if (autosave.state === 'error' || autosave.state === 'conflict')
        return 'problem';
      if (autosave.state === 'saved') return 'saved';
      return 'saving';
    }
    if (busy) return 'saving';
    // Another account's project, here signed out: Save as before
    if (autosave.stored) return project.status.saved ? 'kept' : 'changed';
    return 'new';
  });

  const where = $derived(
    autosave.account ? 'to your account' : 'in this browser',
  );

  const label = $derived(
    {
      problem: 'Not saved',
      saved: 'Saved',
      saving: 'Saving…',
      kept: 'Saved',
      changed: 'Save',
      new: 'Save',
    }[status],
  );

  const title = $derived(
    {
      problem: 'Not saved: see the Project menu',
      saved: `Saved ${where}. Changes save by themselves.`,
      saving: 'Saving…',
      kept: 'Saved in this browser',
      changed: 'Save changes [Cmd ⌘]+[s] or [Ctrl]+[s]',
      new: 'Save Project [Cmd ⌘]+[s] or [Ctrl]+[s]',
    }[status],
  );

  /** Nothing to save: saved, or saving */
  const statusOnly = $derived(
    beside === 'title' &&
      (status === 'saved' || status === 'kept' || status === 'saving'),
  );

  async function save() {
    busy = true;
    try {
      await saveProject();
    } finally {
      busy = false;
    }
  }
</script>

{#snippet icon()}
  {#if status === 'problem'}
    {#if autosave.account}
      <CloudAlertIcon class="text-error-700-300" />
    {:else}
      <MonitorXIcon class="text-error-700-300" />
    {/if}
  {:else if status === 'saving'}
    <LoaderCircleIcon class="animate-spin opacity-70" />
  {:else if status === 'saved'}
    {#key autosave.account}
      <span class="saved-pop flex">
        {#if autosave.account}
          <CloudCheckIcon class="text-success-700-300" />
        {:else}
          <MonitorCheckIcon class="text-success-700-300" />
        {/if}
      </span>
    {/key}
  {:else if status === 'kept'}
    <BookmarkCheckIcon class="text-success-700-300" />
  {:else}
    <BookmarkIcon />
  {/if}
{/snippet}

{#if statusOnly && status === 'saved'}
  <Popover positioning={{ placement: 'bottom' }}>
    <Popover.Trigger
      class="hover:preset-tonal-surface rounded-base flex size-8 shrink-0 items-center justify-center [&_svg]:size-5"
      aria-label="Saved {where}"
      title="Saved {where}"
      data-testid="save-button"
    >
      {@render icon()}
    </Popover.Trigger>
    <Portal>
      <Popover.Positioner>
        <Popover.Content
          class="bg-surface-200-800 rounded-container z-50 w-72 max-w-[calc(100vw-2rem)] p-4 text-left shadow-xl"
        >
          {#snippet element(attributes)}
            {#if !attributes.hidden}
              <div {...attributes} transition:safeSlide>
                <Popover.Description>
                  <SaveStatus />
                </Popover.Description>
                <Popover.Arrow
                  class="-z-10"
                  style="--arrow-size: calc(var(--spacing) * 4); --arrow-background: var(--color-surface-200-800);"
                >
                  <Popover.ArrowTip />
                </Popover.Arrow>
              </div>
            {/if}
          {/snippet}
        </Popover.Content>
      </Popover.Positioner>
    </Portal>
  </Popover>
{:else if statusOnly}
  <span
    role="img"
    aria-label={label}
    {title}
    class="flex size-8 shrink-0 items-center justify-center [&_svg]:size-5"
    data-testid="save-button"
  >
    {@render icon()}
  </span>
{:else}
  <button
    type="button"
    aria-label={label}
    {title}
    class="max-md:btn-icon md:btn hover:preset-tonal-surface relative shrink-0"
    onclick={save}
    disabled={status === 'saving'}
    data-testid="save-button"
  >
    {@render icon()}
    <span class="inline-block max-md:hidden">{label}</span>
    {#if status === 'changed'}
      <!-- Changes since the last save -->
      <span
        class="bg-primary-500 absolute top-1 right-1 size-2 rounded-full"
        aria-hidden="true"
      ></span>
    {/if}
  </button>
{/if}

<style>
  /* Saved: the check lands with a little pop, once per save */
  .saved-pop {
    animation: saved-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes saved-pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .saved-pop {
      animation: none;
    }
  }
</style>
