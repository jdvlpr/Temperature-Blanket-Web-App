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

<!-- Bring My Projects: the beta's side of the handoff from the main site, which
opens this page and posts its saved projects here (see
$lib/utils/beta-handoff.ts). Only in the beta's build (+page.ts). -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import AppShell from '#lib/components/AppShell.svelte';
  import { PAGE, PAGE_TEXT } from '#lib/constants/class-constants.js';
  import { MAIN_SITE_ORIGIN } from '#lib/constants/site.js';
  import { ProjectStorage } from '#lib/storage/projects.svelte.js';
  import {
    doneMessage,
    planImport,
    readHandoff,
    readyMessage,
  } from '#lib/utils/beta-handoff.js';
  import { onMount } from 'svelte';

  /** How long to wait for the main site's projects */
  const WAIT_MS = 30_000;

  let status = $state<
    'starting' | 'waiting' | 'importing' | 'done' | 'not-opened' | 'timed-out'
  >('starting');
  let result = $state({ imported: 0, skipped: 0, unreadable: 0 });

  const mainName = MAIN_SITE_ORIGIN
    ? new URL(MAIN_SITE_ORIGIN).host
    : 'the main site';

  async function bringIn(data: unknown) {
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
      MAIN_SITE_ORIGIN!,
    );
  }

  onMount(() => {
    const opener: Window | null = window.opener;
    if (!opener || !MAIN_SITE_ORIGIN) {
      status = 'not-opened';
      return;
    }
    const main = MAIN_SITE_ORIGIN;
    status = 'waiting';

    const onMessage = (event: MessageEvent) => {
      // Only the page that opened this one, on the main site
      if (event.origin !== main || event.source !== opener) return;
      void bringIn(event.data);
    };
    window.addEventListener('message', onMessage);

    // Until it answers: it may still be loading what it has saved
    const ready = () => {
      if (status !== 'waiting') return;
      try {
        opener.postMessage(readyMessage(), main);
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

<svelte:head>
  <title>Bring My Projects</title>
</svelte:head>

<AppShell pageName="Bring My Projects">
  {#snippet main()}
    <main class={[PAGE, PAGE_TEXT, 'my-2 flex flex-col gap-4']}>
      <h2 class="h2 text-gradient mt-2 max-lg:hidden">Bring My Projects</h2>

      <div aria-live="polite" class="flex flex-col gap-4">
        {#if status === 'starting' || status === 'waiting'}
          <p>Getting your projects from {mainName}…</p>
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
              )}. They're still on {mainName}.
            </p>
          {/if}
          <p>
            The copies on {mainName} are still there. Changes made here don't go back
            there.
          </p>
          <a href={resolve('/my-projects')} class="btn preset-filled w-fit"
            >Go to My Library</a
          >
        {:else if status === 'not-opened'}
          <p>
            Open this page with <span class="font-bold">Bring My Projects</span>
            on
            <a href={MAIN_SITE_ORIGIN ?? '/'} class="link">{mainName}</a>, in
            the browser that has your projects.
          </p>
          <a href={resolve('/beta')} class="link w-fit">About the Beta</a>
        {:else if status === 'timed-out'}
          <p>
            {mainName} didn't send any projects. Go back to it and choose
            <span class="font-bold">Bring My Projects</span> again.
          </p>
        {/if}
      </div>
    </main>
  {/snippet}
</AppShell>
