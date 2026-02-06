<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

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
  import { MOON_PHASE_NAMES } from '$lib/constants';
  import { allGaugesAttributes, project, toast } from '$lib/state';
  import type { StoredProject } from '$lib/storage/projects.svelte';
  import {
    convertTime,
    exists,
    getProjectParametersFromURLHash,
    pluralize,
  } from '$lib/utils';
  import {
    ClipboardCopyIcon,
    DownloadIcon,
    TriangleAlertIcon,
  } from '@lucide/svelte';

  let { uid, error } = $props();

  let _projects = $derived(project.status.temporaryProjectsBackup);
  let projects = $derived.by(() => {
    return _projects.slice().reverse();
  });

  function getUnits(href: string) {
    const url = new URL(href);
    const hash = url.hash;
    const params = getProjectParametersFromURLHash(hash);
    if (exists(params.u)) {
      return params.u.value === 'i' ? 'imperial' : 'metric';
    }
    return 'metric';
  }

  function getWeatherGrouping(href: string) {
    const url = new URL(href);
    const hash = url.hash;
    const params = getProjectParametersFromURLHash(hash);
    // Load Weather Grouping Setting if present
    if (exists(params.w)) {
      return 'Week Of';
    } else {
      // Otherwise set to the default 'day'
      return 'Date';
    }
  }

  function downloadWeatherCSV(project: StoredProject) {
    const weatherData = project.weatherData;
    const units = getUnits(project.href);

    const weatherGrouping = getWeatherGrouping(project.href);

    const labels = [];
    allGaugesAttributes.forEach((gauge) => {
      gauge.targets.forEach((target) => {
        if (target?.id === 'dayt') {
          labels.push(`${target.label} (h:m)`);
        } else if (target?.id === 'moon') {
          labels.push(`${target.label}`);
        } else {
          labels.push(`${target.label} (${gauge.unit.label[units]})`);
        }
      });
    });

    const _weather = [...weatherData].map((day, index) => {
      const gaugeInfo = [];
      allGaugesAttributes?.forEach((gauge) => {
        gauge.targets?.forEach((target) => {
          if (target?.id === 'dayt') {
            gaugeInfo.push(
              convertTime(day[target?.id][units], {
                displayUnits: false,
                padStart: true,
              }),
            );
          } else if (target?.id === 'moon') {
            gaugeInfo.push(MOON_PHASE_NAMES[day[target?.id]]);
          } else {
            gaugeInfo.push(day[target?.id][units]);
          }
        });
      });
      return [index + 1, day.date, day.location, gaugeInfo];
    });

    const data = [
      ['Item Number', weatherGrouping, 'Location Index', ...labels],
      ..._weather,
    ];
    const csvContent = `data:text/csv;charset=utf-8,\uFEFF${data?.map((e) => e.join(',')).join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Weather-Data-${project.title}`);
    link.className = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<div class="flex w-full flex-col items-start gap-2 p-4">
  <h2 class="my-2 flex items-center gap-2 text-xl font-bold">
    <TriangleAlertIcon /> Save Your {pluralize('Project', projects.length)}
  </h2>
  <p class="text-warning-800-200">
    There was a technical issue accessing your saved
    {pluralize('project', projects.length)}. To make sure your data is not lost,
    please copy the {pluralize('URL', projects.length)} below to a safe place like
    a note or document, and download the weather data for each project.
  </p>
  <p class="text-warning-800-200">
    <span class="font-bold"
      >If you don't save the URL and weather data for a project now, it may not
      be possible to access it later, and you'll have to start creating your
      project from scratch.</span
    >
    Once you have saved the link and downloaded the weather data for each project
    below, you can close this notification and continue using the site. You can open
    a project using its URL, and
    <a href="/documentation#import-weather-data" class="link" target="_blank"
      >import the weather data from the CSV file</a
    >, if necessary. Sorry for any inconvenience.
  </p>
  <p class="opacity-60">
    {#if !error}This issue has been logged so the developer can review it.{/if} Your
    unique ID is: <span class="font-semibold select-all">{uid}</span>. For more
    information or questions, please send an email to
    <a
      href="mailto:hello@temperature-blanket.com?subject=Project Issue&body=Include this ID: {uid}"
      class="link">hello@temperature-blanket.com</a
    >, and include the ID.
  </p>
  <div class="flex flex-col gap-6">
    {#each projects as project}
      <div class="card bg-surface-100-900 flex flex-col gap-2 p-2">
        <div class="">
          <h3 class="text-lg font-semibold">{project.title}</h3>
          <p class=" text-sm">Created {project.date}</p>
        </div>
        <p
          class="card bg-primary-50 dark:bg-primary-950 w-full basis-full p-4 text-sm break-all whitespace-pre-wrap select-all"
        >
          {project.href}
        </p>
        <div class="flex w-full flex-wrap items-center gap-2">
          <button
            class="btn preset-filled-primary-500 w-fit"
            onclick={() => {
              navigator.clipboard.writeText(project.href);
              toast.trigger({
                category: 'success',
                message: 'Copied to clipboard!',
              });
            }}
          >
            <ClipboardCopyIcon />
            Copy Project URL to Clipboard
          </button>

          {#if project.weatherData && project.weatherData.length}
            <button
              class="btn preset-filled-secondary-500 w-fit"
              onclick={() => downloadWeatherCSV(project)}
            >
              <DownloadIcon />
              Download Weather Data (CSV)
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
