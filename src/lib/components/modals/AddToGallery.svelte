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
  import { resolve } from '$app/paths';
  import Spinner from '$lib/components/Spinner.svelte';
  import { locations } from '$lib/state/location-state.svelte';
  import { previews } from '$lib/state/preview-state.svelte';
  import { project } from '$lib/state/project-state.svelte';
  import { sendToProjectGallery } from '$lib/utils/project-utils.svelte';
  import { svgToPNG } from '$lib/utils/preview-utils.svelte';
  import { account } from '$lib/accounts/summary.svelte';
  import { ExternalLinkIcon } from '@lucide/svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { onMount } from 'svelte';
  import StickyPart from './StickyPart.svelte';
  import ShowOwnerToggle from '$lib/components/account/ShowOwnerToggle.svelte';
  import { ProjectStorage } from '$lib/storage/projects.svelte';

  // In the Project menu's narrow panel: one column, not three
  const inPanel = $derived(dialog.options.placement === 'side');

  let submitting = $state(false),
    message = $state<{ text: string; icon: 'spinner' | 'none' } | undefined>();

  // Signed in with publishing from accounts on: the page is linked to the account
  let fromAccount = $state(false);
  // Include it on the account's public gallery, starting from the last choice
  let showOwner = $state(false);
  let serverName = $state<string | null>(null);
  let ownerName = $derived((serverName ?? account.summary?.name ?? '').trim());
  // The name the saved project was given, which the gallery shows as its title
  let projectName = $state('');

  onMount(async () => {
    projectName = (await ProjectStorage.getById(project.id))?.name ?? '';
    if (!__ACCOUNTS_ENABLED__ || !account.summary) return;
    const { getGalleryPages } = await import('$lib/accounts/gallery');
    const gallery = await getGalleryPages();
    if (!gallery?.publishing) return;
    showOwner = gallery.settings.showOwnerDefault;
    if (typeof gallery.name === 'string') serverName = gallery.name;
    fromAccount = true;
  });

  async function submit() {
    const active = previews.active;
    if (!active?.svg || !active?.width || !active?.height) return;

    submitting = true;
    if (fromAccount) {
      // Published from the account, it's kept there too, next to its gallery page
      const { saveOpenProject } = await import('$lib/storage/autosave.svelte');
      await saveOpenProject();
    }
    message = {
      text: "<p class='font-bold text-xl my-4 text-center'>Sending Project...</p><p class='italic'>This could take up to a few minutes. Please don't navigate away.</p>",
      icon: 'spinner',
    };
    const imgSrc = await svgToPNG({
      svgNode: active.svg,
      width: active.width,
      height: active.height,
      download: false,
    });

    const img = new Image();
    img.onload = async () => {
      message = {
        text: await sendToProjectGallery(imgSrc, {
          fromAccount,
          showOwner: fromAccount && showOwner,
          name: projectName,
        }),
        icon: 'none',
      };
      submitting = false;
    };

    img.src = imgSrc;

    document.getElementById('temporary-canvas')?.remove();
  }
</script>

<div class="w-full p-4 pt-2 text-center">
  {#if project.gallery.href && project.gallery.title && project.gallery.title === locations.projectTitle}
    <div class="card preset-filled-surface-100-900 mt-4 p-4 text-center">
      <p class="my-2">
        This project has a gallery page:
        <a
          href={project.gallery.href}
          target="_blank"
          class="link btn hover:preset-tonal-surface w-fit whitespace-pre-wrap"
          rel="noreferrer"><ExternalLinkIcon />{project.gallery.title}</a
        >
      </p>
    </div>
  {/if}
  <div
    class="grid max-w-(--breakpoint-sm) grid-cols-1 gap-4 {inPanel
      ? ''
      : 'sm:grid-cols-3'}"
  >
    {#if !message}
      <div
        class="col-span-full flex flex-col gap-2 {inPanel
          ? ''
          : 'sm:col-span-2'}"
      >
        <p class="text-left text-lg font-bold">
          Do you understand and agree to the following terms and conditions?
        </p>
        <div class="flex flex-col gap-2 text-left">
          <p>
            • I am submitting this project's {projectName
              ? 'name, '
              : ''}location and dates, gauge and yarn information, URL, preview
            image, and the current date to be displayed as a gallery page in the
            public
            <a href="/gallery" target="_blank" class="link">Project Gallery</a
            >.{#if fromAccount && showOwner && ownerName}
              It will say “By {ownerName}”, linking to your public gallery page.
            {:else}
              No personal information will be sent.
            {/if}
          </p>
          {#if fromAccount}
            <p>
              • It will be linked to your account, so you can remove it later
              from <a
                href={resolve('/my-projects')}
                target="_blank"
                class="link">My Projects</a
              >.
            </p>
          {/if}
          <p>
            • This project's gallery page cannot be edited once it is submitted.
          </p>
          <p>
            • Submissions which appear to be spam or abuse of this service may
            be removed.
          </p>
          <p>• Gallery pages are subject to change.</p>
        </div>
        {#if fromAccount}
          <ShowOwnerToggle
            kind="project"
            bind:checked={showOwner}
            name={ownerName}
          />
        {/if}
      </div>
      <div
        class="bg-surface-50 dark:bg-surface-950 rounded-container pointer-events-none col-span-full m-auto mb-4 flex w-full max-w-[250px] flex-col gap-2 p-4 {inPanel
          ? ''
          : 'sm:col-span-1'}"
      >
        <span class="line-clamp-4 font-bold"
          >{projectName || locations.projectTitle}</span
        >
        {#if previews.active}
          <previews.active.previewComponent />
        {/if}
      </div>
    {:else}
      <div
        class="col-span-full flex w-full flex-col items-center justify-center gap-4"
      >
        {#if message.icon === 'spinner'}
          <Spinner />
        {/if}

        <div class="my-2 flex flex-col items-center justify-center gap-2">
          {@html message.text}
        </div>
      </div>
    {/if}
  </div>
</div>

<StickyPart position="bottom">
  {#if !submitting && !message}
    <div
      class="flex flex-col items-center justify-center gap-2 p-2 py-4 text-center"
    >
      <p class="text-sm italic">
        {#if fromAccount}
          You can remove it later from My Projects.
        {:else}
          This action can't be undone.
        {/if}
      </p>
      <button
        class="btn preset-filled-primary-500"
        title="Add project to gallery"
        onclick={submit}>Yes, Send to Gallery</button
      >
    </div>
  {/if}
</StickyPart>
