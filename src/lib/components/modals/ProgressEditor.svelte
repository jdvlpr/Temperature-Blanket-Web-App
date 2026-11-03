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

<!-- @component
  Progress: the one place how far the blanket is made gets set. Everything
  else shows it and opens this (`utils/open-progress.ts`).

  Opened from a day (a table circle, a day's details), Set Progress to that
  day leads (it saves and closes), until the day shown changes at all. Then
  the day shown: Made through, big between ‹ and › (a day back or on; tapping
  the day opens the date picker to jump), the bar, and "62% made · 226 of 365
  days". Changes are a draft until Save; Cancel (or closing) keeps progress
  as it was. Clear Progress, Cancel and Save at the foot. Also shown inside
  Update Weather Data (`ondone` back to it).
-->
<script lang="ts">
  import ProgressBar from '#lib/components/ProgressBar.svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { untrack } from 'svelte';
  import { progress } from '#lib/state/progress-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import type { TISO8601DateString } from '#lib/types/weather-types.js';
  import {
    madeThroughOf,
    nextDay,
    previousDay,
    progressOf,
    shortDay,
  } from '#lib/utils/project-progress.js';
  import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@lucide/svelte';

  interface Props {
    /** Opened from this day: leads with Set Made Through it */
    day?: TISO8601DateString | null;
    /** After Save or Cancel: closes the dialog (or back to the one it came
     * from) unless given */
    ondone?: () => void;
  }

  let { day = null, ondone }: Props = $props();

  const uid = $props.id();
  let picker = $state<HTMLInputElement>();

  // The draft: what Save sets, from where progress is when it opens
  const openedAt = untrack(() => progress.madeThrough);
  let made = $state<TISO8601DateString | null>(openedAt);
  const shown = $derived(progressOf(weather.rawData, made));
  const next = $derived(nextDay(progress.dates, made));
  const previous = $derived(previousDay(progress.dates, made));
  const changed = $derived(made !== progress.madeThrough);

  const close = () => (ondone ? ondone() : dialog.dismiss());
  function save(madeThrough: TISO8601DateString | null = made) {
    progress.set(madeThrough);
    close();
  }

  /** "Mar 12, 2026" */
  const longDay = (iso: TISO8601DateString) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  // A day before the first is none made; after the last, all of them
  function fromPicker(value: string) {
    const picked = madeThroughOf(value);
    if (!picked) return;
    if (progress.first && picked < progress.first) made = null;
    else if (progress.last && picked > progress.last) made = progress.last;
    else made = picked;
  }

  // A tap on a touch screen opens the picker by itself (iOS); opening it
  // again in the same tap can lose the first day picked. A mouse click on
  // the hidden field would only focus it, so open the picker for it
  function openPicker() {
    if (!matchMedia('(pointer: fine)').matches) return;
    try {
      picker?.showPicker();
    } catch {
      picker?.focus();
    }
  }

  // The day it was opened from, offered until the day shown changes at all
  // (‹ ›, a picked day, Clear): then it's gone for this opening
  let used = $state(false);
  $effect(() => {
    if (made !== openedAt) used = true;
  });
  const leading = $derived(!!day && day !== openedAt && !used);

  // Not started, the picker opens on the day it was opened from, else the
  // project's first day, not today (iOS opens an empty one on today). Those
  // days aren't picked by tapping them again, but Set Progress and › set them
  const pickerStart = $derived(day ?? progress.first ?? '');
</script>

<div
  class="flex w-full flex-col gap-5 p-4 pt-2 text-center"
  data-testid="progress-editor"
>
  {#if day}
    <section
      class="flex flex-col items-center gap-3"
      data-testid="progress-day"
    >
      <button
        type="button"
        class="btn preset-filled-primary-500"
        onclick={() => save(day)}
      >
        <CheckIcon />
        Set Progress to {shortDay(day)}
      </button>
    </section>
    <div class="flex items-center justify-center gap-2">
      <span
        class="border-surface-300-700 relative top-[1px] h-1 flex-1 border-t"
      ></span>
      <span class="text-sm">Or</span>
      <span
        class="border-surface-300-700 relative top-[1px] h-1 flex-1 border-t"
      ></span>
    </div>
  {/if}

  <section class="flex flex-col items-center gap-3">
    <p
      class="text-surface-700-300 flex items-center gap-1 text-sm"
      id="{uid}-label"
    >
      Update Progress
    </p>

    <div class="flex w-full items-center justify-center gap-3">
      <button
        type="button"
        class="btn-icon btn-icon-lg preset-tonal shrink-0"
        aria-label={previous
          ? `Back a day: made through ${shortDay(previous)}`
          : 'Back a day: not started'}
        title="Back a day"
        disabled={!made}
        onclick={() => (made = previous)}
      >
        <ChevronLeftIcon />
      </button>

      <!-- The day; tapping it opens the date picker -->
      <div
        class="rounded-container focus-within:ring-primary-500 relative min-w-0 grow focus-within:ring-2"
      >
        <span
          class={[
            'block px-2 py-1 font-bold',
            leading ? 'text-2xl' : 'text-3xl',
          ]}
          aria-hidden="true"
        >
          {made ? longDay(made) : 'Not started'}
        </span>
        <span class="text-surface-700-300 block text-xs" aria-hidden="true"
          >Tap to pick a day</span
        >
        <input
          bind:this={picker}
          type="date"
          class="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-labelledby="{uid}-label"
          min={progress.first}
          max={progress.last}
          value={made ?? pickerStart}
          onclick={openPicker}
          oninput={(e) =>
            /* iOS may not send change for the first day picked from empty */
            fromPicker(e.currentTarget.value)}
          onchange={(e) => fromPicker(e.currentTarget.value)}
        />
      </div>

      <button
        type="button"
        class="btn-icon btn-icon-lg preset-tonal shrink-0"
        aria-label={next
          ? `On a day: made through ${shortDay(next)}`
          : 'On a day: finished'}
        title="On a day"
        disabled={!next}
        onclick={() => (made = next)}
      >
        <ChevronRightIcon />
      </button>
    </div>

    <div class="flex w-full flex-col gap-1.5" role="status">
      <ProgressBar percent={shown.percent} />
      <p class="text-sm">
        {#if !made}
          Nothing made yet · {shown.total} days
        {:else if shown.finished}
          <strong>Finished</strong> · every day is made
        {:else}
          <strong>{shown.percent}% made</strong> · {shown.made} of {shown.total}
          days
        {/if}
      </p>
    </div>
  </section>

  <div class="flex items-center justify-between gap-2">
    <button
      type="button"
      class="btn hover:preset-tonal-surface"
      disabled={!made}
      onclick={() => (made = null)}
    >
      Clear Progress
    </button>
    <div class="flex items-center gap-2">
      <button type="button" class="btn preset-tonal" onclick={close}
        >Cancel</button
      >
      <!-- Not a second main button beside Set Progress to -->
      <button
        type="button"
        class={['btn', leading ? 'preset-tonal' : 'preset-filled-primary-500']}
        disabled={!changed}
        onclick={() => save()}>Save</button
      >
    </div>
  </div>
</div>
