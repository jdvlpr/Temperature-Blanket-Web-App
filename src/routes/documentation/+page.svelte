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

<script>
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import {
    MAXIMUM_DAYS_PER_LOCATION,
    MAXIMUM_LOCATIONS,
    OPEN_METEO_MODELS,
  } from '$lib/constants';
  import {
    CircleCheckIcon,
    CircleMinusIcon,
    ClockIcon,
    Grid3X3Icon,
    InfoIcon,
    ShoppingCartIcon,
  } from '@lucide/svelte';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';

  let openTableOfContents = $state(false);

  // The following animations are optional.
  // These may also be included inline.
  const animBackdrop =
    'transition transition-discrete opacity-0 starting:data-[state=open]:opacity-0 data-[state=open]:opacity-100';
  const animModal =
    'transition transition-discrete opacity-0 translate-x-full starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-x-full data-[state=open]:opacity-100 data-[state=open]:translate-x-0';
</script>

<svelte:document
  onclick={(event) => {
    if (event.target.classList.contains('toc-anchor')) {
      openTableOfContents = false;
    }
  }}
/>

<svelte:head>
  <title>Documentation for temperature-blanket.com</title>
  <meta
    name="description"
    content="Instructions and tips for using the Project Planner at temperature-blanket.com."
  />

  <meta
    property="og:title"
    content="Instructions and tips for using the Project Planner at temperature-blanket.com."
  />
  <meta
    property="og:description"
    content="Instructions and tips for using the Project Planner at temperature-blanket.com."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/documentation" />
  <meta property="og:type" content="website" />
</svelte:head>

{#snippet tableOfContents()}
  <nav data-testid="toc" class="toc space-y-4 px-2">
    <div class="font-bold">Table of Contents</div>
    <ul class="toc-list space-y-2">
      <li class="toc-list-item ml-4 block">
        <a href="#introduction" class="toc-anchor opacity-60 hover:opacity-100"
          >Introduction</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#about-the-project-planner"
          class="toc-anchor opacity-60 hover:opacity-100"
          >About the Project Planner</a
        >
      </li>
      <li class="toc-list-item block">
        <a href="#basics" class="toc-anchor opacity-60 hover:opacity-100"
          >Basics</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#save-project" class="toc-anchor opacity-60 hover:opacity-100"
          >Save Project</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#open-project" class="toc-anchor opacity-60 hover:opacity-100"
          >Open Project</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#change-units" class="toc-anchor opacity-60 hover:opacity-100"
          >Change Units</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#change-theme" class="toc-anchor opacity-60 hover:opacity-100"
          >Change Theme</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#navigation" class="toc-anchor opacity-60 hover:opacity-100"
          >Navigation</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#undoredo" class="toc-anchor opacity-60 hover:opacity-100"
          >Undo/Redo</a
        >
      </li>
      <li class="toc-list-item block">
        <a href="#location" class="toc-anchor opacity-60 hover:opacity-100"
          >Location</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#choose-a-location"
          class="toc-anchor opacity-60 hover:opacity-100">Choose a Location</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#select-dates" class="toc-anchor opacity-60 hover:opacity-100"
          >Select Dates</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#multiple-locations"
          class="toc-anchor opacity-60 hover:opacity-100">Multiple Locations</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#location-errors"
          class="toc-anchor opacity-60 hover:opacity-100">Location Errors</a
        >
      </li>
      <li class="toc-list-item block">
        <a href="#weather" class="toc-anchor opacity-60 hover:opacity-100"
          >Weather</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#weather-sources"
          class="toc-anchor opacity-60 hover:opacity-100">Weather Sources</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#get-weather-data"
          class="toc-anchor opacity-60 hover:opacity-100">Get Weather Data</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#grouping-weather-data"
          class="toc-anchor opacity-60 hover:opacity-100"
          >Grouping Weather Data</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#view-weather-data"
          class="toc-anchor opacity-60 hover:opacity-100">View Weather Data</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#edit-weather-data"
          class="toc-anchor opacity-60 hover:opacity-100">Edit Weather Data</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#import-weather-data"
          class="toc-anchor opacity-60 hover:opacity-100">Import Weather Data</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#weather-errors"
          class="toc-anchor opacity-60 hover:opacity-100">Weather Errors</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#mixed-snow-parameters"
          class="toc-anchor opacity-60 hover:opacity-100"
          >Mixed Snow Parameters</a
        >
      </li>
      <li class="toc-list-item block">
        <a href="#gauges" class="toc-anchor opacity-60 hover:opacity-100"
          >Gauges</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#add-a-gauge" class="toc-anchor opacity-60 hover:opacity-100"
          >Add a Gauge</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#gauge-direction"
          class="toc-anchor opacity-60 hover:opacity-100">Gauge Direction</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#range-calculation-methods"
          class="toc-anchor opacity-60 hover:opacity-100"
          >Range Calculation Methods</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#increment-modes"
          class="toc-anchor opacity-60 hover:opacity-100">Increment Modes</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#adjust-ranges" class="toc-anchor opacity-60 hover:opacity-100"
          >Adjust Ranges</a
        >
      </li>
      <li class="toc-list-item block">
        <a href="#colors" class="toc-anchor opacity-60 hover:opacity-100"
          >Color Tools</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#preset-colors" class="toc-anchor opacity-60 hover:opacity-100"
          >Preset Colors</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#image-palette" class="toc-anchor opacity-60 hover:opacity-100"
          >Image Palette</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#importexport" class="toc-anchor opacity-60 hover:opacity-100"
          >Import/Export</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a href="#sort-colors" class="toc-anchor opacity-60 hover:opacity-100"
          >Sort Colors</a
        >
      </li>
      <li class="toc-list-item block">
        <a href="#yarn" class="toc-anchor opacity-60 hover:opacity-100">Yarn</a>
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#getting-yarn-colorway-data"
          class="toc-anchor opacity-60 hover:opacity-100"
          >Getting Yarn Colorway Data</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#choose-yarn-colorways"
          class="toc-anchor opacity-60 hover:opacity-100"
          >Choose Yarn Colorways</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#link-unavailable"
          class="toc-anchor opacity-60 hover:opacity-100">Link Unavailable</a
        >
      </li>
      <li class="toc-list-item block">
        <a href="#preview" class="toc-anchor opacity-60 hover:opacity-100"
          >Preview</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#create-a-preview"
          class="toc-anchor opacity-60 hover:opacity-100">Create a Preview</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#assigning-seasons"
          class="toc-anchor flex items-center gap-2 opacity-60 hover:opacity-100"
          >Assigning Seasons <span class="badge bg-tertiary-100-900">Beta</span
          ></a
        >
      </li>
      <li class="toc-list-item block">
        <a href="#gallery" class="toc-anchor opacity-60 hover:opacity-100"
          >Gallery</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#share-to-gallery"
          class="toc-anchor opacity-60 hover:opacity-100">Share to Gallery</a
        >
      </li>
      <li class="toc-list-item block">
        <a href="#download" class="toc-anchor opacity-60 hover:opacity-100"
          >Download</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#download-gauges-and-weather-data-pdf"
          class="toc-anchor opacity-60 hover:opacity-100"
          >Download Gauges and Weather Data (PDF)</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#download-weather-data-csv"
          class="toc-anchor opacity-60 hover:opacity-100"
          >Download Weather Data (CSV)</a
        >
      </li>
      <li class="toc-list-item ml-4 block">
        <a
          href="#download-preview-image-png"
          class="toc-anchor opacity-60 hover:opacity-100"
          >Download Preview Image (PNG)</a
        >
      </li>
    </ul>
  </nav>
{/snippet}

<AppShell pageName="Documentation">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex">
      <AppLogo />
    </div>
    <div class="sm:hidden">
      <Dialog
        open={openTableOfContents}
        onOpenChange={(e) => {
          openTableOfContents = e.open;
        }}
      >
        <Dialog.Trigger
          class="btn hover:preset-tonal my-2"
          aria-label="Content Menu"
        >
          <div class="flex flex-wrap items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M3 9h14V7H3zm0 4h14v-2H3zm0 4h14v-2H3zm16 0h2v-2h-2zm0-10v2h2V7zm0 6h2v-2h-2z"
              /></svg
            >

            <span class="">Content</span>
          </div>
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop
            class="bg-surface-50-950/50 fixed inset-0 z-50 {animBackdrop}"
          />
          <Dialog.Positioner class="fixed inset-0 z-50 flex justify-end">
            <Dialog.Content
              class="bg-surface-50 dark:bg-surface-950 h-screen w-fit space-y-4 overflow-auto p-4 shadow-xl {animModal}"
            >
              <div class="mb-20">
                {@render tableOfContents()}
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog>
    </div>
  {/snippet}
  {#snippet main()}
    <main class="m-auto mb-4 max-w-(--breakpoint-xl) px-2 pt-2 lg:px-0">
      <div class="flex gap-4 pb-4 text-left">
        <div class="flex w-full flex-col gap-8">
          <div class="flex flex-col gap-4">
            <h2
              class="h2 text-gradient hidden scroll-mt-[58px] lg:inline-block"
              data-toc-ignore
            >
              Documentation
            </h2>
            <section
              id="introduction"
              class="card bg-surface-100 dark:bg-surface-900 mt-2 flex scroll-mt-[58px] flex-col gap-2 p-4 lg:mt-0"
            >
              <h3 class="text-xl font-bold">Introduction</h3>
              <p>
                This documentation is meant to help you use the <a
                  href="/"
                  class="link">Project Planner</a
                >.
              </p>
            </section>
          </div>
          <section
            id="about-the-project-planner"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">About the Project Planner</h3>
            <p>
              The Project Planner at <a
                class="link"
                rel="noreferrer noopener"
                href="/"
                target="_blank">temperature-blanket.com</a
              >
              is a tool for planning a crocheted or knitted project which incorporates
              weather data into its design. If you don’t know what a temperature blanket
              is, you can learn more here:
              <a class="link" href="/blog/what-is-a-temperature-blanket/"
                >What is a Temperature Blanket?</a
              >
            </p>
            <div class="flex flex-wrap gap-4">
              <div class="card flex flex-col gap-2 p-4">
                <p class="font-bold">Use the Project Planner</p>
                <p>
                  <CircleCheckIcon
                    class="inline"
                    style="color:var(--color-success-500)"
                  />
                  Before you start working on your project, to help choose your yarn
                  colors, plan your ranges, and preview your design
                </p>
                <p>
                  <CircleCheckIcon
                    class="inline"
                    style="color:var(--color-success-500)"
                  />
                  As you pick dates for your project, to view aggregated historical
                  weather data or to get an idea what this year’s temperature ranges
                  might be based on past temperatures
                </p>
                <p>
                  <CircleCheckIcon
                    class="inline"
                    style="color:var(--color-success-500)"
                  />
                  Before you buy your yarn, to estimate how many skeins of each colorway
                  you might need
                </p>
                <p>
                  <CircleCheckIcon
                    class="inline"
                    style="color:var(--color-success-500)"
                  />
                  While you’re working on your project, to get historical weather
                  data and get yarn color details
                </p>
              </div>
              <div class="card flex flex-col gap-2 p-4">
                <p class="font-bold">Don’t use the Project Planner</p>
                <p>
                  <CircleMinusIcon
                    class="inline"
                    style="color:var(--color-error-500)"
                  /> If your project contains dates beyond the current date
                </p>
                <p>
                  <CircleMinusIcon
                    class="inline"
                    style="color:var(--color-error-500)"
                  /> To view future weather forecasts. (For that use the
                  <a href="/weather" class="link">Weather Forecast</a> tool.)
                </p>
              </div>
            </div>
            <p>
              If you are only looking to search for or match yarn colorways, use
              the stand-alone tool at <a
                class="link"
                href="/yarn-colorway-finder"
                rel="noreferrer noopener"
                >temperature-blanket.com/yarn-colorway-finder</a
              >.
            </p>
          </section>

          <h2 class="text-2xl font-bold" id="basics">Basics</h2>

          <section
            id="save-project"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Save Project</h3>
            <p>
              When you save a project, a shareable URL is created, and the
              project is saved in your browser's local storage. This web app
              does not store your project in a backend database. This means:
            </p>
            <ul>
              <li>
                <CircleCheckIcon
                  class="inline"
                  style="color:var(--color-success-500)"
                /> There’s no need to set up an account in order to save your project
              </li>
              <li>
                <CircleCheckIcon
                  class="inline"
                  style="color:var(--color-success-500)"
                /> You must save the project’s URL somewhere if you want to share
                the project or open it in a different browser.
              </li>
            </ul>
            <p>
              To save your project, press the Save button at the top of the
              page. The project will be saved in your browser, and the project’s
              URL will be shown. Press Copy URL to copy the URL to your
              clipboard. If you want to share your project or open it in a
              different browser, make sure to save the URL in a place you can
              find it again later. You can also use the following keyboard
              shortcut to save your project:
            </p>
            <figure class="">
              <table>
                <tbody
                  ><tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td
                      ><span class="kbd">Cmd ⌘ + s</span>
                      or
                      <span class="kbd">Ctrl + s</span></td
                    ><td>Save Project</td></tr
                  ></tbody
                >
              </table>
            </figure>
            <p>
              If you <a
                class="link"
                href="#share-to-gallery"
                data-type="internal"
                data-id="#share-to-gallery">create a Project Gallery Page</a
              >, your project <em>is</em> saved to a backend database, and you can
              re-open your project from its Project Gallery Page.
            </p>
            <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
              <p>
                Your project must first have a valid location and dates in order
                to be saved, and it must first have weather data in order to
                save your project using the keyboard shortcut.
              </p>
            </div>
          </section>
          <section
            id="open-project"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Open Project</h3>
            <p>
              Recently saved projects are stored in your browser’s local
              storage. Open the menu and select a project to load it’s settings
              and weather data.
            </p>
            <p>
              You can also open any project by pasting the project’s URL in your
              browser’s address bar and opening the webpage. Press Search, and
              the project settings and weather data will be loaded.
            </p>
          </section>
          <section
            id="change-units"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Change Units</h3>
            <p>
              To change your project’s units between metric and imperial, from
              the top bar select °C / mm or °F / in. On smaller screens, press
              the three-dot menu icon, then choose your Units selection. On the
              Project Planner you can also use the following keyboard shortcut:
            </p>
            <figure class="">
              <table>
                <tbody
                  ><tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td><span class="kbd">u</span></td><td>Change Units</td
                    ></tr
                  ></tbody
                >
              </table>
            </figure>
          </section>
          <section
            id="change-theme"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Change Theme</h3>
            <p>
              To choose a theme for this site, press the Theme Switcher Icon at
              the top of the left menu, then select a theme in Light, Dark, or
              System mode. The System option will follow the light or dark
              preference of your device. On smaller screens, press the menu
              icon, then select the Theme Switcher button to change the theme.
              You can also use the following keyboard shortcut:
            </p>
            <figure class="">
              <table>
                <tbody
                  ><tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td><span class="kbd">t</span></td><td
                      >Toggle Theme (Light, Dark, System)</td
                    ></tr
                  ></tbody
                >
              </table>
            </figure>
          </section>
          <section
            id="navigation"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Navigation</h3>
            <p>
              To quickly jump between different sections of the page, press the
              name of the section at the bottom of the page. You can also use
              the following keyboard shortcuts:
            </p>
            <figure class="">
              <table>
                <tbody class="flex flex-col gap-2"
                  ><tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td class="kbd">0</td><td>Go to the top of the page</td
                    ></tr
                  ><tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td class="kbd">1</td><td>Go to Location section</td></tr
                  >
                  <tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td class="kbd">2</td><td>Go to Weather section</td></tr
                  ><tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td class="kbd">3</td><td>Go to Colors section</td></tr
                  ><tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td class="kbd">4</td><td>Go to Preview section</td></tr
                  ></tbody
                >
              </table>
            </figure>
          </section>

          <section
            id="undoredo"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Undo/Redo</h3>

            <p>
              To undo or redo any previous edit to your project, press the Undo
              or Redo buttons at the top of the page. You can also use the
              following keyboard shortcuts:
            </p>
            <figure class=" ">
              <table>
                <tbody class="flex flex-col gap-2"
                  ><tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td
                      ><span class="kbd">Cmd ⌘ + z</span>
                      or
                      <span class="kbd">Ctrl + z</span></td
                    ><td>Undo</td></tr
                  ><tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td
                      ><span class="kbd">Cmd ⌘ + Shift ⇧ + z</span>
                      or
                      <span class="kbd">Ctrl + Shift ⇧ + z</span></td
                    ><td>Redo</td></tr
                  ></tbody
                >
              </table>
            </figure>
          </section>

          <h2 class="scroll-mt-[58px] text-2xl font-bold" id="location">
            Location
          </h2>

          <section
            id="choose-a-location"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Choose a Location</h3>
            <p>
              Type a city, place, region, or landmark in the Location search
              box, then select a result from the autocomplete list.
            </p>
            <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
              <p>
                You must choose an item from the suggested results. The
                suggested results come from <a
                  class="link"
                  rel="noreferrer noopener"
                  href="https://www.geonames.org/"
                  target="_blank">geonames.org</a
                >, and each item has a unique ID, latitude, and longitude which
                are used to find weather for that location. If your location is
                not in the suggested results, try again using a different nearby
                location.
              </p>
            </div>
          </section>
          <section
            id="select-dates"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Select Dates</h3>
            <p>
              For your location’s Duration, select either One Year or Custom.
            </p>
            <ul>
              <li>
                <span class="font-bold">One Year</span> – Select a Year, Month, and
                Day. The location’s weather data will start from that date and end
                one year later.
              </li>
              <li>
                <span class="font-bold">Custom</span> – Choose any From and To dates
                for the location’s weather data.
              </li>
            </ul>
            <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
              <p>
                Selected dates should be in the past, not the future. Dates in
                the future will not contain any weather data. The maximum number
                of selected days per location is {MAXIMUM_DAYS_PER_LOCATION}.
              </p>
            </div>
          </section>
          <section
            id="multiple-locations"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Multiple Locations</h3>
            <p>
              If you want to include weather data from multiple locations, press
              the Add Location button.
            </p>
            <p>To remove a location, press the Remove Location icon.</p>
            <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
              <p>
                The maximum number of locations per project is {MAXIMUM_LOCATIONS}.
              </p>
            </div>
          </section>
          <section
            id="location-errors"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Location Errors</h3>

            <p>
              When you type your location in the search box, you might get a
              message saying:
            </p>
            <blockquote class="wp-block-quote is-style-default">
              <p class="card preset-tonal-surface p-2">
                “<em
                  >Whoah! There’s been a problem. It appears the
                  location-fetching service is experiencing technical
                  difficulties. You can refresh this webpage to see if the error
                  has been resolved. If that doesn’t work, try again later.
                  Sorry for the inconvenience.</em
                >
              </p>
            </blockquote>
            <p>
              This issue is caused when temperature-blanket.com can’t get
              location suggestion results from <a
                class="link"
                href="http://goenames.org"
                target="_blank"
                rel="noreferrer noopener">geonames.org.</a
              > You can try refreshing the page, and if the error keeps occurring,
              try again later.
            </p>
          </section>
          <h2 class="scroll-mt-[58px] text-2xl font-bold" id="weather">
            Weather
          </h2>
          <section
            id="weather-sources"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Weather Sources</h3>

            <p>
              Temperature-blanket.com provides several options from where to get
              weather data. To change the weather source settings, press the
              Weather Source button in the Location tab, Weather tab, or in the
              Project Menu.
            </p>
            <ul class="flex flex-col gap-4">
              <li class="flex flex-col gap-1">
                <p class="text-lg font-bold">Open-Meteo</p>
                <p>
                  The
                  <a
                    class="link"
                    rel="noreferrer noopener"
                    href="https://open-meteo.com/"
                    target="_blank">Open-Meteo</a
                  >
                  database contains more than 60 years of weather data from a variety
                  of open sources.
                </p>
                <p>
                  You can choose from the following Open-Meteo weather data
                  models:
                </p>
                {#each OPEN_METEO_MODELS as { title, timespan, resolution, details }}
                  <div class="ml-4 flex flex-col gap-1">
                    <p class="flex items-center gap-2 font-bold">
                      {@html title}
                    </p>
                    <div class="ml-4 flex flex-col gap-1">
                      <p class="">
                        <ClockIcon
                          class="relative -top-[2px] mr-1 inline size-4"
                        />
                        {timespan}
                      </p>
                      <p class="">
                        <Grid3X3Icon
                          class="relative -top-[2px] mr-1 inline size-4"
                        />
                        {resolution}
                      </p>
                      <p class="">
                        <InfoIcon
                          class="relative -top-[2px] mr-1 inline size-4"
                        />
                        {@html details}
                      </p>
                    </div>
                  </div>
                {/each}

                <p class="">
                  Weather data from
                  <a
                    class="link"
                    rel="noreferrer noopener"
                    href="https://www.open-meteo.com/"
                    target="_blank">Open-Meteo</a
                  >
                  is licensed under
                  <a
                    class="link"
                    rel="noreferrer noopener"
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank">Attribution 4.0 International (CC BY 4.0)</a
                  >, and includes data from the
                  <a
                    class="link"
                    rel="noreferrer noopener"
                    href="https://cds.climate.copernicus.eu/cdsapp#!/dataset/reanalysis-era5-land?tab=overview"
                    target="_blank">Copernicus Program</a
                  >.
                </p>
              </li>
              <li class="flex flex-col gap-2">
                <p class="text-lg font-bold">Meteostat</p>
                <p>
                  The
                  <a
                    class="link"
                    rel="noreferrer noopener"
                    href="https://meteostat.net/"
                    target="_blank">Meteostat</a
                  >
                  platform provides access to open data from thousands of weather
                  stations world-wide. Measurements from the nearest stations are
                  combined to produce an interpolated result. You can optionally choose
                  to not fill missing weather with statistically optimized model data.
                  (Filling missing weather data is on by default.)
                </p>
                <p class="">
                  Weather data from
                  <a
                    class="link"
                    rel="noreferrer noopener"
                    href="https://meteostat.net/"
                    target="_blank">Meteostat</a
                  >
                  is licensed under
                  <a
                    class="link"
                    rel="noreferrer noopener"
                    href="https://creativecommons.org/licenses/by-nc/4.0/"
                    target="_blank">CC BY-NC 4.0</a
                  >, with raw data provided by
                  <a
                    class="link"
                    rel="noreferrer noopener"
                    href="https://www.noaa.gov/"
                    target="_blank">NOAA</a
                  >,
                  <a
                    class="link"
                    rel="noreferrer noopener"
                    href="https://www.dwd.de/"
                    target="_blank">DWD</a
                  >
                  and
                  <a
                    class="link"
                    rel="noreferrer noopener"
                    href="https://dev.meteostat.net/docs/sources.html"
                    target="_blank">others</a
                  >.
                </p>
              </li>
            </ul>
            <hr class="hr my-2" />
            <p>
              Daytime length calculations are by <a
                class="link"
                rel="noreferrer noopener"
                href="https://github.com/mourner/suncalc"
                target="_blank">SunCalc</a
              >
              licensed under
              <a
                class="link"
                rel="noreferrer noopener"
                href="https://choosealicense.com/licenses/bsd-2-clause/"
                target="_blank">BSD 2</a
              >.
            </p>
            <p>
              If your project has missing or incorrect weather data, you can
              also <a class="link" href="#import-weather-data">import</a> or
              <a class="link" href="#edit-weather-data">edit</a> weather data.
            </p>
            <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
              <p>
                All weather data is subject to change if the provider updates
                their models.
              </p>
            </div>
          </section>
          <section
            id="get-weather-data"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Get Weather Data</h3>

            <p>
              Once you’ve selected a location and dates, press the Search button
              to get weather data for your project. A request will be made to
              the weather source, and if there’s weather data available, it will
              be shown to you.
            </p>
          </section>
          <section
            id="grouping-weather-data"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Grouping Weather Data</h3>

            <p>
              You can use daily weather data, or group it into weeks. Using
              weekly weather data can make your project shorter.
            </p>
            <ul class="flex flex-col gap-2">
              <li>
                <span class="font-bold">Daily</span> – Each day shows its own individual
                temperature, rain, snow, and daytime values.
              </li>
              <li>
                <span class="font-bold">Weekly</span>
                – Days are grouped into weeks which start on the day set from the
                Weeks Start On setting. The weather data for each week is calculated
                according to the following:
                <ul class="mt-2 ml-4 flex flex-col gap-2">
                  <li>
                    <span class="font-bold">High Temperature</span> – The highest
                    temperature of the week
                  </li>
                  <li>
                    <span class="font-bold">Average Temperature</span> – The average
                    temperature of the days in the week
                  </li>
                  <li>
                    <span class="font-bold">Low Temperature</span> – The lowest temperature
                    of the week
                  </li>
                  <li>
                    <span class="font-bold">Rain</span> – The sum of rainfall of the
                    days in the week
                  </li>
                  <li>
                    <span class="font-bold">Snow</span> – The sum of snowfall of the
                    days in the week
                  </li>
                  <li>
                    <span class="font-bold">Sun</span> – The average daytime of the
                    days in the week
                  </li>
                </ul>
              </li>
            </ul>
            <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
              <p>
                The Average Temperature and Average Daytime of all items in your
                weather data (displayed above the weather chart) might be
                slightly different when using Daily vs Weekly weather data. This
                is an expected result because of how the averages are
                calculated.
              </p>
            </div>
            <div class="sticky-block-wrapper sticky-block-wrapper-1">
              <div
                class="sticky-block-placeholder sticky-block-placeholder-1"
                style="width:0; height:0; margin:0; padding:0; visibility:hidden;"
              ></div>
              <div
                class="wp-block-senff-sticky-block senff-sticky-block-1 sticky-block-original-1 block-is-not-sticky sticky-block-active-1"
                data-topspace="0"
                data-cfa="true"
                data-minwidth="0"
                data-maxwidth="99999"
                data-pushup=""
                data-zindex="1"
                style=""
              ></div>
            </div>
          </section>
          <section
            id="view-weather-data"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">View Weather Data</h3>

            <p>
              An overview of your project’s weather data is shown in a chart.
            </p>
            <p>
              You can press the Show Color Details toggle to see color details
              in the weather chart.
            </p>
          </section>
          <section
            id="edit-weather-data"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Edit Weather Data</h3>

            <p>
              To edit weather data, your project’s <a
                class="link"
                href="#grouping-weather-data">weather grouping</a
              > must be Daily, not Weekly. To edit weather data, press the value you
              want to change in the table under the weather chart. A modal will open
              where you can save the new value.
            </p>
            <p>
              If you want to edit many values, it may be easier to work with the
              data in a spreadsheet:
            </p>
            <ul class="ml-4 flex flex-col gap-2">
              <li>
                - <a class="link" href="#download-weather-data-csv">
                  Download your project’s weather data CSV file</a
                >
              </li>
              <li>
                - Open the CSV file with a spreadsheet program (for example
                Microsoft Excel, Apple Numbers, or Google Sheets).
              </li>
              <li>
                - Edit the weather data you want to change, then export the
                document as a CSV file
              </li>
              <li>
                - <a class="link" href="#import-weather-data"
                  >Import the new CSV file into your project</a
                >
              </li>
            </ul>
            <p>
              Edited weather data is saved to your browser when you <a
                class="link"
                href="#save-project">save your project</a
              >. If you want to open your project in another browser, make sure
              to
              <a class="link" href="#download-weather-data-csv"
                >download your project’s weather data CSV file</a
              >
              so you can
              <a class="link" href="#import-weather-data">import the CSV file</a
              > to your project in that browser.
            </p>
          </section>
          <section
            id="import-weather-data"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Import Weather Data</h3>

            <p>
              To import weather data, press the Import Weather Data button in
              the Weather tab; a modal will open where you can upload the CSV
              weather data file, then press Import to load the weather data into
              your project. Note that your project’s <a
                class="link"
                href="#grouping-weather-data">weather grouping</a
              >
              must be Daily, not Weekly.
            </p>
            <p
              id="import-weather-data-file-requirements"
              class="scroll-mt-[58px]"
            >
              <em>CSV File Requirements</em>
            </p>
            <img
              src="/images/documentation/csv-file-requirements.png"
              alt="CSV file example"
              class="w-full"
            />
            <p>
              It’s simplest to download your project’s weather data CSV file and
              use that as a starting point for editing weather data.
            </p>
            <p>
              But you can also import any CSV file with custom weather data (for
              example data from another weather source) as long as the file
              conforms to the following requirements:
            </p>
            <p>
              <em>Row 1 must contain the following two column headings:</em>
            </p>
            <ul class="ml-2 flex flex-col gap-2">
              <li>
                <span class="font-bold">Date</span>
                – Values in the
                <em>Date</em>
                column should be in the format of YYYY-MM-DD for best results, and
                must be in the range of
                <a class="link" href="#select-dates"
                  >dates selected for your project</a
                >. Dates in the CSV file which are not
                <a class="link" href="#select-dates"
                  >dates selected for your project</a
                > will be ignored.
              </li>
              <li>
                <span class="font-bold">Location Index</span>
                – Values in the
                <em>Location Index</em>
                column should be<em></em>“0” (that’s a zero without the
                quotation marks) unless your project has more than one location.
                If your project has more than one location, the value should be
                the number of the location for which the date corresponds (0 is
                the first location, 1 is the second location, 2 is the third
                location, and so on).
              </li>
            </ul>
            <p>
              <em
                >Row 1 must contain any or all of the following weather data
                column headings. Use only column headings corresponding to your
                chosen units. Only columns with headings matching the following
                will be changed; other existing weather data will not be
                changed. Note the parentheses, spaces, symbols, and units.</em
              >
            </p>
            <ul class="ml-4 flex flex-col gap-2">
              <li>
                <span class="font-bold">High Temperature (°F)</span>
                or
                <span class="font-bold">High Temperature (°C)</span>
              </li>
              <li>
                <span class="font-bold">Average Temperature (°F)</span>
                or
                <span class="font-bold">Average Temperature (°C)</span>
              </li>
              <li>
                <span class="font-bold">Low Temperature (°F)</span>
                or
                <span class="font-bold">Low Temperature (°C)</span>
              </li>
              <li>
                <span class="font-bold">Rain (in)</span>
                or
                <span class="font-bold">Rain (mm)</span>
              </li>
              <li>
                <span class="font-bold">Snow (in)</span>
                or
                <span class="font-bold">Snow (in)</span>
              </li>
              <li>
                <span class="font-bold">Daytime (h:m)</span>
              </li>
            </ul>
            <p>
              <em
                >Values in the <em>Daytime (h:m)</em> column must be in the format
                of hours:minutes. For example, 08:12 means eight hours and twelve
                minutes.</em
              >.
            </p>
            <p>
              <em>For best results, save the CSV file with UTF-8 encoding</em>.
            </p>
          </section>
          <section
            id="weather-errors"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Weather Errors</h3>

            <p>
              When you press the Search button, you might get a message saying:
            </p>
            <blockquote class="card preset-tonal-surface p-2">
              <p>
                Weather data not found. Please try a different location or
                dates.
              </p>
            </blockquote>
            <p>
              If so, you’ll have to try to search again with a different
              location and/or selected dates.
            </p>
            <ul class="ml-4 flex flex-col gap-2">
              <li>
                - Make sure your selected dates are in the past, not the future.
              </li>
              <li>
                - If your selected dates are from before about 1980, try more
                recent dates.
              </li>
              <li>- Try a different nearby location</li>
            </ul>
          </section>
          <section
            id="mixed-snow-parameters"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Mixed Snow Parameters</h3>

            <p>
              Sometimes there might be a label below the <em>Total Snowfall</em>
              weather data which says
              <em>Error: Mixed Parameters</em>. This happens when there are
              multiple locations and multiple weather sources (Meteostat and
              Open-Meteo). The snow parameter from Meteostat measures the
              highest snow depth, and the snow parameter from Open-Meteo
              measures the total snowfall. When this data is combined—as happens
              in some cases when there are multiple locations and mixed weather
              sources—the Meteostat snow depth data gets treated as snowfall
              data instead, so the total snowfall amount will not be accurate.
              To get rid of the error message, make sure the weather source is
              Open-Meteo for all locations by changing the Weather Source to
              Open-Meteo (and optionally disabling the use of other weather
              sources if no data is found). There is currently no other way to
              prevent this issue. You can make projects with mixed snow
              parameters, just know that the snow data types will not be
              consistent.
            </p>
          </section>
          <h2 class="scroll-mt-[58px] text-2xl font-bold" id="gauges">
            Gauges
          </h2>
          <section
            id="add-a-gauge"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Add a Gauge</h3>

            <p>
              By default, every project has a Temperature Gauge, but you can
              also add other types of gauges in order to incorporate different
              types of weather data in your project. To add a gauge, press
              Select a Gauge, then select one of the available options.
            </p>
            <p>Gauges you can create are:</p>
            <ul class="ml-4 flex flex-col gap-2">
              <li>Temperature gauge (required)</li>
              <li>Rain gauge</li>
              <li>Snow gauge</li>
              <li>Daytime gauge</li>
            </ul>
            <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
              <p>
                You can only add a gauge if the weather data contains that
                gauge’s information. For example, if there is no snow data, you
                won’t be able to add a snow gauge.
              </p>
            </div>
          </section>
          <section
            id="gauge-direction"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Gauge Direction</h3>

            <p>
              To change the direction of a gauge, press the Settings button,
              choose High to Low or Low to High, then press Save Settings.
            </p>
            <ul class="flex flex-col gap-2">
              <li>
                <span class="font-bold">High to Low</span> – Starting from the highest
                value, ranges decrease in value for each subsequent color.
              </li>
              <li>
                <span class="font-bold">Low to High</span> – Starting from the lowest
                value, ranges increase in value for each subsequent color.
              </li>
            </ul>
          </section>
          <section
            id="range-calculation-methods"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Range Calculation Methods</h3>

            <p>
              There are four possible options used to determine which range a
              day’s weather value gets assigned to. Each method handles the
              inclusion or exclusion of specific temperature values differently.
            </p>
            <ol class="flex flex-col gap-2">
              <li>
                <span class="font-bold"
                  >Include From, don’t include To (default)</span
                >: This method considers the temperature values starting from
                the specified From value, up to, but excluding, the specified To
                value. For example, if you set the range from 30 to 20 degrees,
                the range will include temperatures equal to or greater than 20
                degrees, but not temperatures equal to or greater than 30
                degrees. Ranges in a gauge using this method could look like
                this: 30 to 20, 20 to 10, 10 to 0…
              </li>
              <li>
                <span class="font-bold">Include To, don’t include From</span>:
                In contrast to the previous method, this approach includes
                temperature values up to and including the specified To value,
                but excludes temperatures equal to or less than the specified
                From value. For instance, if you set the range from 30 to 20
                degrees, the calculation will include temperatures less than or
                equal to 30 degrees, but not temperatures less than or equal to
                20 degrees. Ranges in a gauge using this method could look like
                this: 30 to 20, 20 to 10, 10 to 0…
              </li>
              <li>
                <span class="font-bold">Include both From and To</span>: This
                method includes temperature values starting from the specified
                From value and includes temperatures up to and including the
                specified To value. If you set the range from 30 to 20 degrees,
                the calculation will include temperatures equal to or greater
                than 20 degrees and temperatures equal to or less than 30
                degrees. Ranges in a gauge using this method could look like
                this: 30 to 20.01, 20 to 10.01, 10 to 0.01…
              </li>
              <li>
                <span class="font-bold">Don’t include From and To</span>: As the
                name suggests, this method excludes both the specified From and
                To values from the calculation. If you set the range from 20 to
                30 degrees, the calculation will exclude temperatures equal to
                or less than 20 degrees and temperatures equal to or greater
                than 30 degrees. Ranges in a gauge using this method could look
                like this: 30.01 to 20, 20.01 to 10, 10.01 to 0…
              </li>
            </ol>
            <p>
              Here’s a table showing which values would be included in an
              example range from 13 degrees to 12 degrees.
            </p>
            <figure class="">
              <table
                class="table-autoborder-surface-950-50 bg-surface-200 dark:bg-surface-800 rounded-container border p-2"
              >
                <thead>
                  <tr
                    ><th class="p-2">Option</th><th class="p-2">Expression</th
                    ><th class="p-2">Values in Range?</th></tr
                  >
                </thead>
                <tbody
                  ><tr
                    ><td class="p-2"
                      >Include From, don’t include To (default)</td
                    ><td class="p-2">From ≥ Range > To</td><td class="p-2"
                      >13 ✅<br />12.5 ✅<br />12 ❌</td
                    ></tr
                  ><tr
                    ><td class="p-2">Include To, don’t include From</td><td
                      class="p-2">From > Range ≥ To</td
                    ><td class="p-2">13 ❌<br />12.5 ✅<br />12 ✅</td></tr
                  ><tr
                    ><td class="p-2">Include both From and To</td><td
                      >From ≥ Range ≥ To</td
                    ><td class="p-2">13 ✅<br />12.5 ✅<br />12 ✅</td></tr
                  ><tr
                    ><td class="p-2">Don’t include From and To</td><td
                      class="p-2">From > Range > To</td
                    ><td class="p-2">13 ❌<br />12.5 ✅<br />12 ❌</td></tr
                  ></tbody
                >
              </table>
            </figure>
            <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
              <p>
                If you choose the third or fourth Range Calculation Method but
                don’t have Automatic Increments set or choose Round Increment
                (see below), temperature-blanket.com doesn’t currently
                auto-calculate optimal range From and To values. This may be
                addressed in a future update.
              </p>
              <p>
                If a day’s weather value would fit in two or more ranges, the
                first-matching range (highest on the gauge) is used.
              </p>
            </div>
          </section>
          <section
            id="increment-modes"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="scroll-mt-[58px] text-xl font-bold">Increment Modes</h3>

            <p>
              A range increment is the difference between the highest and lowest
              values in a range.
            </p>
            <ul class="ml-4 flex flex-col gap-2">
              <li>
                <span class="font-bold">Automatic</span>
                – Each range’s increment is automatically chosen based on your weather
                data. The maximum and minimum weather data values for the gauge are
                used to calculate increments which fit the number of colors.
                <ul>
                  <li>
                    Round Increment – This option is available if an
                    auto-calculated increment has decimals. Choose this option
                    to avoid decimals in ranges’ From and To values.
                  </li>
                </ul>
              </li>
              <li>
                <span class="font-bold">Manual</span> – Set an increment value and
                a start value. Based on the Direction and the number of colors in
                your gauge, each range will be set using your increment value.
              </li>
            </ul>
            <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
              <p>
                When using Automatic Increments on height-type gauges (Rain
                Gauge, Snow Gauge), depending on the weather data, some ranges
                might have negative values. If this is the case, you can
                manually adjust those ranges to positive values (in real life
                you can’t have a negative amount of rain or snow).
              </p>
            </div>
          </section>
          <section
            id="adjust-ranges"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Adjust Ranges</h3>

            <p>
              To adjust an individual color’s range: select the Range; adjust
              the From and To values using the input fields, plus and minus
              buttons, or the range sliders; then press Save Range.
            </p>
          </section>
          <h2 class="scroll-mt-[58px] text-2xl font-bold" id="colors">
            Color Tools
          </h2>
          <section
            id="preset-colors"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Preset Colors</h3>

            <p>
              To browse collection of preset colors to use in your project,
              press Browse Palettes. Then select a Category and change the
              filters to see different color combinations. Select the palette to
              use it in your project. The categories are as follows:
            </p>
            <ul class="ml-4 flex flex-col gap-2">
              <li>
                <span class="font-bold">Gallery</span> – All user-made color palettes
              </li>
              <li>
                <span class="font-bold">Featured</span> – Popular user-made color
                palettes
              </li>
              <li>
                <span class="font-bold">Schemes</span>
                – Color schemes based on
                <a
                  class="link"
                  rel="noreferrer noopener"
                  href="https://ColorBrewer2.org"
                  target="_blank">ColorBrewer2.org</a
                >
                by Cynthia A. Brewer, Geography, Pennsylvania State University, licenced
                under
                <a
                  class="link"
                  rel="noreferrer noopener"
                  href="https://www.apache.org/licenses/LICENSE-2.0"
                  target="_blank">Apache 2</a
                >.
              </li>
            </ul>
          </section>
          <section
            id="image-palette"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Image Palette</h3>

            <p>
              To create a palette of colors from an image, press the Image
              Palette button. Use a random image (from <a
                class="link"
                rel="noreferrer noopener"
                href="http://hunsplash.com"
                target="_blank">unsplash.com</a
              >), or upload your own image. Click or tap the picture to select
              colors. Rearrange them or remove unwanted colors, then press Save
              to use the palette in your project.
            </p>
          </section>
          <section
            id="importexport"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Export/Import</h3>

            <p>
              To export a color palette as HTML color codes or yarn names, press
              Export/Import, then press Copy for whichever format you want.
              Share or paste the copied text somewhere you can find it later.
            </p>
            <p>
              To import a color palette, press Export/Import, press the Import
              button, then type color names or paste a valid code or URL. When
              you're finished, press Save.
            </p>
          </section>
          <section
            id="sort-colors"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Sort Colors</h3>

            <p>
              To move a color in a palette, press the drag icon on the color and
              drag it to a new position in your gauge. You can also sort colors
              by pressing the Sort button, then choosing an option to sort all
              the colors by lightness or name. You can also reverse all the
              colors by pressing Reverse.
            </p>
          </section>
          <h2 class="scroll-mt-[58px] text-2xl font-bold" id="yarn">Yarn</h2>
          <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
            <p>
              Real yarn colors will look different than what’s on the screen.
              Any trademarked yarn or colorway details are owned by their
              respective companies. Results are not sponsored, but items
              purchased through some links (marked with a shopping cart icon <ShoppingCartIcon
                class="inline size-4"
              />) may earn the developer of this site a percentage of the sale
              at no additional cost to you. Colors may be inaccurate, and may
              not represent yarn as it appears in physical reality. Requests for
              yarn to be included in these results can be made by anyone using
              <a class="link" href="/yarn-search-request">this request form.</a>
            </p>
          </div>
          <section
            id="getting-yarn-colorway-data"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Getting Yarn Colorway Data</h3>

            <p>
              This web app uses color approximations of real yarn colorways in
              order to display them as colors on your screen.
            </p>
            <p>
              The process used to convert a real yarn colorway into a color on
              your screen is as follows:
            </p>
            <ol class="ml-4">
              <li>
                - An image of the colorway is found (usually from the brand or
                manufacture’s website).
              </li>
              <li>
                - A unobstructed area of the image showing as much
                color-variance as possible within that yarn colorway is chosen.
              </li>
              <li>
                - From the selected part of the image, the average color is
                generated as an HTML color code.
              </li>
              <li>
                - The HTML color code, colorway name, and link to the colorway’s
                webpage is saved in a database which this web app uses to
                display the colorway data.
              </li>
            </ol>
          </section>
          <section
            id="choose-yarn-colorways"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Choose Yarn Colorways</h3>

            <p>
              To pick yarn colorways to use in your project, press the Choose
              Colorways button. Select the colorways you want to use, choose to
              add them to your existing palette or to create a new palette, then
              press Use These Colorways.
            </p>
          </section>
          <section
            id="link-unavailable"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Link Unavailable</h3>

            <p>
              A yarn that says Link Unavailable means the webpage from which the
              colorways were accessed is no longer available. Yarns whos links
              are unavailable will remain on this web app for legacy purposes,
              but links to the yarn and its colorways will not work.
            </p>
            <p>A yarn with unavailable links could mean:</p>
            <ul class="ml-4">
              <li>- The yarn has been discontinued</li>
              <li>- The yarn has been renamed</li>
              <li>
                - The yarn’s website has been re-designed and old links no
                longer exist
              </li>
            </ul>
          </section>
          <h2 class="scroll-mt-[58px] text-2xl font-bold" id="preview">
            Preview
          </h2>
          <section
            id="create-a-preview"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Create a Preview</h3>

            <p>
              To view and customize what your project might look like, select a
              Pattern Type and adjust the settings. These are the different
              pattern types which you can use to customize your preview:
            </p>
            <ul class="ml-4 flex flex-col gap-2">
              <li>
                <span class="font-bold">Calendar</span> – Squares are arranged in
                a calendar-like grid, grouped by month.
              </li>
              <li>
                <span class="font-bold">Chevrons</span> – Zig-zag rows of stitches
              </li>
              <li>
                <span class="font-bold">Continuous Square</span> – Starting from the
                center, stitches are added in a clockwise square pattern. Possible
                crochet patterns: Granny Square, Moss Stitch/Linen Stitch Square.
              </li>
              <li>
                <span class="font-bold">Corner to Corner</span> – Lines are added
                in a back-and-forth pattern starting from the bottom right.
              </li>
              <li>
                <span class="font-bold">Daytime Rows</span>
                – Each row is split according to the duration of sunlight that day.
                Daytime stitches = d × r ∕ 24. Night stitches =
                <strong>r</strong> − Daytime stitches. d = Daytime (time from
                the day’s sunrise to sunset in hours). r is the total stitches
                per row. 24 is the number of hours in a day.
              </li>
              <li>
                <span class="font-bold">Hexagon Rounds</span>
                Each round in a hexagon represents one day. Hexagons are added from
                left to right, top to bottom.
              </li>
              <li>
                <span class="font-bold">Month Rows</span> – Rows are grouped by month from
                top to bottom or left to right. Months with fewer days have extra
                rows added, so that each month has the same number of rows.
              </li>
              <li>
                <span class="font-bold">Month Squares</span> – Each square represents
                one month. Each round in a square represents one day, starting with
                the first of the month in the center of the square. Months with fewer
                days have extra rounds added, so that each square has the same number
                of rounds.
              </li>
              <li>
                <span class="font-bold">Rows</span> – Straight rows of stitches
              </li>
              <li>
                <span class="font-bold">Split Month Squares</span> – Each square represents
                one month. Each round in a square represents one day, starting with
                the first of the month in the center of the square. Each round is
                split in half to represent two different weather parameters. Months
                with fewer days have extra rounds added, so that each square has the
                same number of rounds.
              </li>
              <li>
                <span class="font-bold">Square Rounds</span> – Each round in a square
                represents one day.
              </li>
              <li>
                <span class="font-bold">Squares</span> – Each square represents one
                day.
              </li>
            </ul>
            <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
              <p>
                The project preview might not look like a real crochet or
                knitted item. It is only meant to give you an idea of using the
                colors and pattern type. Patterns are not provided.
              </p>
            </div>
          </section>

          <section
            id="assigning-seasons"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="flex items-center gap-2 text-xl font-bold">
              Assigning Seasons<span class="badge bg-tertiary-100-900"
                >Beta</span
              >
            </h3>

            <p class="bg-tertiary-100-900 rounded-container p-2">
              This feature is in beta, which means it may have unexpected issues
              or may have breaking changes in the future. If you encounter any
              issues or have feedback, please let the developer know. <a
                href="/contact"
                class="link"
                target="_blank">Here is the contact page</a
              >.
            </p>

            <p>
              Assigning seasons allows you to use different weather parameters
              for different times of the year. For example, you could use High
              Temperatures for Spring and Summer, and Low Temperatures for Fall
              (Autumn) and Winter.
            </p>

            <p>
              To assign seasons, select the Seasons toggle in the settings of
              the Preview tab. Note that not all pattern types support seasons,
              so if you don't see the Seasons toggle, select a different pattern
              type.
            </p>

            <p>
              To edit which dates are in which seasons, press the name of a
              season. You can choose from several preset options, or customize
              the start and end dates for each season.
            </p>

            <p>Notes:</p>
            <ul class="ml-4">
              <li>
                - If a date falls outside of a custom defined seasons' ranges,
                that date will use the Accent Color as a fallback.
              </li>
              <li>
                - If two season's date ranges overlap, the first season which
                includes that date will be used. The order of the seasons is as
                follows: 1) Spring, 2) Summer, 3) Fall (Autumn), 4) Winter.
              </li>
            </ul>

            <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
              <p>
                For now, only the Rows pattern type supports assigning seasons.
                Support for more pattern types may be added in future updates.
              </p>
            </div>
          </section>

          <h2 class="scroll-mt-[58px] text-2xl font-bold" id="gallery">
            Gallery
          </h2>
          <section
            id="share-to-gallery"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Share to Gallery</h3>

            <p>
              If you choose, you can share your project in the <a
                class="link"
                href="/gallery">Project Gallery</a
              >. Press the Share to Gallery button, and wait for your project to
              be sent.
            </p>
            <p>When you create a Project Gallery Page:</p>
            <ul class="ml-4">
              <li>
                - You can find and re-open your project later without having to
                remember to store the project URL somewhere
              </li>
              <li>- Your project gets it’s own shareable overview page</li>
              <li>
                - Other people can find your project and create their own
                variations
              </li>
              <li>
                - If you created a custom color palette, the palette will be
                available for others to use
              </li>
            </ul>
            <div class="card bg-warning-500/20 flex flex-col gap-2 p-4">
              <p>
                Project Gallery Pages can’t be edited once they are submitted to
                the gallery. If you want to make a change to your Project
                Gallery Page, edit the original project, then submit a new
                Gallery Page.
              </p>
            </div>
          </section>

          <h2 class="scroll-mt-[58px] text-2xl font-bold" id="download">
            Download
          </h2>
          <section
            id="download-gauges-and-weather-data-pdf"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">
              Download Gauges and Weather Data (PDF)
            </h3>

            <p>
              To download your color charts and weather data as a PDF file,
              press the three-dot menu icon, press the Download button, then
              press the Color Charts and Weather Data (PDF) button. You can also
              open the download menu by using the following keyboard shortcut:
            </p>
            <figure class="">
              <table>
                <tbody
                  ><tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td class="kbd">d</td><td>Open Download Menu</td></tr
                  ></tbody
                >
              </table>
            </figure>
          </section>
          <section
            id="download-weather-data-csv"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Download Weather Data (CSV)</h3>
            <p>
              To download a CSV file with your project’s weather data, press the
              three-dot menu icon, press Download, then press Weather Data
              (CSV). You can also open the download menu by using the following
              keyboard shortcut:
            </p>
            <figure class="">
              <table>
                <tbody
                  ><tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td class="kbd">d</td><td>Open Download Menu</td></tr
                  ></tbody
                >
              </table>
            </figure>
          </section>
          <section
            id="download-preview-image-png"
            class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-[58px] flex-col gap-2 p-4"
          >
            <h3 class="text-xl font-bold">Download Preview Image (PNG)</h3>
            <p>
              To download a PNG file of your project’s preview image, press the
              three-dot menu icon, press Download, then press Preview Image
              (PNG). You can also open the download menu by using the following
              keyboard shortcut:
            </p>
            <figure class="">
              <table>
                <tbody
                  ><tr
                    class="flex-flow border-surface-950-50 rounded-container flex w-full items-center justify-between gap-2 border p-2 font-bold"
                    ><td class="kbd">d</td><td>Open Download Menu</td></tr
                  ></tbody
                >
              </table>
            </figure>
          </section>
        </div>
        <div
          class="sticky top-16 hidden h-auto w-1/5 min-w-[240px] self-start sm:inline-block"
        >
          <div class="max-h-[90svh] overflow-auto pb-20">
            {@render tableOfContents()}
          </div>
        </div>
      </div>
    </main>
  {/snippet}
</AppShell>
