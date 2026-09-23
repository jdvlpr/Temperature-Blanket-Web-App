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

<!--
  A gallery project's details — date, yarns, pattern, weather sources —
  opened from the "About" button beside the project's actions. Shown through
  the app-wide DialogProvider (dialog.trigger), which supplies the close
  button, focus trap and Escape handling. Used to be an accordion inline
  above the preview image, which pushed the image far down when opened.
-->

<script lang="ts">
  import { ALL_YARN_WEIGHTS } from '$lib/constants/color-constants';
  import { pluralize } from '$lib/utils/string-utils';
  import type { PageData } from './$types';

  interface Props {
    project: PageData['project'];
    /** The project's title as plain text, for the dialog heading. */
    title: string;
    /** The project's colours grouped by yarn (see +page.svelte). */
    reshapedColors: Array<{
      brandName: string;
      yarnName: string;
      yarnWeightId: string;
      colors: Array<{ name: string; hex: string }>;
    }> | null;
    weatherSources: Array<{ name: string; url: string }> | null;
  }

  let { project, title, reshapedColors, weatherSources }: Props = $props();
</script>

<div class="flex flex-col gap-4 p-2 pb-8 text-left sm:p-4">
  <div>
    <h2 class="h2">About this project</h2>
    <p class="text-surface-600-400">{title}</p>
  </div>

  <div class="flex flex-col gap-2">
    <p class="">
      <span class="font-bold">Date Created:</span>
      {new Date(project?.date).toLocaleDateString(undefined, {
        timeZone: 'UTC',
      })}
    </p>

    {#if JSON.stringify(reshapedColors) !== '{}'}
      {#if reshapedColors?.some((item) => item.brandName && item.yarnName)}
        <span class="">
          <span class="font-bold">Yarn</span>:
          <div class="flex flex-col gap-2 pl-4">
            {#each reshapedColors as { brandName, yarnName, yarnWeightId, colors }}
              {@const yarnWeightName = ALL_YARN_WEIGHTS.find(
                (n) => n.id === yarnWeightId,
              )?.name}
              {#if brandName && yarnName}
                <div>
                  <span>
                    {brandName}
                    -
                    {yarnName}
                    <span class="text-sm opacity-70">
                      ({#if yarnWeightName}
                        <a
                          href="/blog/yarn-weights?highlight={yarnWeightName}"
                          class="link"
                          target="_blank"
                          title="See the yarn weights chart">{yarnWeightName}</a
                        >,{' '}
                      {/if}{colors.length}
                      {pluralize('colorway', colors.length)})
                    </span>
                  </span>
                  <div class="pl-4">
                    {#each colors as { name, hex }, index}
                      <div class="flex items-center gap-2">
                        <div
                          class="h-4 w-4 rounded-full"
                          style="background:{hex};"
                        ></div>
                        <p class="">
                          {name}
                        </p>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        </span>
      {/if}
    {/if}

    {#if project?.projectTags.nodes[0].name}
      <p>
        <span class="font-bold">Pattern Type</span>:
        <span class="">{project?.projectTags.nodes[0].name}</span>
      </p>
    {/if}

    {#if project?.projectTags.nodes[0].description}
      <p>
        <span class="font-bold">Pattern Description</span>:
        <span class=""> {project?.projectTags.nodes[0].description}</span>
      </p>
    {/if}

    {#if project?.totalDays}
      <p>
        <span class="font-bold">Total Days</span>:
        <span class="">{project?.totalDays}</span>
      </p>
    {/if}

    {#if project?.missingDays}
      <p>
        <span class="font-bold">Days Without Weather Data</span>:
        <span class="">{project?.missingDays}</span>
      </p>
    {/if}

    {#if weatherSources}
      {#each weatherSources as { name, url }}
        <p>
          <span class="font-bold">Weather Source</span>:
          <a href={url} target="_blank" class="link">{name}</a>
        </p>
      {/each}
    {/if}

    <p class="italic">
      The preview image may not reflect the most recent weather information.
      Open the project in the Project Planner to see any updates.
    </p>
  </div>
</div>
