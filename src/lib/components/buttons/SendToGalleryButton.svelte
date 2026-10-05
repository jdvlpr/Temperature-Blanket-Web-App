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

<script>
  import { locations } from '$lib/state/location-state.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { project } from '$lib/state/project-state.svelte';
  import { ExternalLinkIcon, SendIcon } from '@lucide/svelte';
  import AddToGallery from '../modals/AddToGallery.svelte';

  let { isPrimary = false } = $props();

  // Already sent: a link to its gallery page instead, as in the Project menu
  const hasGalleryPage = $derived(
    Boolean(
      project.gallery.href &&
      project.gallery.title &&
      project.gallery.title === locations.projectTitle,
    ),
  );
</script>

{#if hasGalleryPage}
  <!-- eslint-disable svelte/no-navigation-without-resolve -- the gallery page's own address -->
  <a
    href={project.gallery.href}
    target="_blank"
    rel="noreferrer"
    class="btn hover:preset-tonal-surface w-fit whitespace-pre-wrap"
    title="Open this project's gallery page"
  >
    <SendIcon />
    View Gallery Page
    <ExternalLinkIcon class="size-4 opacity-60" />
  </a>
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
  <button
    class={[
      'btn w-fit whitespace-pre-wrap',
      isPrimary
        ? 'bg-primary-50-950 border-primary-500 hover:preset-tonal-primary border'
        : 'hover:preset-tonal-surface',
    ]}
    onclick={() =>
      dialog.trigger({
        type: 'component',
        component: {
          ref: AddToGallery,
        },
        options: { title: 'Send to Project Gallery' },
      })}
    title="Show Send to Gallery Modal"
  >
    <SendIcon />
    Send to Project Gallery
  </button>
{/if}
