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
  Every weather table's grid: a header of columns (with units, sorting when
  `sort` is bound), a day column kept in view across, and only the rows in
  view drawn, each one fixed height (`lines` of text). `scroll="box"` scrolls
  in itself (in a dialog: give it a height, e.g. `flex-1` in a column);
  `scroll="window"` is as tall as its rows, the page scrolling, its header
  kept under the top bar.

  The table draws its own cells (`cell`: the whole cell, with `CELL` or its
  own role and events; ValueCell inside) and day (`day`: inside the day
  column). A `lead` column (a checkbox) can go before the day. Rows are in
  the order given; sorting and filtering are the table's.
-->
<script lang="ts" generics="Row">
  import { ArrowDownIcon, ArrowUpIcon } from '@lucide/svelte';
  import { tick, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { SortDirection } from '#lib/utils/weather-grid.js';
  import { VirtualRows } from './virtual-rows.svelte.js';
  import {
    SwatchDetails,
    setSwatchDetails,
  } from './grid-color.svelte.js';
  import SwatchDetailsPopover from './SwatchDetailsPopover.svelte';
  import type { GridColumn } from './grid-styles.js';


  let {
    rows,
    key,
    columns,
    dayHeader = 'Day',
    dayWidth = '10.5rem',
    daySortable = false,
    lines = 1,
    scroll = 'box',
    role = 'table',
    label,
    sort = $bindable(null),
    lead,
    day,
    cell,
    empty,
    rowTint,
    rowAttributes,
    grid = $bindable(),
    gridAttributes = {},
    class: className = '',
  }: {
    rows: readonly Row[];
    /** Each row's unique key */
    key: (row: Row, index: number) => string;
    columns: readonly GridColumn[];
    dayHeader?: string;
    dayWidth?: string;
    /** The day column can be sorted by (as `id: 'day'`) */
    daySortable?: boolean;
    /** Lines of text in a row, which sets its height */
    lines?: number;
    scroll?: 'box' | 'window';
    role?: 'table' | 'grid';
    label: string;
    /** The column sorted by and which way, null for the rows' own order */
    sort?: { id: string; direction: SortDirection } | null;
    lead?: {
      width: string;
      header: Snippet;
      cell: Snippet<[Row, number]>;
    };
    day: Snippet<[Row, number]>;
    /** A whole cell, with its role and place (`CELL`) */
    cell: Snippet<[Row, GridColumn, number, number]>;
    empty?: Snippet;
    /** A row's tint over its stripe (a CSS color), e.g. TINT.picked */
    rowTint?: (row: Row, index: number) => string | null | undefined | false;
    rowAttributes?: (row: Row, index: number) => Record<string, unknown>;
    /** The element with the grid's role (to focus, as Edit Weather Data does) */
    grid?: HTMLDivElement;
    gridAttributes?: HTMLAttributes<HTMLDivElement> & Record<string, unknown>;
    class?: string;
  } = $props();

  /** Height of a row: 36px for one line, 16px more for each line after */
  const rowHeight = $derived(36 + 16 * (Math.max(1, lines) - 1));

  const virtual = new VirtualRows();
  $effect.pre(() => {
    virtual.count = rows.length;
    virtual.rowHeight = rowHeight;
  });

  const details = new SwatchDetails();
  setSwatchDetails(details);

  // The header and the rows scroll across together (each in its own
  // element, so the header can stay at the top of the page)
  let header: HTMLDivElement | undefined = $state();
  let body: HTMLDivElement | undefined = $state();

  const template = $derived(
    [
      lead?.width,
      dayWidth,
      ...columns.map((c) => c.width ?? 'minmax(6.5rem, 1fr)'),
    ]
      .filter(Boolean)
      .join(' '),
  );

  // The narrowest the rows can be (each column's least), so the header and
  // the rows (placed absolutely, so they don't widen theirs) are as wide
  const least = (track: string) => {
    const minmax = /^minmax\(\s*([^,]+),/.exec(track);
    return (minmax ? minmax[1] : track).trim();
  };
  const minWidth = $derived(
    `calc(${[
      lead?.width,
      dayWidth,
      ...columns.map((c) => least(c.width ?? 'minmax(6.5rem, 1fr)')),
    ]
      .filter(Boolean)
      .join(' + ')})`,
  );

  function measureWindow() {
    if (scroll !== 'window' || !body) return;
    const top = body.getBoundingClientRect().top;
    virtual.offset = -top;
    virtual.viewHeight = window.innerHeight;
  }

  $effect(() => {
    if (scroll !== 'window') return;
    measureWindow();
    const onscroll = () => measureWindow();
    window.addEventListener('scroll', onscroll, { passive: true });
    window.addEventListener('resize', onscroll, { passive: true });
    // What's above it changes height (the chart, notes)
    const observer = new ResizeObserver(onscroll);
    observer.observe(document.body);
    return () => {
      window.removeEventListener('scroll', onscroll);
      window.removeEventListener('resize', onscroll);
      observer.disconnect();
    };
  });

  /** Brings a row into view: `center` it, or just enough to see it (`nearest`) */
  export async function scrollToRow(
    row: number,
    align: 'center' | 'nearest' = 'center',
  ) {
    if (!body || row < 0) return;
    const rowTop = row * rowHeight;
    if (scroll === 'box') {
      const view = body.clientHeight;
      if (align === 'nearest') {
        if (rowTop < body.scrollTop) body.scrollTop = rowTop;
        else if (rowTop + rowHeight > body.scrollTop + view)
          body.scrollTop = rowTop + rowHeight - view;
      } else body.scrollTop = rowTop - view / 2 + rowHeight / 2;
    } else {
      const top = body.getBoundingClientRect().top + window.scrollY;
      const headerHeight = header?.offsetHeight ?? 0;
      const topBar =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--top-bar-height',
          ),
        ) || 0;
      const viewTop = window.scrollY + topBar + headerHeight;
      const at = top + rowTop;
      if (align === 'nearest') {
        if (at < viewTop)
          window.scrollTo({ top: at - topBar - headerHeight });
        else if (at + rowHeight > window.scrollY + window.innerHeight)
          window.scrollTo({ top: at + rowHeight - window.innerHeight });
      } else
        window.scrollTo({
          top: at - (window.innerHeight + topBar + headerHeight) / 2,
        });
      measureWindow();
    }
    await tick();
  }

  /** Flashes a row (after going to it) */
  export function flashRow(row: number) {
    const element = grid?.querySelector<HTMLElement>(
      `[data-grid-row="${row}"]`,
    );
    if (!element) return;
    element.animate(
      [
        { boxShadow: 'inset 0 0 0 100vmax var(--color-primary-500)' },
        { boxShadow: 'inset 0 0 0 100vmax transparent' },
      ],
      { duration: 900, easing: 'ease-out' },
    );
  }

  function toggleSort(column: GridColumn) {
    if (!sort || sort.id !== column.id)
      sort = { id: column.id, direction: 'ascending' };
    else if (sort.direction === 'ascending')
      sort = { id: column.id, direction: 'descending' };
    else sort = null;
  }

  const sticky = (left: string) =>
    `position: sticky; left: ${left}; z-index: 10; background: inherit;`;
  const dayLeft = $derived(lead ? lead.width : '0px');
  const stripe = (index: number) =>
    index % 2 ? 'bg-surface-50-950' : 'bg-surface-100-900';
</script>

{#snippet headerCell(column: GridColumn)}
  {@const sorted = sort?.id === column.id ? sort.direction : null}
  <div
    role="columnheader"
    aria-sort={sorted ?? (column.sortable ? 'none' : undefined)}
    class={[
      'flex items-center px-2 py-1 leading-tight font-bold',
      column.dimmed && 'opacity-60',
    ]}
  >
    {#if column.sortable}
      <button
        type="button"
        class="hover:preset-tonal-surface -mx-1 flex items-center gap-1 rounded px-1 py-0.5 text-left"
        title="Sort by {column.label}"
        onclick={() => toggleSort(column)}
      >
        <span>
          {column.label}
          {#if column.unit}
            <span class="text-xs font-normal">({column.unit})</span>
          {/if}
        </span>
        {#if sorted === 'ascending'}
          <ArrowUpIcon class="icon-sm shrink-0" aria-hidden="true" />
        {:else if sorted === 'descending'}
          <ArrowDownIcon class="icon-sm shrink-0" aria-hidden="true" />
        {/if}
      </button>
    {:else}
      <span>
        {column.label}
        {#if column.unit}
          <span class="text-xs font-normal">({column.unit})</span>
        {/if}
      </span>
    {/if}
  </div>
{/snippet}

<div
  bind:this={grid}
  {role}
  aria-label={label}
  aria-rowcount={rows.length + 1}
  aria-colcount={columns.length + 1 + (lead ? 1 : 0)}
  class={[
    // Its own stacking (`isolate`): the header and day column stay above its
    // rows but below what's fixed over the page (the planner's steps bar)
    'border-surface-200-800 rounded-container relative isolate flex min-h-0 flex-col border',
    // Clipped to its rounded corners (not a scroller, so the header can
    // stay at the top of the page)
    scroll === 'box' ? 'overflow-hidden' : 'overflow-clip',
    className,
  ]}
  {...gridAttributes}
>
  <!-- The header -->
  <div
    bind:this={header}
    role="rowgroup"
    class={[
      'bg-surface-100-900 border-surface-200-800 shrink-0 overflow-hidden border-b text-sm [scrollbar-gutter:stable]',
      scroll === 'window' ? 'sticky top-(--top-bar-height,0px) z-20' : '',
    ]}
  >
    <div
      role="row"
      aria-rowindex={1}
      class="bg-surface-100-900 grid w-full"
      style:min-width={minWidth}
      style:grid-template-columns={template}
    >
      {#if lead}
        <div
          role="columnheader"
          class="flex items-center justify-center py-1"
          style={sticky('0px')}
        >
          {@render lead.header()}
        </div>
      {/if}
      <div
        role="columnheader"
        aria-sort={daySortable
          ? sort?.id === 'day'
            ? sort.direction
            : 'none'
          : undefined}
        class="border-surface-200-800 flex items-center border-r px-2 py-1 font-bold"
        style={sticky(dayLeft)}
      >
        {#if daySortable}
          <button
            type="button"
            class="hover:preset-tonal-surface -mx-1 flex items-center gap-1 rounded px-1 py-0.5"
            title="Sort by {dayHeader}"
            onclick={() =>
              toggleSort({ id: 'day', label: dayHeader, sortable: true })}
          >
            {dayHeader}
            {#if sort?.id === 'day' && sort.direction === 'ascending'}
              <ArrowUpIcon class="icon-sm shrink-0" aria-hidden="true" />
            {:else if sort?.id === 'day'}
              <ArrowDownIcon class="icon-sm shrink-0" aria-hidden="true" />
            {/if}
          </button>
        {:else}
          {dayHeader}
        {/if}
      </div>
      {#each columns as column (column.id)}
        {@render headerCell(column)}
      {/each}
    </div>
  </div>

  <!-- The rows -->
  <div
    bind:this={body}
    bind:clientHeight={
      () => virtual.viewHeight,
      (height) => {
        if (scroll === 'box') virtual.viewHeight = height;
      }
    }
    onscroll={() => {
      if (header && body) header.scrollLeft = body.scrollLeft;
      if (scroll === 'box' && body) virtual.offset = body.scrollTop;
    }}
    class={[
      '[scrollbar-gutter:stable]',
      scroll === 'box' ? 'min-h-0 flex-1 overflow-auto' : 'overflow-x-auto',
    ]}
  >
    <div
      role="rowgroup"
      class="relative w-full"
      style:min-width={minWidth}
      style:height="{rows.length * rowHeight}px"
    >
      {#each virtual.visible as index (key(rows[index], index))}
        {@const row = rows[index]}
        {@const tint = rowTint?.(row, index)}
        <div
          role="row"
          aria-rowindex={index + 2}
          data-grid-row={index}
          class={['absolute right-0 left-0 grid', stripe(index)]}
          style:top="{index * rowHeight}px"
          style:height="{rowHeight}px"
          style:grid-template-columns={template}
          style:background-image={tint
            ? `linear-gradient(${tint}, ${tint})`
            : undefined}
          {...rowAttributes?.(row, index) ?? {}}
        >
          {#if lead}
            <div
              role="cell"
              class="flex items-center justify-center"
              style={sticky('0px')}
            >
              {@render lead.cell(row, index)}
            </div>
          {/if}
          <div
            role="rowheader"
            class="border-surface-200-800 flex min-w-0 items-center border-r px-2"
            style={sticky(dayLeft)}
          >
            {@render day(row, index)}
          </div>
          {#each columns as column, c (column.id)}
            {@render cell(row, column, index, c)}
          {/each}
        </div>
      {/each}
    </div>
    {#if !rows.length && empty}
      <div class="p-4 text-center text-sm">{@render empty()}</div>
    {/if}
  </div>
</div>

<SwatchDetailsPopover {details} />
