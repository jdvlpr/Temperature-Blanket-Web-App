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

<!-- About This Weather: what the Weather step's one notice line sums up.
Values missing (with Fill In Missing and Weather Source) and recent days that
may still change (saved days never do on their own; Check for Updates later) -->
<script module lang="ts">
  import {
    METEOSTAT_DELAY_DAYS,
    OPEN_METEO_DELAY_DAYS,
  } from '#lib/constants/weather-constants.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import {
    dateToISO8601String,
    getIsRecentDate,
  } from '#lib/utils/date-utils.js';
  import type { MissingCounts } from '#lib/utils/weather-notes.js';

  const nulls = (values: (number | null)[] | undefined) =>
    values?.filter((n) => n === null).length ?? 0;

  /** The weather's notes, read from its state (call inside $derived) */
  export function readWeatherNotes() {
    const counts: MissingCounts = {
      tmin: nulls(weather.params.tmin),
      tavg: nulls(weather.params.tavg),
      tmax: nulls(weather.params.tmax),
      prcp: nulls(weather.params.prcp),
      snow: nulls(weather.params.snow),
    };
    // Days (or weeks) missing any temperature, as the notice counts them
    const missing = (weather.params.tmin ?? []).filter(
      (_, i) =>
        weather.params.tmin?.[i] === null ||
        weather.params.tavg?.[i] === null ||
        weather.params.tmax?.[i] === null,
    ).length;
    // The same days the table's May change filter shows
    const recentDates = [
      ...new Set(
        weather.rawData
          .map((day) => dateToISO8601String(day.date))
          .filter((date) => getIsRecentDate(date)),
      ),
    ].sort();
    const delay =
      weather.source.name === 'Meteostat'
        ? METEOSTAT_DELAY_DAYS
        : OPEN_METEO_DELAY_DAYS;
    return {
      counts,
      missing,
      total: weather.data.length,
      unit: weather.grouping,
      recentDates,
      delay,
    };
  }
</script>

<script lang="ts">
  import HelpIcon from '#lib/components/buttons/HelpIcon.svelte';
  import ChooseWeatherSource from '#lib/components/modals/ChooseWeatherSource.svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { openEditWeather } from '#lib/utils/open-edit-weather.js';
  import { missingLines } from '#lib/utils/weather-notes.js';
  import { CloudAlertIcon, ClockIcon } from '@lucide/svelte';

  const notes = $derived(readWeatherNotes());
  const lines = $derived(missingLines(notes.counts, notes.total, notes.unit));

  const shortDate = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });

  const recentSpan = $derived.by(() => {
    const dates = notes.recentDates;
    if (!dates.length) return '';
    const first = shortDate(dates[0]);
    const last = shortDate(dates[dates.length - 1]);
    return first === last ? first : `${first} – ${last}`;
  });

  function chooseSource() {
    dialog.trigger({
      type: 'component',
      component: { ref: ChooseWeatherSource },
      options: { title: 'Weather Source', size: 'small' },
    });
  }
</script>

<div class="flex flex-col gap-6 px-2 pt-2 pb-4 text-left">
  {#if notes.missing}
    <section class="flex flex-col gap-2">
      <h3 class="flex items-center gap-2 font-bold">
        <CloudAlertIcon /> Missing values
      </h3>
      <ul class="ml-6 list-disc">
        {#each lines as line (line)}
          <li>{line}</li>
        {/each}
      </ul>
      <p>
        You can keep going as it is. To fill the gaps, fill them in from the
        days around them, or try the other weather source, a place nearby, or
        dates further in the past.
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          class="btn preset-tonal-primary"
          onclick={() => openEditWeather()}
        >
          Fill In Missing…
        </button>
        <button class="btn preset-tonal-surface" onclick={chooseSource}>
          Weather Source…
        </button>
      </div>
    </section>
  {/if}

  {#if notes.recentDates.length}
    <section class="flex flex-col gap-2">
      <h3 class="flex items-center gap-2 font-bold">
        <ClockIcon /> Recent days may still change
      </h3>
      <p>
        {notes.recentDates.length === 1
          ? 'One day'
          : `${notes.recentDates.length} days`} ({recentSpan})
        {notes.recentDates.length === 1 ? 'is' : 'are'} recent. {weather.source
          .name} can take up to {notes.delay} days to settle the newest weather, so
        their values may still change a little.
      </p>
      <p>
        Your saved days never change on their own. Once they've settled, use
        <span class="font-bold">Check for Updates</span> to see what changed and
        choose what to keep.
        <HelpIcon topic="saved-weather-days" />
      </p>
      <p>
        If you'd rather work only with settled weather, keep your project about
        {notes.delay} days behind today.
      </p>
    </section>
  {/if}
</div>
