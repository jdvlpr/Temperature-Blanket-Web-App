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
  import ProjectHandoffReceiver from '#lib/components/ProjectHandoffReceiver.svelte';
  import { PAGE, PAGE_TEXT } from '#lib/constants/class-constants.js';
  import { MAIN_SITE_ORIGIN } from '#lib/constants/site.js';

  const mainName = MAIN_SITE_ORIGIN
    ? new URL(MAIN_SITE_ORIGIN).host
    : 'the main site';
</script>

<svelte:head>
  <title>Bring My Projects</title>
</svelte:head>

<AppShell pageName="Bring My Projects">
  {#snippet main()}
    <main class={[PAGE, PAGE_TEXT, 'my-2 flex flex-col gap-4']}>
      <h2 class="h2 text-gradient mt-2 max-lg:hidden">Bring My Projects</h2>

      <ProjectHandoffReceiver
        from={MAIN_SITE_ORIGIN}
        startLabel="Bring My Projects"
      >
        {#snippet notOpened()}
          <p>
            Start from
            <a href="{MAIN_SITE_ORIGIN ?? ''}/bring-to-beta" class="link"
              >Bring My Projects on {mainName}</a
            >, in the browser that has your projects.
          </p>
          <a href={resolve('/beta')} class="link w-fit">About the Beta</a>
        {/snippet}
      </ProjectHandoffReceiver>
    </main>
  {/snippet}
</AppShell>
