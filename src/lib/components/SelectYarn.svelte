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

<!-- Picks a yarn, or a whole brand, searching by brand or yarn name. On a
phone it opens a full-screen search, so the list has the whole screen above
the keyboard; elsewhere the list drops down from the field. -->

<script lang="ts">
  import { ensureYarnData, getBrands } from '$lib/data/yarns/colorways.svelte';
  import { defaultYarn } from '$lib/state/page-state.svelte';
  import { pluralize } from '$lib/utils/string-utils';
  import { stringToBrandAndYarnDetails } from '$lib/utils/yarn-utils';
  import {
    brandValue,
    buildYarnOptions,
    filterYarnOptions,
    highlightParts,
    optionLabel,
    searchTerms,
    yarnValue,
    type YarnOption,
  } from '$lib/utils/yarn-search';
  import { yarnBall } from '@lucide/lab';
  import {
    ArrowLeftIcon,
    CheckIcon,
    ChevronDownIcon,
    Icon,
    SearchIcon,
    XIcon,
  } from '@lucide/svelte';
  import {
    Combobox,
    Dialog,
    Portal,
    useListCollection,
    type ComboboxRootProps,
  } from '@skeletonlabs/skeleton-svelte';
  import { onMount, tick } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import HelpIcon from './buttons/HelpIcon.svelte';

  interface Props {
    selectedBrandId?: string;
    selectedYarnId?: string;
    selectedYarnWeightId?: string;
    disabled?: boolean;
    preselectDefaultYarn?: boolean;
    onselectautocomplete?: (detail: {
      selectedBrandId: string | undefined;
      selectedYarnId: string | undefined;
    }) => void;
  }

  let {
    selectedBrandId = $bindable(),
    selectedYarnId = $bindable(),
    selectedYarnWeightId = '',
    disabled = false,
    preselectDefaultYarn = true,
    onselectautocomplete = () => {},
  }: Props = $props();

  const uid = $props.id();

  // A phone, or a phone turned sideways: touch, and small
  const phone = new MediaQuery(
    '(pointer: coarse) and (max-width: 767px), (pointer: coarse) and (max-height: 500px)',
  );

  let ready = $state(false);
  let options = $derived(
    ready ? buildYarnOptions(getBrands(), selectedYarnWeightId) : [],
  );
  // Every weight, to name a picked yarn the weight filter leaves out
  let allOptions = $derived(ready ? buildYarnOptions(getBrands()) : []);

  // What's typed to search; empty shows everything
  let query = $state('');
  let terms = $derived(searchTerms(query));
  let shown = $derived(filterYarnOptions(options, query));
  let collection = $derived(
    useListCollection({
      items: shown,
      itemToValue: (option) => option.value,
      itemToString: optionLabel,
    }),
  );
  // Each brand with its yarns under it
  let groups = $derived.by(() => {
    const list: { brand: YarnOption; yarns: YarnOption[] }[] = [];
    for (const option of shown) {
      if (option.kind === 'brand') list.push({ brand: option, yarns: [] });
      else list.at(-1)?.yarns.push(option);
    }
    return list;
  });

  let selectedValue = $derived(
    selectedBrandId && selectedYarnId
      ? yarnValue(selectedBrandId, selectedYarnId)
      : selectedBrandId
        ? brandValue(selectedBrandId)
        : '',
  );
  let selectedOption = $derived(
    options.find((option) => option.value === selectedValue) ??
      allOptions.find((option) => option.value === selectedValue),
  );
  let selectedLabel = $derived(
    selectedOption ? optionLabel(selectedOption) : '',
  );

  let placeholder = $derived.by(() => {
    const yarns = options.filter((option) => option.kind === 'yarn');
    const colorways = yarns.reduce((sum, yarn) => sum + yarn.colorways, 0);
    return `${yarns.length} ${pluralize('Yarn', yarns.length)} (${colorways.toLocaleString()} colorways)`;
  });

  // The field's text: the pick, or what's being typed
  let inputValue = $state('');
  let open = $state(false);
  let highlightedValue = $state<string | null>(null);
  // The phone's full-screen search
  let searching = $state(false);

  $effect(() => {
    if (!open && !searching) inputValue = selectedLabel;
  });

  onMount(async () => {
    await ensureYarnData();
    if (!selectedBrandId && !selectedYarnId && preselectDefaultYarn) {
      const { brandId, yarnId } = stringToBrandAndYarnDetails(
        defaultYarn.value,
      );
      if (brandId) selectedBrandId = brandId;
      if (yarnId) selectedYarnId = yarnId;
    }
    ready = true;
  });

  function pick(option: YarnOption | undefined) {
    selectedBrandId = option?.brandId ?? '';
    selectedYarnId = option?.yarnId ?? '';
    query = '';
    onselectautocomplete({ selectedBrandId, selectedYarnId });
  }

  const onValueChange: ComboboxRootProps['onValueChange'] = (details) => {
    pick(details.items[0] as YarnOption | undefined);
    if (searching) endSearch();
  };

  const onInputValueChange: ComboboxRootProps['onInputValueChange'] = (
    details,
  ) => {
    inputValue = details.inputValue;
    if (details.reason === 'input-change') query = details.inputValue;
  };

  // Opening shows everything, at the yarn or brand already picked
  let listElement: HTMLElement | undefined = $state();
  async function showPicked() {
    query = '';
    highlightedValue = selectedValue || null;
    // Once it's placed, and so limited to the room there is
    await tick();
    await new Promise((done) =>
      requestAnimationFrame(() => requestAnimationFrame(done)),
    );
    const picked = listElement?.querySelector<HTMLElement>(
      '[data-state="checked"]',
    );
    if (picked) scrollListTo(picked, true);
  }

  // Scrolls just the list, never the page or dialog behind it: to the middle
  // when it opens, otherwise only as far as needed
  function scrollListTo(item: HTMLElement | null, middle: boolean) {
    if (!listElement || !item) return;
    const list = listElement.getBoundingClientRect();
    const box = item.getBoundingClientRect();
    if (middle) {
      listElement.scrollTop +=
        box.top - list.top - (list.height - box.height) / 2;
      return;
    }
    const above = box.top - list.top;
    const below = box.bottom - list.bottom;
    if (above < 0) listElement.scrollTop += above;
    else if (below > 0) listElement.scrollTop += below;
  }

  const scrollToIndexFn: ComboboxRootProps['scrollToIndexFn'] = (details) =>
    scrollListTo(details.getElement(), !!details.immediate);

  // Phone: the search fills what's visible, so above the keyboard once it's up
  let visible = $state<{ top: number; height: number } | null>(null);
  $effect(() => {
    const viewport = window.visualViewport;
    if (!searching || !viewport) return;
    const update = () =>
      (visible = { top: viewport.offsetTop, height: viewport.height });
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      visible = null;
    };
  });

  // iOS only raises the keyboard for a field focused during the tap itself,
  // and the search's field doesn't exist yet: this one takes focus during the
  // tap, keeping the keyboard up for the search's field to take over
  let keyboardKeeper: HTMLInputElement | undefined = $state();
  let searchInput: HTMLInputElement | undefined = $state();
  let fieldButton: HTMLButtonElement | undefined = $state();

  // Back on the field, as the search goes away entirely
  async function endSearch() {
    searching = false;
    await tick();
    fieldButton?.focus();
  }

  function startSearch() {
    keyboardKeeper?.focus();
    searching = true;
    showPicked();
  }

  // Skeleton styles the combobox's parts on its own; these fit them into the
  // app's input group and list look instead
  const inputReset = 'rounded-none ring-0 focus:ring-0';
  const buttonReset =
    'static h-auto w-auto translate-none transform-none rounded-none bg-transparent text-inherit';
  const listClass =
    'flex flex-col bg-surface-50 dark:bg-surface-950 overscroll-contain overflow-y-auto';
  const itemClass =
    'border-surface-100-900 flex cursor-pointer items-center justify-start gap-2 rounded-none border-b px-3 py-3 text-left text-inherit data-highlighted:bg-primary-100/50 data-highlighted:text-inherit dark:data-highlighted:bg-primary-900/50 data-[state=checked]:bg-primary-100/50 data-[state=checked]:text-inherit dark:data-[state=checked]:bg-primary-900/50';
</script>

{#snippet marked(text: string)}
  {#each highlightParts(text, terms) as part, index (index)}
    {#if part.match}
      <span class="text-primary-700-300 font-bold">{part.text}</span>
    {:else}
      {part.text}
    {/if}
  {/each}
{/snippet}

{#snippet details(option: YarnOption)}
  <span class="text-sm opacity-60"
    >({option.kind === 'brand'
      ? `${option.brandYarns} ${pluralize('yarn', option.brandYarns)}, `
      : option.weightName
        ? `${option.weightName}, `
        : ''}{option.colorways.toLocaleString()} colorways)</span
  >
{/snippet}

<!-- The list, shared by the drop-down and the phone's search -->
{#snippet list()}
  {#each groups as group (group.brand.value)}
    <li role="none">
      <ul role="group" aria-label={group.brand.brandName}>
        <Combobox.Item item={group.brand} class={itemClass}>
          {#snippet element(attributes)}
            <li {...attributes}>
              <span class="min-w-0 flex-1">
                <span class="font-bold"
                  >{@render marked(group.brand.brandName)}</span
                >
                {@render details(group.brand)}
              </span>
              <Combobox.ItemIndicator
                ><CheckIcon class="shrink-0" /></Combobox.ItemIndicator
              >
            </li>
          {/snippet}
        </Combobox.Item>
        {#each group.yarns as yarn (yarn.value)}
          <Combobox.Item item={yarn} class={[itemClass, 'pl-7']}>
            {#snippet element(attributes)}
              <li {...attributes}>
                <span class="min-w-0 flex-1">
                  {@render marked(yarn.yarnName ?? '')}
                  {@render details(yarn)}
                  {#if yarn.unavailable}
                    <span class="text-sm italic opacity-60"
                      >Link Unavailable</span
                    >
                  {/if}
                </span>
                <Combobox.ItemIndicator
                  ><CheckIcon class="shrink-0" /></Combobox.ItemIndicator
                >
              </li>
            {/snippet}
          </Combobox.Item>
        {/each}
      </ul>
    </li>
  {:else}
    <li class="text-surface-700-300 px-3 py-3 text-left">No matching yarn</li>
  {/each}
{/snippet}

<div class="label flex w-full flex-col justify-start md:col-span-2">
  {#if phone.current}
    <span class="label-text" id="{uid}-label">Yarn Name</span>
    <div class="input-group w-full grid-cols-[auto_1fr_auto]">
      <span class="ig-cell"><Icon iconNode={yarnBall} /></span>
      <button
        bind:this={fieldButton}
        type="button"
        class="ig-input flex min-w-0 items-center gap-2 text-left"
        aria-haspopup="dialog"
        aria-labelledby="{uid}-label {uid}-value"
        disabled={disabled || !ready}
        onclick={startSearch}
      >
        <span
          id="{uid}-value"
          class={['min-w-0 flex-1 truncate', !selectedLabel && 'opacity-60']}
          >{selectedLabel || placeholder}</span
        >
        <ChevronDownIcon class="shrink-0" aria-hidden="true" />
      </button>
      {#if selectedValue}
        <button
          type="button"
          aria-label="Clear"
          class="ig-btn hover:preset-tonal-surface"
          {disabled}
          onclick={() => pick(undefined)}
        >
          <XIcon />
        </button>
      {/if}
    </div>
    <input
      bind:this={keyboardKeeper}
      class="sr-only"
      aria-hidden="true"
      tabindex="-1"
    />

    <!-- Made only while open, as a dialog it's in hides from screen readers
    what's outside it when it opens, and this goes outside it -->
    {#if searching}
      <Dialog
        open
        onOpenChange={(details) => {
          if (!details.open) endSearch();
        }}
        initialFocusEl={() => searchInput ?? null}
        restoreFocus={false}
      >
        <Portal>
          <!-- Over everything, including a popover it's opened from -->
          <Dialog.Positioner
            class="fixed inset-x-0 top-0 z-10000 flex h-dvh"
            style={visible
              ? `top: ${visible.top}px; height: ${visible.height}px`
              : undefined}
          >
            <Dialog.Content
              class="bg-surface-50 dark:bg-surface-950 flex h-full w-full flex-col"
            >
              <Combobox
                class="flex min-h-0 flex-1 flex-col gap-0"
                {collection}
                value={selectedValue ? [selectedValue] : []}
                {onValueChange}
                inputValue={query}
                onInputValueChange={(details) => (query = details.inputValue)}
                open={true}
                onOpenChange={(details) => {
                  // Escape goes back
                  if (!details.open && details.reason === 'escape-key')
                    endSearch();
                }}
                {highlightedValue}
                onHighlightChange={(details) =>
                  (highlightedValue = details.highlightedValue)}
                disableLayer
                {scrollToIndexFn}
                inputBehavior="none"
                selectionBehavior="preserve"
              >
                <div
                  class="flex items-center gap-2 px-2 pt-[max(--spacing(2),env(safe-area-inset-top))] pb-2"
                >
                  <button
                    type="button"
                    class="btn-icon hover:preset-tonal-surface"
                    aria-label="Back"
                    onclick={endSearch}
                  >
                    <ArrowLeftIcon />
                  </button>
                  <Dialog.Title class="text-lg font-bold"
                    >Choose Yarn</Dialog.Title
                  >
                </div>
                <Combobox.Control
                  class="input-group mx-2 mb-2 grid-cols-[auto_1fr_auto]"
                >
                  <span class="ig-cell"><SearchIcon /></span>
                  <Combobox.Input
                    class={['ig-input', inputReset]}
                    placeholder="Search {placeholder}"
                    enterkeyhint="search"
                  >
                    {#snippet element(attributes)}
                      <input {...attributes} bind:this={searchInput} />
                    {/snippet}
                  </Combobox.Input>
                  {#if query}
                    <button
                      type="button"
                      aria-label="Clear Search"
                      class="ig-btn hover:preset-tonal-surface"
                      onclick={() => {
                        query = '';
                        searchInput?.focus();
                      }}
                    >
                      <XIcon />
                    </button>
                  {/if}
                </Combobox.Control>
                <Combobox.Content
                  class={[
                    listClass,
                    // Edge to edge, as a phone's own search list
                    'border-surface-200-800 min-h-0 flex-1 gap-0 rounded-none border-0 border-t p-0 pb-[env(safe-area-inset-bottom)]',
                  ]}
                >
                  {#snippet element(attributes)}
                    <ul {...attributes} bind:this={listElement}>
                      {@render list()}
                    </ul>
                  {/snippet}
                </Combobox.Content>
              </Combobox>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog>
    {/if}
  {:else}
    <Combobox
      class="flex flex-col gap-1"
      {collection}
      value={selectedValue ? [selectedValue] : []}
      {onValueChange}
      {inputValue}
      {onInputValueChange}
      {open}
      onOpenChange={(details) => {
        open = details.open;
        // Typing opens it too, to show what matches
        if (open && details.reason !== 'input-change') showPicked();
        else if (!open) query = '';
      }}
      {highlightedValue}
      onHighlightChange={(details) =>
        (highlightedValue = details.highlightedValue)}
      disabled={disabled || !ready}
      openOnClick
      {scrollToIndexFn}
      inputBehavior="none"
      selectionBehavior="replace"
      positioning={{
        placement: 'bottom-start',
        flip: true,
        fitViewport: true,
        gutter: 4,
      }}
    >
      <Combobox.Label class="label-text">Yarn Name</Combobox.Label>
      <Combobox.Control
        class="input-group w-full grid-cols-[auto_1fr_auto_auto]"
      >
        <span class="ig-cell"><Icon iconNode={yarnBall} /></span>
        <Combobox.Input
          class={['ig-input truncate', inputReset]}
          {placeholder}
          onfocus={(event) => event.currentTarget.select()}
        />
        <Combobox.Trigger
          class={['ig-btn hover:preset-tonal-surface', buttonReset]}
          aria-label="Show All Yarns"
        >
          <ChevronDownIcon />
        </Combobox.Trigger>
        {#if selectedValue || inputValue}
          <!-- In the tab order, as it was; Skeleton leaves it out -->
          <Combobox.ClearTrigger
            class={['ig-btn hover:preset-tonal-surface', buttonReset]}
            aria-label="Clear"
            tabindex={0}
          >
            <XIcon />
          </Combobox.ClearTrigger>
        {/if}
      </Combobox.Control>
      <!-- Made only while open: a dialog hides from screen readers what's
      outside it when it opens, and this goes outside it, at the page's end -->
      {#if open}
        <Portal>
          <Combobox.Positioner>
            <Combobox.Content
              class={[
                listClass,
                'border-primary-500 rounded-container z-9999 max-h-[min(30rem,var(--available-height))] w-(--reference-width) max-w-[calc(100vw-2rem)] min-w-72 gap-0 border p-0 shadow-lg',
              ]}
            >
              {#snippet element(attributes)}
                <ul {...attributes} bind:this={listElement}>
                  {@render list()}
                </ul>
              {/snippet}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      {/if}
    </Combobox>
  {/if}

  {#if selectedOption?.unavailable}
    <div class="w-fit">
      <HelpIcon href="/documentation#link-unavailable">
        {#snippet text()}
          <span class="font-normal">Link Unavailable</span>
        {/snippet}
      </HelpIcon>
    </div>
  {/if}
</div>
