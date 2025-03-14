<script lang="ts">
  import { browser, dev } from '$app/environment';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import { getTextColor } from '$lib/utils';
  import chroma from 'chroma-js';
  import { onMount } from 'svelte';

  let content: string = '';
  let showClearButton = false;

  let columnWidth = 200;

  $: querySelector = '';
  $: useElementAttribute = false;
  $: querySelectorAttribute = '';
  $: excludeBefore = false;
  $: excludeBeforeString = '';
  $: excludeAfter = false;
  $: excludeAfterString = '';
  $: removeNumbers = true;

  let mounted = false;

  onMount(() => {
    if (localStorage.getItem('[/.dev-tools]querySelector') !== 'null')
      querySelector = localStorage.getItem('[/.dev-tools]querySelector');
    if (localStorage.getItem('[/.dev-tools]useElementAttribute') !== 'null')
      useElementAttribute = localStorage.getItem(
        '[/.dev-tools]useElementAttribute',
      );
    if (localStorage.getItem('[/.dev-tools]content') !== 'null')
      content = JSON.parse(localStorage.getItem('[/.dev-tools]content'));
    if (
      localStorage.getItem('[/.dev-tools]names') !== 'null' &&
      localStorage.getItem('[/.dev-tools]names') !== '[]'
    )
      names = JSON.parse(localStorage.getItem('[/.dev-tools]names'));

    mounted = true;
  });

  $: names = [];

  $: data = { querySelector, content, names };
  $: data, setLocalStorage();

  $: htmlObject = createHTMLObject(content);

  function setLocalStorage() {
    if (!browser || !mounted) return;
    localStorage.setItem('[/.dev-tools]querySelector', querySelector);
    localStorage.setItem(
      '[/.dev-tools]useElementAttribute',
      useElementAttribute,
    );
    localStorage.setItem('[/.dev-tools]content', JSON.stringify(content));
    if (names)
      localStorage.setItem('[/.dev-tools]names', JSON.stringify(names));
  }

  function createHTMLObject(content: string) {
    if (!browser) return;
    const html = document.createElement('div');
    html.innerHTML = content;
    return html;
  }

  async function getNames() {
    // const fac = new FastAverageColor();
    names = [];
    let i = 1;
    for (const element of [...htmlObject.querySelectorAll(querySelector)]) {
      let name = useElementAttribute
        ? element.getAttribute(querySelectorAttribute)
        : element.innerText;
      if (excludeBefore)
        name = name.substring(
          name.indexOf(excludeBeforeString) + excludeBeforeString?.length,
        );
      if (excludeAfter)
        name = name.substring(0, name.indexOf(excludeAfterString));
      name = name.toLowerCase(); // lowercase everything
      name = name.replaceAll('\n', ' '); // remove new lines
      name = name.replaceAll('  ', ''); // remove multiple spaces
      if (removeNumbers) name = name.replace(/[0-9]/g, '');
      name = name.trim(); // trim whitespace
      name = name.split(' '); // split words
      for (let i = 0; i < name?.length; i++) {
        if (name[i]?.length !== 0) {
          name[i] = name[i][0].toUpperCase() + name[i].substr(1); // capitalize first letter of each word
        }
      }
      name = name.join(' '); // join words into one string

      let colorHex = '';
      // colorHex = chroma(color.hex).hex();
      // await fac
      //     .getColorAsync(encodeURIComponent(`/images/Layer ${i}.png`))
      //     .then((color) => {
      //     })
      //     .catch((e) => {
      //         // console.log(e);
      //     });
      names.push({ name, hex: colorHex });
      i = Number(i);
      i++;
    }
    names = names;
  }
</script>

<svelte:head>
  <title>Extract Yarn Colorways</title>
  <meta name="description" content="Extract Yarn Colorways" />
  <!-- <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no" /> -->
  <meta property="og:title" content="Extract Yarn Colorways" />
  <meta property="og:description" content="Extract Yarn Colorways" />
  <!-- <meta property="og:url" content="https://temperature-blanket.com" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://temperature-blanket.com/images/temperature-blanket-og-image-1.748.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" /> -->
</svelte:head>

<AppShell pageName="Extract Yarn Colorways">
  <svelte:fragment slot="stickyHeader">
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  </svelte:fragment>
  <main slot="main" class="max-w-screen-xl px-2 lg:px-0 text-left">
    {#if dev}
      <h2 class="text-3xl my-2 font-cursive">Input</h2>

      <div class="px-2 flex flex-col gap-4">
        <label class="text-sm"
          >Paste HTML Here
          <textarea
            class="w-full grow textarea shadow-inner border-none"
            bind:value={content}
            rows="5"
          />
        </label>

        <div class="tex-left flex flex-col items-start">
          <label class="text-sm pl-[12px]">
            Element Query Selector
            <input
              type="text"
              placeholder="e.g., a, .description"
              class="w-full grow bg-surface-50 placeholder-surface-400 dark:placeholder-surface-500 rounded-full cursor-text text-surface-800 dark:text-surface-50 shadow-inner dark:bg-surface-800 border-none"
              bind:value={querySelector}
            />
          </label>
        </div>

        <div>
          <ToggleSwitch bind:checked={removeNumbers} label="Remove Numbers" />
        </div>

        <div>
          <ToggleSwitch
            bind:checked={useElementAttribute}
            label="Use Element Attribute"
          />

          {#if useElementAttribute}
            <div class="tex-left flex flex-col items-start">
              <label class="text-sm pl-[12px]">
                Element Attribute
                <input
                  type="text"
                  placeholder="e.g., title, data-name"
                  class="w-full grow bg-surface-50 placeholder-surface-400 dark:placeholder-surface-500 rounded-full cursor-text text-surface-800 dark:text-surface-50 shadow-inner dark:bg-surface-800 border-none"
                  bind:value={querySelectorAttribute}
                />
              </label>
            </div>
          {/if}
        </div>

        <div>
          <ToggleSwitch bind:checked={excludeBefore} label="Exclude Before" />
          {#if excludeBefore}
            <div class="tex-left flex flex-col items-start">
              <label class="text-sm pl-[12px]">
                Exclude Before
                <input
                  type="text"
                  class="w-full grow bg-surface-50 placeholder-surface-800 dark:placeholder-white rounded-full cursor-text text-surface-800 dark:text-surface-50 shadow-inner dark:bg-surface-800 border-none"
                  bind:value={excludeBeforeString}
                />
              </label>
            </div>
          {/if}
        </div>

        <div>
          <ToggleSwitch bind:checked={excludeAfter} label="Exclude After" />
          {#if excludeAfter}
            <div class="tex-left flex flex-col items-start">
              <label class="text-sm pl-[12px]">
                Exclude After
                <input
                  type="text"
                  class="w-full grow bg-surface-50 placeholder-surface-800 dark:placeholder-white rounded-full cursor-text text-surface-800 dark:text-surface-50 shadow-inner dark:bg-surface-800 border-none"
                  bind:value={excludeAfterString}
                />
              </label>
            </div>
          {/if}
        </div>

        <h2 class="text-3xl my-2 font-cursive">Output</h2>

        <div class="">
          <button
            class="btn variant-filled-primary"
            on:click={async () => await getNames()}
            disabled={querySelector === '' || content === ''}
            >Get Colorway Names</button
          >
          <Expand
            bind:isExpanded={showClearButton}
            less="Hide Clear Button"
            more="Show Clear Button"
          />
          {#if showClearButton}
            <button
              class="btn variant-filled-primary"
              on:click={() => (names = [])}>Clear</button
            >
          {/if}
        </div>

        <div class="flex flex-col">
          <label class="label" for="numberOfColumns">Column Width (px)</label>
          <input
            type="number"
            class="select w-fit"
            id="numberOfColumns"
            bind:value={columnWidth}
          />
        </div>

        {#if names?.length}
          <p>{names.length} Colorways</p>
          <div class="flex justify-start flex-wrap">
            {#each names as { name, hex }, index}
              <div
                class="p-2 flex flex-col gap-1"
                style="background:{hex};color:{getTextColor(
                  hex,
                )};width:{columnWidth}px"
              >
                <p class="text-sm">{index + 1}</p>
                <div contenteditable="true" bind:innerHTML={name} class="">
                  {name}
                </div>
                <div
                  contenteditable="true"
                  bind:innerHTML={hex}
                  class="border bg-white text-black"
                >
                  {hex}
                </div>
              </div>
            {/each}
          </div>
          <div>
            <button
              class="btn variant-filled-primary"
              on:click={() => {
                let namesToCopy = names.map((n) => {
                  return {
                    hex: chroma.valid(n.hex)
                      ? chroma(n.hex).hex().toLowerCase()
                      : '',
                    name: n.name,
                  };
                });
                window.navigator.clipboard.writeText(
                  JSON.stringify(namesToCopy),
                );
                console.log(namesToCopy);
              }}
            >
              Copy to Clipboard As Array
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <div class="mb-4">
        <p class="font-ornament text-8xl my-12">d</p>
        <p class="">This page is not available to you.</p>
      </div>
    {/if}
  </main>
  <Footer slot="footer" />
</AppShell>
