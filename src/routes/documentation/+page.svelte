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
  import { MAXIMUM_DAYS_PER_LOCATION, MAXIMUM_LOCATIONS } from '$lib/constants';
  // const drawerStore = getDrawerStore();

  let checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline text-success-800-100-token">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
`;
  let xIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline text-error-800-100-token">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
`;
</script>

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

<AppShell pageName="Documentation">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex mx-auto my-1">
      <AppLogo />
    </div>
    <button
      class="btn preset-tonal-secondary flex items-center sm:hidden"
      title="Open Navigation Sidebar"
      onclick={() => {
        // drawerStore.open({
        //   id: 'documentation',
        //   position: 'right',
        // });
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-6 h-6"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="M3 9h14V7H3zm0 4h14v-2H3zm0 4h14v-2H3zm16 0h2v-2h-2zm0-10v2h2V7zm0 6h2v-2h-2z"
        /></svg
      >

      <span class="">Content</span>
    </button>
  {/snippet}
  {#snippet main()}
    <main class="max-w-screen-xl m-auto mb-4 pt-2 px-2 lg:px-0">
      <div class="pb-4 text-left flex gap-4">
        <div
          use:tocCrawler={{ mode: 'generate' }}
          class="w-full flex flex-col gap-8"
        >
          <div class="flex flex-col gap-4">
            <h2
              class="font-bold text-2xl scroll-mt-[58px] hidden lg:inline-block"
              data-toc-ignore
            >
              Documentation
            </h2>
            <section
              id="introduction"
              class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col mt-2 lg:mt-0"
            >
              <h3 class="font-bold text-xl">Introduction</h3>
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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">About the Project Planner</h3>
            <p>
              The Project Planner at <a
                class="link"
                rel="noreferrer noopener"
                href="/"
                target="_blank">temperature-blanket.com</a
              >
              is a tool for planning a crocheted or knitted project which incorporates
              weather data into its design. If you don’t know what a temperature
              blanket is, you can learn more here:
              <a class="link" href="/blog/what-is-a-temperature-blanket/"
                >What is a Temperature Blanket?</a
              >
            </p>
            <div class="flex flex-wrap gap-4">
              <div class="flex flex-col gap-2 card p-4">
                <p class="font-bold">Use the Project Planner</p>
                <p>
                  {@html checkIcon}
                  Before you start working on your project, to help choose your yarn
                  colors, plan your ranges, and preview your design
                </p>
                <p>
                  {@html checkIcon}
                  As you pick dates for your project, to view aggregated historical
                  weather data or to get an idea what this year’s temperature ranges
                  might be based on past temperatures
                </p>
                <p>
                  {@html checkIcon}
                  Before you buy your yarn, to estimate how many skeins of each colorway
                  you might need
                </p>
                <p>
                  {@html checkIcon}
                  While you’re working on your project, to get historical weather
                  data and get yarn color details
                </p>
              </div>
              <div class="flex flex-col gap-2 card p-4">
                <p class="font-bold">Don’t use the Project Planner</p>
                <p>
                  {@html xIcon} If your project contains dates beyond the current
                  date
                </p>
                <p>
                  {@html xIcon} To view future weather forecasts. (For that use the
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

          <h2 class="font-bold text-2xl" id="basics">Basics</h2>

          <section
            id="save-project"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Save Project</h3>
            <p>
              When you save a project, a shareable URL is created, and the
              project is saved in your browser's local storage. This web app
              does not store your project in a backend database. This means:
            </p>
            <ul>
              <li>
                {@html checkIcon} There’s no need to set up an account in order to
                save your project
              </li>
              <li>
                {@html checkIcon} You must save the project’s URL somewhere if you
                want to share the project or open it in a different browser.
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
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
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
            <div
              class="card preset-tonal-warning base-font-color p-4 gap-2 flex flex-col"
            >
              <p>
                Your project must first have a valid location and dates in order
                to be saved, and it must first have weather data in order to
                save your project using the keyboard shortcut.
              </p>
            </div>
          </section>
          <section
            id="open-project"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Open Project</h3>
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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Change Units</h3>
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
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
                    ><td><span class="kbd">u</span></td><td>Change Units</td
                    ></tr
                  ></tbody
                >
              </table>
            </figure>
          </section>
          <section
            id="change-theme"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Change Theme</h3>
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
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Navigation</h3>
            <p>
              To quickly jump between different sections of the page, press the
              name of the section at the bottom of the page. You can also use
              the following keyboard shortcuts:
            </p>
            <figure class="">
              <table>
                <tbody class="flex flex-col gap-2"
                  ><tr
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
                    ><td class="kbd">0</td><td>Go to the top of the page</td
                    ></tr
                  ><tr
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
                    ><td class="kbd">1</td><td>Go to Location section</td></tr
                  >
                  <tr
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
                    ><td class="kbd">2</td><td>Go to Weather section</td></tr
                  ><tr
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
                    ><td class="kbd">3</td><td>Go to Colors section</td></tr
                  ><tr
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
                    ><td class="kbd">4</td><td>Go to Preview section</td></tr
                  ></tbody
                >
              </table>
            </figure>
          </section>

          <section
            id="undoredo"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Undo/Redo</h3>

            <p>
              To undo or redo any previous edit to your project, press the Undo
              or Redo buttons at the top of the page. You can also use the
              following keyboard shortcuts:
            </p>
            <figure class=" ">
              <table>
                <tbody class="flex flex-col gap-2"
                  ><tr
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
                    ><td
                      ><span class="kbd">Cmd ⌘ + z</span>
                      or
                      <span class="kbd">Ctrl + z</span></td
                    ><td>Undo</td></tr
                  ><tr
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
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

          <h2 class="font-bold text-2xl scroll-mt-[58px]" id="location">
            Location
          </h2>

          <section
            id="choose-a-location"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Choose a Location</h3>
            <p>
              Type a city, place, region, or landmark in the Location search
              box, then select a result from the autocomplete list.
            </p>
            <div
              class="card preset-tonal-warning base-font-color p-4 gap-2 flex flex-col"
            >
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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Select Dates</h3>
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
            <div
              class="card preset-tonal-warning base-font-color p-4 gap-2 flex flex-col"
            >
              <p>
                Selected dates should be in the past, not the future. Dates in
                the future will not contain any weather data. The maximum number
                of selected days per location is {MAXIMUM_DAYS_PER_LOCATION}.
              </p>
            </div>
          </section>
          <section
            id="multiple-locations"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Multiple Locations</h3>
            <p>
              If you want to include weather data from multiple locations, press
              the Add Location button.
            </p>
            <p>To remove a location, press the Remove Location icon.</p>
            <div
              class="card preset-tonal-warning base-font-color p-4 gap-2 flex flex-col"
            >
              <p>
                The maximum number of locations per project is {MAXIMUM_LOCATIONS}.
              </p>
            </div>
          </section>
          <section
            id="location-errors"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Location Errors</h3>

            <p>
              When you type your location in the search box, you might get a
              message saying:
            </p>
            <blockquote class="wp-block-quote is-style-default">
              <p class="card p-2 preset-tonal-surface base-font-color">
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
          <h2 class="font-bold text-2xl scroll-mt-[58px]" id="weather">
            Weather
          </h2>
          <section
            id="weather-sources"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Weather Sources</h3>

            <p>
              Sometimes one weather service may not have data for your location.
              Changing weather sources can let you see different weather data.
              Often the differences are minimal, but because of the particular
              ways weather services collect and interpret data, sometimes there
              are significant differences.
            </p>
            <ul>
              <li>
                <a
                  class="link"
                  rel="noreferrer noopener"
                  href="https://meteostat.net/"
                  target="_blank">Meteostat</a
                >
                – The
                <a
                  class="link"
                  rel="noreferrer noopener"
                  href="https://meteostat.net/"
                  target="_blank">Meteostat</a
                >
                platform provides access to open data from thousands of weather stations
                world-wide. Measurements from the nearest stations are combined to
                produce an interpolated result. Weather data from
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
              </li>
              <li>
                <a
                  class="link"
                  rel="noreferrer noopener"
                  href="https://open-meteo.com/"
                  target="_blank">Open-Meteo</a
                >
                – The
                <a
                  class="link"
                  rel="noreferrer noopener"
                  href="https://open-meteo.com/"
                  target="_blank">Open-Meteo</a
                >
                database contains more than 60 years of weather data from a variety
                of open sources, including data from the
                <a
                  class="link"
                  rel="noreferrer noopener"
                  href="https://cds.climate.copernicus.eu/cdsapp#!/dataset/reanalysis-era5-land?tab=overview"
                  target="_blank">Copernicus Program</a
                >. Weather data from
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
              </li>
            </ul>
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
              also <a class="link" href="#edit-weather-data"
                >edit the weather data</a
              >.
            </p>
            <div
              class="card preset-tonal-warning base-font-color p-4 gap-2 flex flex-col"
            >
              <p>
                For any weather provider, recent weather data may be delayed by
                a few days.
              </p>
            </div>
          </section>
          <section
            id="get-weather-data"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Get Weather Data</h3>

            <p>
              Once you’ve selected a location and dates, press the Search button
              to get weather data for your project. A request will be made to
              the weather source, and if there’s weather data available, it will
              be shown to you.
            </p>
          </section>
          <section
            id="grouping-weather-data"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Grouping Weather Data</h3>

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
                <ul class="flex flex-col gap-2 ml-4 mt-2">
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
                    <span class="font-bold">Rain</span> – The sum of rainfall of
                    the days in the week
                  </li>
                  <li>
                    <span class="font-bold">Snow</span> – The sum of snowfall of
                    the days in the week
                  </li>
                  <li>
                    <span class="font-bold">Sun</span> – The average daytime of the
                    days in the week
                  </li>
                </ul>
              </li>
            </ul>
            <div
              class="card preset-tonal-warning base-font-color p-4 gap-2 flex flex-col"
            >
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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">View Weather Data</h3>

            <p>
              An overview of your project’s weather data is shown in a chart.
            </p>
            <p>
              To view an individual day’s weather data, select Table or Details
              below the weather chart.
            </p>
            <ul class="flex flex-col gap-2">
              <li>
                <span class="font-bold">Table</span> – Browse a table of weather
                data. Press a header label to sort the results.
              </li>
              <li>
                <span class="font-bold">Details</span> – Press the Previous or Next
                arrow icons, move the range slider, or press a point on the weather
                chart to navigate to a date and view its weather data and color details.
              </li>
            </ul>
          </section>
          <section
            id="edit-weather-data"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Edit Weather Data</h3>

            <p>
              To edit weather data, your project’s <a
                class="link"
                href="#grouping-weather-data">weather grouping</a
              > must be Daily, not Weekly. To edit weather data, press the value
              you want to change in the table under the weather chart. A modal will
              open where you can save the new value.
            </p>
            <p>
              If you want to edit many values, it may be easier to work with the
              data in a spreadsheet:
            </p>
            <ul class="flex flex-col gap-2 ml-4">
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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Import Weather Data</h3>

            <p>
              To import weather data, press the Import Weather Data button; a
              modal will open where you can upload the CSV weather data file,
              then press Import to load the weather data into your project. Note
              that your project’s <a class="link" href="#grouping-weather-data"
                >weather grouping</a
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
            <ul class="flex flex-col gap-2 ml-2">
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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Weather Errors</h3>

            <p>
              When you press the Search button, you might get a message saying:
            </p>
            <blockquote class="card p-2 preset-tonal-surface base-font-color">
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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Mixed Snow Parameters</h3>

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
          <h2 class="font-bold text-2xl scroll-mt-[58px]" id="gauges">
            Gauges
          </h2>
          <section
            id="add-a-gauge"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Add a Gauge</h3>

            <p>
              By default, every project has a Temperature Gauge, but you can
              also add other types of gauges in order to incorporate different
              types of weather data in your project. To add a gauge, press
              Select a Gauge, then select one of the available options.
            </p>
            <p>Gauges you can create are:</p>
            <ul class="flex flex-col gap-2 ml-4">
              <li>Temperature gauge (required)</li>
              <li>Rain gauge</li>
              <li>Snow gauge</li>
              <li>Daytime gauge</li>
            </ul>
            <div
              class="card preset-tonal-warning base-font-color p-4 gap-2 flex flex-col"
            >
              <p>
                You can only add a gauge if the weather data contains that
                gauge’s information. For example, if there is no snow data, you
                won’t be able to add a snow gauge.
              </p>
            </div>
          </section>
          <section
            id="gauge-direction"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Gauge Direction</h3>

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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Range Calculation Methods</h3>

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
            <figure class=" ">
              <table
                class="table-autoborder-surface-950-50 border p-2 rounded-container"
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
            <div
              class="card preset-tonal-warning base-font-color p-4 gap-2 flex flex-col"
            >
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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl scroll-mt-[58px]">Increment Modes</h3>

            <p>
              A range increment is the difference between the highest and lowest
              values in a range.
            </p>
            <ul class="flex flex-col gap-2 ml-4">
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
            <div
              class="card preset-tonal-warning base-font-color p-4 gap-2 flex flex-col"
            >
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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Adjust Ranges</h3>

            <p>
              To adjust an individual color’s range: select the Range; adjust
              the From and To values using the input fields, plus and minus
              buttons, or the range sliders; then press Save Range.
            </p>
          </section>
          <h2 class="font-bold text-2xl scroll-mt-[58px]" id="colors">
            Color Tools
          </h2>
          <section
            id="preset-colors"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Preset Colors</h3>

            <p>
              To browse collection of preset colors to use in your project,
              press Browse Palettes. Then select a Category and change the
              filters to see different color combinations. Select the palette to
              use it in your project. The categories are as follows:
            </p>
            <ul class="flex flex-col gap-2 ml-4">
              <li>
                <span class="font-bold">All</span> – User-made color palettes
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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Image Palette</h3>

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
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Import/Export</h3>

            <p>
              To import a color palette, press Import / Export, type color names
              or paste a valid code or URL, then press Use These Colors.
            </p>
            <p>
              To export a color palette, press Import / Export, then press Copy
              Palette Code. Share or paste the copied text somewhere you can
              find it later.
            </p>
          </section>
          <section
            id="sort-colors"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Sort Colors</h3>

            <p>
              To move a color in a palette, press the drag icon on the color and
              drag it to a new position in your gauge. You can also sort colors
              by pressing the Sort button, then choosing an option to sort all
              the colors by lightness or name. You can also reverse all the
              colors by pressing Reverse.
            </p>
          </section>
          <h2 class="font-bold text-2xl scroll-mt-[58px]" id="yarn">Yarn</h2>
          <div
            class="card preset-tonal-warning base-font-color p-4 gap-2 flex flex-col"
          >
            <p>
              Real yarn colors will look different than what’s on the screen.
              Any trademarked yarn or colorway details are owned by their
              respective companies. Results are not sponsored, but items
              purchased through some links (marked with a shopping bag icon next
              to the link) may earn the developer of this site a percentage of
              the sale at no additional cost to you. Colors may be inaccurate,
              and may not represent yarn as it appears in physical reality.
              Requests for yarn to be included in these results can be made by
              anyone using <a class="link" href="/yarn-search-request"
                >this request form.</a
              >
            </p>
          </div>
          <section
            id="getting-yarn-colorway-data"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Getting Yarn Colorway Data</h3>

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
                webpage is saved in a database which this web apps uses to
                display the colorway data.
              </li>
            </ol>
          </section>
          <section
            id="choose-yarn-colorways"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Choose Yarn Colorways</h3>

            <p>
              To pick yarn colorways to use in your project, press the Choose
              Colorways button. Select the colorways you want to use, choose to
              add them to your existing palette or to create a new palette, then
              press Use These Colorways.
            </p>
          </section>
          <section
            id="link-unavailable"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Link Unavailable</h3>

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
          <h2 class="font-bold text-2xl scroll-mt-[58px]" id="preview">
            Preview
          </h2>
          <section
            id="create-a-preview"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Create a Preview</h3>

            <p>
              To view and customize what your project might look like, select a
              Pattern Type and adjust the settings. These are the different
              pattern types which you can use to customize your preview:
            </p>
            <ul class="flex flex-col gap-2 ml-4">
              <li>
                <span class="font-bold">Calendar</span> – Squares are arranged in
                a calendar-like grid, grouped by month.
              </li>
              <li>
                <span class="font-bold">Chevrons</span> – Zig-zag rows of stitches
              </li>
              <li>
                <span class="font-bold">Continuous Square</span> – Starting from
                the center, stitches are added in a clockwise square pattern. Possible
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
                <span class="font-bold">Split Month Squares</span> – Each square
                represents one month. Each round in a square represents one day,
                starting with the first of the month in the center of the square.
                Each round is split in half to represent two different weather parameters.
                Months with fewer days have extra rounds added, so that each square
                has the same number of rounds.
              </li>
              <li>
                <span class="font-bold">Squares</span> – Each square represents one
                day.
              </li>
            </ul>
            <div
              class="card preset-tonal-warning base-font-color p-4 gap-2 flex flex-col"
            >
              <p>
                The project preview might not look like a real crochet or
                knitted item. It is only meant to give you an idea of using the
                colors and pattern type. Patterns are not provided.
              </p>
            </div>
          </section>
          <h2 class="font-bold text-2xl scroll-mt-[58px]" id="gallery">
            Gallery
          </h2>
          <section
            id="share-to-gallery"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Share to Gallery</h3>

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
            <div
              class="card preset-tonal-warning base-font-color p-4 gap-2 flex flex-col"
            >
              <p>
                Project Gallery Pages can’t be edited once they are submitted to
                the gallery. If you want to make a change to your Project
                Gallery Page, edit the original project, then submit a new
                Gallery Page.
              </p>
            </div>
          </section>

          <h2 class="font-bold text-2xl scroll-mt-[58px]" id="download">
            Download
          </h2>
          <section
            id="download-gauges-and-weather-data-pdf"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">
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
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
                    ><td class="kbd">d</td><td>Open Download Menu</td></tr
                  ></tbody
                >
              </table>
            </figure>
          </section>
          <section
            id="download-weather-data-csv"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Download Weather Data (CSV)</h3>
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
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
                    ><td class="kbd">d</td><td>Open Download Menu</td></tr
                  ></tbody
                >
              </table>
            </figure>
          </section>
          <section
            id="download-preview-image-png"
            class="scroll-mt-[58px] card bg-surface-200-800 p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Download Preview Image (PNG)</h3>
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
                    class="flex flex-flow gap-2 justify-between items-center w-full font-bold border-surface-950-50 border p-2 rounded-container"
                    ><td class="kbd">d</td><td>Open Download Menu</td></tr
                  ></tbody
                >
              </table>
            </figure>
          </section>
        </div>
        <div
          class="hidden self-start w-1/5 min-w-[200px] h-auto sm:inline-block sticky top-16"
        >
          <TableOfContents class="overflow-y-scroll h-[90vh] px-2" />
        </div>
      </div>
    </main>
  {/snippet}
</AppShell>
