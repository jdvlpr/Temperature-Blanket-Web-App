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

<!-- Bring My Projects: copies this browser's saved projects to the version 7
beta (next.temperature-blanket.com). Nothing on this site links here; the
beta's About page does. See $lib/utils/beta-handoff.ts. -->

<script lang="ts">
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { ProjectStorage } from '$lib/storage/projects.svelte';
  import {
    BETA_IMPORT_URL,
    BETA_ORIGIN,
    collectProjects,
    isReady,
    projectsMessage,
    readDone,
  } from '$lib/utils/beta-handoff';
  import { onMount } from 'svelte';

  /** How long to wait for the beta to answer */
  const WAIT_MS = 60_000;

  let count = $state<number | null>(null);
  let status = $state<
    'idle' | 'opening' | 'sending' | 'done' | 'blocked' | 'timed-out'
  >('idle');
  let result = $state({ imported: 0, skipped: 0 });

  onMount(async () => {
    count = (await ProjectStorage.getIndex()).length;
  });

  let stop = () => {};
  onMount(() => () => stop());

  function bring() {
    stop();
    const beta = window.open(BETA_IMPORT_URL, '_blank');
    if (!beta) {
      status = 'blocked';
      return;
    }
    status = 'opening';
    let sent = false;

    const onMessage = async (event: MessageEvent) => {
      // Only the window this page opened, at the beta's address
      if (event.origin !== BETA_ORIGIN || event.source !== beta) return;
      if (isReady(event.data) && !sent) {
        sent = true;
        status = 'sending';
        const index = await ProjectStorage.getIndex();
        const projects = await collectProjects(
          index.map((item) => item.id),
          (id) => ProjectStorage.getById(id),
        );
        beta.postMessage(projectsMessage(projects), BETA_ORIGIN);
        return;
      }
      const done = readDone(event.data);
      if (done) {
        result = done;
        status = 'done';
        stop();
      }
    };
    window.addEventListener('message', onMessage);
    const giveUp = setTimeout(() => {
      if (status === 'opening' || status === 'sending') status = 'timed-out';
      stop();
    }, WAIT_MS);
    stop = () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(giveUp);
    };
  }

  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;
</script>

<svelte:head>
  <title>Bring My Projects to the Beta</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<AppShell pageName="Bring My Projects">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="mx-auto flex max-w-(--breakpoint-sm) flex-col gap-4 px-4 lg:px-0"
    >
      <h2 class="h2 text-gradient mt-2 max-lg:hidden">
        Bring My Projects to the Beta
      </h2>
      <p>
        The next version of this site is being tried early at
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the beta, another site -->
        <a href={BETA_ORIGIN} class="link">next.temperature-blanket.com</a>. It
        keeps its own saved projects, so this copies the ones saved in this
        browser there. They stay here too, and projects already on the beta are
        left as they are.
      </p>

      <div aria-live="polite" class="flex flex-col gap-4">
        {#if count === 0}
          <p>No projects are saved in this browser.</p>
        {:else if status === 'idle' || status === 'blocked' || status === 'timed-out'}
          {#if status === 'blocked'}
            <p>
              The beta couldn't open in a new tab. Allow pop-ups for this site,
              then try again.
            </p>
          {:else if status === 'timed-out'}
            <p>
              The beta didn't answer. Keep its tab open until it says your
              projects are there, then try again.
            </p>
          {/if}
          <button type="button" class="btn preset-filled w-fit" onclick={bring}>
            Bring {count === null
              ? 'My Projects'
              : plural(count, 'Project', 'Projects')} to the Beta
          </button>
        {:else if status === 'opening' || status === 'sending'}
          <p>Copying your projects to the beta, in its new tab…</p>
        {:else if status === 'done'}
          <p class="text-lg font-bold">
            {result.imported
              ? `${plural(result.imported, 'project', 'projects')} copied to the beta.`
              : 'No new projects to copy.'}
          </p>
          {#if result.skipped}
            <p>
              {plural(
                result.skipped,
                'project was already there',
                'projects were already there',
              )}.
            </p>
          {/if}
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the beta, another site -->
          <a href={BETA_ORIGIN} class="btn preset-filled w-fit"
            >Go to the Beta</a
          >
        {/if}
      </div>
    </main>
  {/snippet}
</AppShell>
