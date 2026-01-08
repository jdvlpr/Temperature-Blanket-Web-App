<script module lang="ts">
  import { persistedState } from '$lib/storage/preferences.svelte';

  const options = persistedState('[/.dev-tools]options', {
    content: '',
    columnWidth: 200,
    querySelector: '',
    useElementAttribute: false,
    querySelectorAttribute: '',
    excludeBefore: false,
    excludeBeforeString: '',
    excludeAfter: false,
    excludeAfterString: '',
    removeNumbers: true,
    mergeWithExistingColors: false,
    selectedYarn: {
      brandId: '',
      yarnId: '',
    },
    names: [],
  });
</script>

<script lang="ts">
  import { browser, dev } from '$app/environment';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import { brands } from '$lib/data/yarns/brands';
  import { toast } from '$lib/state';
  import type { Color } from '$lib/types';
  import { getTextColor } from '$lib/utils';
  import chroma from 'chroma-js';

  let showClearButton = $state(false);

  let existingColorways: Color[] = $derived.by(() => {
    if (
      !browser ||
      !options.value.selectedYarn?.brandId ||
      !options.value.selectedYarn?.yarnId
    )
      return [];
    // Fetch existing colorways based on selected brand and yarn
    return (
      brands
        .find((b) => b.id === options.value.selectedYarn.brandId)
        ?.yarns.find((y) => y.id === options.value.selectedYarn.yarnId)
        ?.colorways.flatMap((colorway) => colorway.colors) || []
    );
  });

  let onlyNewColors = $derived(
    options.value.names
      .map((n) => {
        return {
          hex: chroma.valid(n.hex) ? chroma(n.hex).hex().toLowerCase() : '',
          name: n.name,
        };
      })
      .filter((n) => {
        return !existingColorways
          .map((ec) => ec.name.toLowerCase())
          .includes(n.name.toLowerCase());
      }),
  );

  function createHTMLObject(content: string) {
    if (!browser) return;
    const html = document.createElement('div');
    html.innerHTML = content;
    return html;
  }

  async function getNames() {
    options.value.names = [];
    let i = 1;
    for (const element of [
      ...htmlObject.querySelectorAll(options.value.querySelector),
    ]) {
      let name = options.value.useElementAttribute
        ? element.getAttribute(options.value.querySelectorAttribute)
        : element.innerText;
      if (options.value.excludeBefore)
        name = name.substring(
          name.indexOf(options.value.excludeBeforeString) +
            options.value.excludeBeforeString?.length,
        );
      if (options.value.excludeAfter)
        name = name.substring(
          0,
          name.indexOf(options.value.excludeAfterString),
        );
      name = name.toLowerCase(); // lowercase everything
      name = name.replaceAll('\n', ' '); // remove new lines
      name = name.replaceAll('  ', ''); // remove multiple spaces
      if (options.value.removeNumbers) name = name.replace(/[0-9]/g, '');
      name = name.trim(); // trim whitespace
      name = name.split(' '); // split words
      for (let i = 0; i < name?.length; i++) {
        if (name[i]?.length !== 0) {
          name[i] = name[i][0].toUpperCase() + name[i].substr(1); // capitalize first letter of each word
        }
      }
      name = name.join(' '); // join words into one string

      let colorHex = '';

      options.value.names.push({ name, hex: colorHex });
      i = Number(i);
      i++;
    }
  }

  let htmlObject = $derived(createHTMLObject(options.value.content));
</script>

<svelte:head>
  <title>Extract Yarn Colorways</title>
  <meta name="description" content="Extract Yarn Colorways" />
  <meta property="og:title" content="Extract Yarn Colorways" />
  <meta property="og:description" content="Extract Yarn Colorways" />
</svelte:head>

<AppShell pageName="Extract Yarn Colorways">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main class="mb-[100vh] max-w-screen-xl px-2 text-left lg:px-0">
      {#if dev}
        <h2 class="h2 text-gradient my-2">Input</h2>

        <div class="flex flex-col gap-4 px-2">
          <label class="text-sm"
            >Paste HTML Here
            <textarea
              class="textarea w-full grow border-none shadow-inner"
              bind:value={options.value.content}
              rows="5"
            ></textarea>
          </label>

          <div class="flex max-w-md flex-col gap-4">
            <div class="flex flex-col items-start text-left">
              <label class="w-full text-sm">
                Element Query Selector
                <input
                  type="text"
                  placeholder="e.g., a, .description"
                  class="input w-full"
                  bind:value={options.value.querySelector}
                />
              </label>
            </div>

            <div>
              <ToggleSwitch
                bind:checked={options.value.removeNumbers}
                label="Remove Numbers"
              />
            </div>

            <div class="flex flex-col gap-2">
              <ToggleSwitch
                bind:checked={options.value.useElementAttribute}
                label="Use Element Attribute"
              />

              {#if options.value.useElementAttribute}
                <div class="flex flex-col items-start text-left">
                  <label class="w-full text-sm">
                    Element Attribute
                    <input
                      type="text"
                      placeholder="e.g., title, data-name"
                      class="input w-full"
                      bind:value={options.value.querySelectorAttribute}
                    />
                  </label>
                </div>
              {/if}
            </div>

            <div class="flex flex-col gap-2">
              <ToggleSwitch
                bind:checked={options.value.excludeBefore}
                label="Exclude Before"
              />
              {#if options.value.excludeBefore}
                <div class="flex flex-col items-start text-left">
                  <label class="w-full text-sm">
                    Exclude Before
                    <input
                      type="text"
                      class="input w-full"
                      bind:value={options.value.excludeBeforeString}
                    />
                  </label>
                </div>
              {/if}
            </div>

            <div class="flex flex-col gap-2">
              <ToggleSwitch
                bind:checked={options.value.excludeAfter}
                label="Exclude After"
              />
              {#if options.value.excludeAfter}
                <div class="flex flex-col items-start text-left">
                  <label class="w-full text-sm">
                    Exclude After
                    <input
                      type="text"
                      class="input w-full"
                      bind:value={options.value.excludeAfterString}
                    />
                  </label>
                </div>
              {/if}
            </div>

            <div class="flex flex-col gap-2">
              <ToggleSwitch
                bind:checked={options.value.mergeWithExistingColors}
                label="Merge With Existing Yarn Colorways"
              />
              {#if options.value.mergeWithExistingColors}
                <div class="mt-2 flex flex-col items-start text-left">
                  <SelectYarn
                    preselectDefaultYarn={false}
                    bind:selectedBrandId={options.value.selectedYarn.brandId}
                    bind:selectedYarnId={options.value.selectedYarn.yarnId}
                  />
                </div>
              {/if}
            </div>
          </div>

          <h2 class="h2 text-gradient my-2">Output</h2>

          <div class="">
            <button
              class="btn preset-filled-primary-500"
              onclick={async () => await getNames()}
              disabled={options.value.querySelector === '' ||
                options.value.content === ''}>Get Colorway Names</button
            >
            <Expand bind:isExpanded={showClearButton} label="Clear Button" />
            {#if showClearButton}
              <button
                class="btn preset-filled-primary-500"
                onclick={() => (options.value.names = [])}>Clear</button
              >
            {/if}
          </div>

          <div class="flex flex-col">
            <label class="label" for="numberOfColumns">Column Width (px)</label>
            <input
              type="number"
              class="select w-fit"
              id="numberOfColumns"
              bind:value={options.value.columnWidth}
            />
          </div>

          {#if options.value.names?.length}
            <p>{options.value.names.length} Colorways</p>
            <div class="flex flex-wrap justify-start">
              {#each options.value.names as { name, hex }, index}
                <div
                  class="flex flex-col gap-1 p-2"
                  style="background:{hex};color:{getTextColor(
                    hex,
                  )};width:{options.value.columnWidth}px"
                >
                  <p class="text-sm">{index + 1}</p>
                  <div
                    contenteditable="true"
                    bind:innerHTML={options.value.names[index].name}
                    class=""
                  >
                    {name}
                  </div>
                  <div
                    contenteditable="true"
                    bind:innerHTML={options.value.names[index].hex}
                    class="border bg-white text-black"
                  >
                    {hex}
                  </div>
                </div>
              {/each}
            </div>
            <div class="flex flex-wrap gap-4">
              <button
                class="btn preset-filled-primary-500"
                onclick={() => {
                  let colors = options.value.names.map((n) => {
                    return {
                      hex: chroma.valid(n.hex)
                        ? chroma(n.hex).hex().toLowerCase()
                        : '',
                      name: n.name,
                    };
                  });
                  window.navigator.clipboard.writeText(JSON.stringify(colors));
                  toast.trigger({
                    message: `Copied (${colors.length})`,
                    category: 'success',
                  });
                  console.log(colors);
                }}
              >
                Copy to Clipboard As Array
              </button>

              {#if options.value.mergeWithExistingColors && existingColorways.length}
                <button
                  class="btn preset-filled-primary-500"
                  onclick={() => {
                    window.navigator.clipboard.writeText(
                      JSON.stringify(onlyNewColors),
                    );
                    toast.trigger({
                      message: `Copied Only New Colorways (${onlyNewColors.length})`,
                      category: 'success',
                    });
                    console.log(onlyNewColors);
                  }}
                >
                  Copy Only New Colorways ({onlyNewColors.length}) to Clipboard
                  As Array
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {:else}
        <div class="mb-4">
          <p class="">This page is not available to you.</p>
        </div>
      {/if}
    </main>
  {/snippet}
  {#snippet footer()}
    <Footer />
  {/snippet}
</AppShell>
