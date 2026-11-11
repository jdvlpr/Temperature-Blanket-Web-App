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

<!-- Move My Projects, on the retired beta (the main site's build at
next.temperature-blanket.com after launch): opens the main site's /from-beta and
posts it the projects saved only in this browser (see
#lib/utils/beta-handoff.ts). Projects in an account are there already. -->

<script lang="ts">
  import { BETA_ORIGIN, MAIN_SITE_ORIGIN } from '#lib/constants/site.js';
  import { ProjectStorage } from '#lib/storage/projects.svelte.js';
  import {
    collectProjects,
    isReady,
    projectsMessage,
    projectsToMove,
    readDone,
  } from '#lib/utils/beta-handoff.js';
  import { onMount } from 'svelte';

  /** How long to wait for the main site to answer */
  const WAIT_MS = 60_000;

  const main = MAIN_SITE_ORIGIN ?? 'https://temperature-blanket.com';
  const mainName = new URL(main).host;

  let ids = $state<string[] | null>(null);
  let status = $state<
    'idle' | 'opening' | 'sending' | 'done' | 'blocked' | 'timed-out'
  >('idle');
  let result = $state({ imported: 0, skipped: 0 });

  onMount(async () => {
    ids = projectsToMove(await ProjectStorage.getIndex());
  });

  let stop = () => {};
  onMount(() => () => stop());

  function move() {
    stop();
    const target = window.open(`${main}/from-beta`, '_blank');
    if (!target) {
      status = 'blocked';
      return;
    }
    status = 'opening';
    let sent = false;

    const onMessage = async (event: MessageEvent) => {
      // Only the window this opened, at the main site
      if (event.origin !== main || event.source !== target) return;
      if (isReady(event.data) && !sent) {
        sent = true;
        status = 'sending';
        const index = await ProjectStorage.getIndex();
        const projects = await collectProjects(projectsToMove(index), (id) =>
          ProjectStorage.getById(id),
        );
        target.postMessage(projectsMessage(projects), main);
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

<div class="flex flex-col gap-4 px-4 pt-2 text-left">
  <p>
    Version 7 is now the main site, at
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the main site, another origin -->
    <a href={main} class="link">{mainName}</a>.
    {new URL(BETA_ORIGIN).host} keeps its own saved projects, so this copies the ones
    saved only in this browser there. They stay here too.
  </p>
  <p>
    Projects in your account are on {mainName} already: sign in there to see them.
  </p>

  <div aria-live="polite" class="flex flex-col gap-4">
    {#if ids === null}
      <p>Looking for projects saved in this browser…</p>
    {:else if ids.length === 0}
      <p class="font-bold">
        No projects are saved only in this browser, so there's nothing to move.
      </p>
    {:else if status === 'idle' || status === 'blocked' || status === 'timed-out'}
      {#if status === 'blocked'}
        <p>
          {mainName} couldn't open in a new tab. Allow pop-ups for this site, then
          try again.
        </p>
      {:else if status === 'timed-out'}
        <p>
          {mainName} didn't answer. Keep its tab open until it says your projects
          are there, then try again.
        </p>
      {/if}
      <button type="button" class="btn preset-filled w-fit" onclick={move}>
        Move {plural(ids.length, 'Project', 'Projects')} to {mainName}
      </button>
    {:else if status === 'opening' || status === 'sending'}
      <p>Copying your projects to {mainName}, in its new tab…</p>
    {:else if status === 'done'}
      <p class="text-lg font-bold">
        {result.imported
          ? `${plural(result.imported, 'project', 'projects')} copied to ${mainName}.`
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
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the main site, another origin -->
      <a href={main} class="btn preset-filled w-fit">Go to {mainName}</a>
    {/if}
  </div>
</div>
