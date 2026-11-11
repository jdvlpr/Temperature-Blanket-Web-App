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

<!-- Move My Projects: the main site's side of the handoff from the retired beta
(next.temperature-blanket.com, after launch), whose banner opens this page and
posts the projects saved only in that browser here (see
$lib/utils/beta-handoff.ts). Nothing links here. -->

<script lang="ts">
  import AppShell from '#lib/components/AppShell.svelte';
  import ProjectHandoffReceiver from '#lib/components/ProjectHandoffReceiver.svelte';
  import { PAGE, PAGE_TEXT } from '#lib/constants/class-constants.js';
  import { BETA_ORIGIN } from '#lib/constants/site.js';
</script>

<svelte:head>
  <title>Move My Projects</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<AppShell pageName="Move My Projects">
  {#snippet main()}
    <main class={[PAGE, PAGE_TEXT, 'my-2 flex flex-col gap-4']}>
      <h2 class="h2 text-gradient mt-2 max-lg:hidden">Move My Projects</h2>

      <ProjectHandoffReceiver from={BETA_ORIGIN} startLabel="Move My Projects">
        {#snippet notOpened()}
          <p>
            This brings projects saved in a browser on the beta,
            next.temperature-blanket.com. To move them, go to
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the retired beta, another site -->
            <a href={BETA_ORIGIN} class="link">next.temperature-blanket.com</a>
            in that browser and choose
            <span class="font-bold">Move My Projects</span> at the top of the page.
          </p>
        {/snippet}
      </ProjectHandoffReceiver>
    </main>
  {/snippet}
</AppShell>
