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

<!-- The receiving side of a project handoff (see #lib/utils/beta-handoff.ts):
this page was opened by `from`, which posts its saved projects here. Used by
the beta's /beta/import (from the main site) and the main site's /from-beta
(from the retired beta). -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { ProjectStorage } from '#lib/storage/projects.svelte.js';
  import {
    doneMessage,
    planImport,
    readHandoff,
    readyMessage,
  } from '#lib/utils/beta-handoff.js';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';

  type Props = {
    /** The only origin projects are taken from: the opener's */
    from: string | null;
    /** What to say when this page wasn't opened by `from` */
    notOpened: Snippet;
    /** The button to choose there again, for when it sends nothing */
    startLabel: string;
  };

  let { from, notOpened, startLabel }: Props = $props();

  /** How long to wait for the projects */
  const WAIT_MS = 30_000;

  let status = $state<
    'starting' | 'waiting' | 'importing' | 'done' | 'not-opened' | 'timed-out'
  >('starting');
  let result = $state({ imported: 0, skipped: 0, unreadable: 0 });

  const fromName = $derived(from ? new URL(from).host : 'the other site');

  async function bringIn(data: unknown, origin: string) {
    const read = readHandoff(data);
    if (!read || status !== 'waiting') return;
    status = 'importing';
    const index = await ProjectStorage.getIndex();
    const { save, skipped } = planImport(
      read.projects,
      index.map((item) => item.id),
      window.location.origin,
    );
    let failed = 0;
    for (const { id, project } of save) {
      try {
        // Signed in, each becomes the account's and syncs
        await ProjectStorage.save({ id, localProject: project });
      } catch {
        failed++;
      }
    }
    result = {
      imported: save.length - failed,
      skipped: skipped.length,
      unreadable: read.invalid + failed,
    };
    status = 'done';
    window.opener?.postMessage(
      doneMessage(result.imported, skipped.length),
      origin,
    );
  }

  onMount(() => {
    const opener: Window | null = window.opener;
    if (!opener || !from) {
      status = 'not-opened';
      return;
    }
    const origin = from;
    status = 'waiting';

    const onMessage = (event: MessageEvent) => {
      // Only the page that opened this one, at `from`
      if (event.origin !== origin || event.source !== opener) return;
      void bringIn(event.data, origin);
    };
    window.addEventListener('message', onMessage);

    // Until it answers: it may still be loading what it has saved
    const ready = () => {
      if (status !== 'waiting') return;
      try {
        opener.postMessage(readyMessage(), origin);
      } catch {
        // Closed, or gone to another site
      }
    };
    ready();
    const ping = setInterval(ready, 1000);
    const giveUp = setTimeout(() => {
      if (status === 'waiting') status = 'timed-out';
    }, WAIT_MS);

    return () => {
      window.removeEventListener('message', onMessage);
      clearInterval(ping);
      clearTimeout(giveUp);
    };
  });

  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;
</script>

<div aria-live="polite" class="flex flex-col gap-4">
  {#if status === 'starting' || status === 'waiting'}
    <p>Getting your projects from {fromName}…</p>
  {:else if status === 'importing'}
    <p>Saving your projects here…</p>
  {:else if status === 'done'}
    <p class="text-lg font-bold">
      {#if result.imported}
        {plural(result.imported, 'project', 'projects')} brought here.
      {:else}
        No new projects to bring.
      {/if}
    </p>
    {#if result.skipped}
      <p>
        {plural(
          result.skipped,
          'project was already here and was',
          'projects were already here and were',
        )} left as {result.skipped === 1 ? 'it is' : 'they are'}.
      </p>
    {/if}
    {#if result.unreadable}
      <p>
        {plural(
          result.unreadable,
          'project couldn’t be read',
          'projects couldn’t be read',
        )}. They're still on {fromName}.
      </p>
    {/if}
    <p>
      The copies on {fromName} are still there. Changes made here don't go back there.
    </p>
    <a href={resolve('/my-projects')} class="btn preset-filled w-fit"
      >Go to My Library</a
    >
  {:else if status === 'not-opened'}
    {@render notOpened()}
  {:else if status === 'timed-out'}
    <p>
      {fromName} didn't send any projects. Go back to it and choose
      <span class="font-bold">{startLabel}</span> again.
    </p>
  {/if}
</div>
