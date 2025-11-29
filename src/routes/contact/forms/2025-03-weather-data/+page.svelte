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
  import { browser, version } from '$app/environment';
  import { page } from '$app/state';
  import {
    PUBLIC_BASE_URL,
    PUBLIC_YARN_SEARCH_REQUEST_FORM_LINK,
  } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { locations, project, toast, weather } from '$lib/state';
  // Supabase is only needed when collecting debugging diagnostics
  // import { supabase } from '$lib/supabaseClient';
  import {
    dateToISO8601String,
    dateToISO8601StringVersion2,
    stringToDate,
    stringToDateVersion2,
  } from '$lib/utils';
  import {
    ArrowLeftIcon,
    ChevronDownIcon,
    ExternalLinkIcon,
    InfoIcon,
    XIcon,
  } from '@lucide/svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import { safeSlide } from '$lib/transitions/safeSlide';

  let accordionValue = $state(['apr20']);

  let includeDebugInfo = $state(true);

  let dataShifted = $state(false);

  let otherIssue = $state(false);

  let projectLink = $state('');

  let projectLinkURL = $derived(getProjectLinkURL(projectLink));

  let params = $derived(browser ? page.url.searchParams : null);

  let statusExpanded = $state(false);

  let projectLinkURLPart = $derived(
    projectLinkURL?.searchParams.has('project')
      ? `${projectLinkURL?.search}${projectLinkURL?.hash}`
      : null,
  );

  let submitting = $state(false);

  function getProjectLinkURL(projectLink) {
    try {
      return new URL(projectLink);
    } catch (error) {
      return null;
    }
  }

  async function submitForm(event) {
    event.preventDefault();
    submitting = true;

    const formData = new FormData(event.target);

    // Convert FormData to a JSON object
    const jsonObject = Object.fromEntries(formData.entries());

    const res = await fetch(PUBLIC_YARN_SEARCH_REQUEST_FORM_LINK, {
      method: 'POST',
      body: JSON.stringify(jsonObject),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    submitting = false;

    if (res.ok) {
      toast.trigger({
        message: 'Thanks, feedback sent successfully!',
        category: 'success',
      });
    } else {
      toast.trigger({
        message: 'Sending failed, please try again later.',
        category: 'error',
      });
    }

    // Uncomment for temporary debugging diagnostics
    // Make sure the Supabase instance is running
    // if (!dev)
    //   await supabase.from('Weather Data Feedback').insert({
    //     dev,
    //     version,
    //     flag: true,
    //     pid: +project.timeStampId || 0,
    //     details: {
    //       form: {
    //         a_stringToDate: stringToDate('2025-01-01'),
    //         b_stringToDateVersion2: stringToDateVersion2('2025-01-01'),
    //         c_dateToISO8601String: {
    //           stringToDate: dateToISO8601String(stringToDate('2025-01-01')),
    //           stringToDateVersion2: dateToISO8601String(
    //             stringToDateVersion2('2025-01-01'),
    //           ),
    //         },
    //         e_dateToISO8601StringVersion2: {
    //           stringToDate: dateToISO8601StringVersion2(
    //             stringToDate('2025-01-01'),
    //           ),
    //           stringToDateVersion2: dateToISO8601StringVersion2(
    //             stringToDateVersion2('2025-01-01'),
    //           ),
    //         },
    //         jsonObject,
    //       },
    //     },
    //   });
  }

  $effect(() => {
    if (!browser) return;
    if (locations.allValid && locations.all.length && project.url.hash)
      projectLink = project.url.href;
    else if (page.url.searchParams.has('projectURL')) {
      projectLink = page.url.searchParams.get('projectURL');
    }
  });
</script>

<svelte:head>
  <title>Weather Data Feedback Form</title>
  <meta name="description" content="Weather Data Feedback Form" />

  <meta property="og:title" content="Weather Data Feedback Form " />
  <meta
    property="og:description"
    content="Report issues and feedback and weather data"
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/2025-03-weather-data" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Weather Data Feedback Form">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="mx-auto flex max-w-screen-sm flex-col gap-4 px-4 pt-4 pb-8 lg:px-0"
    >
      <a href="/contact" class="btn hover:preset-tonal w-fit"
        ><ArrowLeftIcon /> Contact</a
      >
      <div class="">
        <h2 class="h2">Weather Data Feedback Form</h2>
      </div>

      <p>
        Fill out the form below if you've noticed something wrong with weather
        data on temperature-blanket.com, or to give feedback.
      </p>

      <div id="info" class="scroll-mt-[58px]"></div>

      <div class="mb-4 flex flex-col items-start justify-between gap-4">
        <div class="bg-warning-50-950/50 rounded-container">
          <Expand bind:isExpanded={statusExpanded} label="Status Updates" />
        </div>

        {#if statusExpanded}
          <Accordion
            value={accordionValue}
            onValueChange={(e) => (accordionValue = e.value)}
            collapsible
            multiple
            class="bg-warning-50-950/50 rounded-container"
          >
            <Accordion.Item value="apr20" class="font-bold">
              <h3>
                <Accordion.ItemTrigger
                  class="flex items-center justify-between gap-2 font-bold"
                >
                  <InfoIcon />
                  April 20, 2025
                  <Accordion.ItemIndicator class="group">
                    <ChevronDownIcon
                      class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                    />
                  </Accordion.ItemIndicator>
                </Accordion.ItemTrigger>
              </h3>

              <Accordion.ItemContent class="font-normal">
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide={{ duration: 150 }}>
                      Addressing the issue of historical weather data
                      occasionally being adjusted because of model upgrades, an
                      option has been added to the Weather Source settings to
                      choose a more stable weather data model. This is only
                      possible when using Open-Meteo as the weather source. More
                      details about the new options can be found in the <a
                        href="/documentation#weather-sources"
                        target="_blank"
                        class="link">documentation</a
                      >.

                      <br />
                      <br />
                      Using the new models (ERA5 Land and ERA5) is in beta status—you
                      can use them, and weather data theoretically should not be
                      adjusted over time, but they have not been thoroughly tested
                      on this site. I'd love to hear your feedback about the new
                      weather models, especially if the new ERA5 Land and ERA5 models
                      provide any weather data that gets adjusted over time.
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>

            <Accordion.Item value="apr2" class="font-bold">
              <h3>
                <Accordion.ItemTrigger
                  class="flex items-center justify-between gap-2 font-bold"
                >
                  <InfoIcon />
                  April 2, 2025
                  <Accordion.ItemIndicator class="group">
                    <ChevronDownIcon
                      class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                    />
                  </Accordion.ItemIndicator>
                </Accordion.ItemTrigger>
              </h3>

              <Accordion.ItemContent class="font-normal">
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide={{ duration: 150 }}>
                      After the April 1 update, there was another report of
                      off-by-one weather data date issues. The issue was
                      identified and fixed (<a
                        href="/changelog#5.2.35"
                        target="_blank"
                        class="link">see the changelog for details</a
                      >).
                      <br />
                      <br />
                      I'm sorry for all these recent changes. Fixing one issue has
                      seemed to cause other issues for other users. I believe the
                      source of the issues is how the web app handles dates in relation
                      to the user's timezone (and I can't test every timezone). So
                      in the latest update I've switch back to using UTC time for
                      dates (which is timezone independent), and implemented different
                      fixes for issues that the first implementation of using UTC
                      had (in v5.2.2, I believe).
                      <br />
                      <br />
                      If you are still seeing a problem with the weather data, please
                      fill out the form below. It really helps!
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>
            <Accordion.Item value="apr1" class="font-bold">
              <h3>
                <Accordion.ItemTrigger
                  class="flex items-center justify-between gap-2 font-bold"
                >
                  <InfoIcon />
                  April 1, 2025
                  <Accordion.ItemIndicator class="group">
                    <ChevronDownIcon
                      class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                    />
                  </Accordion.ItemIndicator>
                </Accordion.ItemTrigger>
              </h3>

              <Accordion.ItemContent class="font-normal">
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide={{ duration: 150 }}>
                      Between March 28 and April 1, there were several more
                      reports of off-by-one weather data date issues. With the
                      help of a supporter, I believe we identified and fixed the
                      issue (<a
                        href="/changelog#5.2.33"
                        target="_blank"
                        class="link">see the changelog for details</a
                      >). If you are still seeing a problem with the weather
                      data, please fill out the form below.
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>
            <Accordion.Item value="mar28" class="font-bold">
              <h3>
                <Accordion.ItemTrigger
                  class="flex items-center justify-between gap-2 font-bold"
                >
                  <InfoIcon />
                  March 28, 2025
                  <Accordion.ItemIndicator class="group">
                    <ChevronDownIcon
                      class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                    />
                  </Accordion.ItemIndicator>
                </Accordion.ItemTrigger>
              </h3>

              <Accordion.ItemContent class="font-normal">
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide={{ duration: 150 }}>
                      The notice above the weather table about possible dates
                      shifting has been taken down, since I believe the issue
                      has been resolved. If you are still seeing a problem with
                      the weather data, please fill out the form below.
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>
            <Accordion.Item value="mar27" class="font-bold">
              <h3>
                <Accordion.ItemTrigger
                  class="flex items-center justify-between gap-2 font-bold"
                >
                  <InfoIcon />
                  March 27, 2025
                  <Accordion.ItemIndicator class="group">
                    <ChevronDownIcon
                      class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                    />
                  </Accordion.ItemIndicator>
                </Accordion.ItemTrigger>
              </h3>

              <Accordion.ItemContent class="font-normal">
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide={{ duration: 150 }}>
                      An update was applied that hopefully fixes the
                      dates-shifting issue. If you are still seeing issues,
                      please fill out the form below.
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>
            <Accordion.Item value="info" class="font-bold">
              <h3>
                <Accordion.ItemTrigger
                  class="flex items-center justify-between gap-2 font-bold"
                >
                  <InfoIcon />
                  March 26, 2025
                  <Accordion.ItemIndicator class="group">
                    <ChevronDownIcon
                      class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                    />
                  </Accordion.ItemIndicator>
                </Accordion.ItemTrigger>
              </h3>

              <Accordion.ItemContent class="font-normal">
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide={{ duration: 150 }}>
                      On March 20, 2025, temperature-blanket.com was updated to
                      a new version (<a
                        href="/blog/2025-03-20-version-5"
                        class="link"
                        target="_blank">see this blog post for more details</a
                      >). Since then, and through a series of successive updates
                      over the next several days, some users have reported
                      weather data for their project has shifted—it's off by one
                      day. This issue appears to be ongoing for some users.
                      <br />
                      <br />
                      A separate but possibly related issue also occurred during
                      the site update on March 20, where weather data for some projects
                      changed—different temperatures were reported. I believe this
                      issue was fixed on March 24, 2025 (<a
                        href="/changelog#5.2.2"
                        target="_blank"
                        class="link">see the changelog for details</a
                      >).
                      <br />
                      <br />
                      A third factor involved is that the sources temperature-blanket.com
                      uses to get weather data (<a
                        href="https://open-meteo.com/"
                        target="_blank"
                        class="link">Open-Meteo</a
                      >
                      and
                      <a
                        href="https://meteostat.net"
                        target="_blank"
                        class="link">Meteostat</a
                      >) sometimes update their weather models. This can cause
                      weather data, even historical data, to change. Currently,
                      temperature-blanket.com doesn't have any way of detecting
                      or notifying users when the models get updated. This is
                      known issue that has been present from the beginning in
                      2021.
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion>
        {/if}
      </div>

      <div class="">
        Before filling out the form, please confirm you have tried using the
        latest version of
        <a href="https://temperature-blanket.com" target="_blank" class="link"
          >temperature-blanket.com</a
        >
        by refreshing the page for your project. The latest version is currently
        v{version}.
      </div>

      <p>
        All fields are optional, but I would appreciate as much information as
        you are willing to provide.
      </p>
      <form
        onsubmit={submitForm}
        enctype="multipart/form-data"
        class="m-2 mb-4 flex flex-col gap-6"
      >
        <div>
          <label for="projectLink" class="label">Link to your project </label>
          <div class="input-group grid-cols-[1fr_auto]">
            <input
              id="projectLink"
              class="ig-input"
              bind:value={projectLink}
              type="text"
              name="projectLink"
              placeholder="Your Project URL"
            />
            <button
              class="ig-btn preset-filled"
              title="Clear"
              onclick={(e) => {
                e.preventDefault();
                projectLink = '';
              }}
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>

        <p class="font-bold">What issue are you having?</p>

        <label for="dataShifted" class="flex items-center space-x-2">
          <input
            id="dataShifted"
            class="checkbox"
            type="checkbox"
            name="dataShifted"
            bind:checked={dataShifted}
          />
          <p>The weather data has shifted</p>
        </label>

        {#if dataShifted}
          <label for="frequencyShifted" class="label">
            How often does this happen?
            <select
              class="select whitespace-pre-wrap"
              id="frequencyShifted"
              name="frequencyShifted"
            >
              <option value="every">Every time I open my project</option>
              <option value="sparingly"
                >It happened once or twice, but now it's back to normal</option
              >
              <option value="certain-times"
                >At certain times of the day (e.g. only when loading my project
                in the evening or the morning)</option
              >
              <option value="other">Other (comment below)</option>
            </select>
          </label>

          <label for="sameDates" class="label">
            <p>Are the following two dates the same?</p>
            <div class="grid grid-cols-2 items-center gap-2 text-center">
              <p class="bg-surface-50-950 rounded-container p-2">
                {dateToISO8601String(stringToDate('2025-01-01'))}
              </p>
              <p class="bg-surface-50-950 rounded-container p-2">
                {dateToISO8601String(stringToDateVersion2('2025-01-01'))}
              </p>
            </div>
            <select
              class="select whitespace-pre-wrap"
              id="sameDates"
              name="sameDates"
            >
              <option value="yes">Yes, they are the same date</option>
              <option value="no">No, they are different dates</option>
            </select>
          </label>

          <div
            class="card rounded-container bg-surface-100-900 flex flex-col gap-4 p-4"
          >
            <p class="text-lg font-bold">
              If you are willing, would you take a few moments now to test
              opening your project using a previous version of
              temperature-blanket.com, to see if the issue persists?
            </p>
            <ul class="flex list-inside list-decimal flex-col gap-2">
              <li>
                <a
                  href="https://archive-v4.temperature-blanket.com{projectLinkURLPart ||
                    ''}"
                  class="link"
                  target="_blank"
                  >Click here to open the archived version at
                  archive-v4.temperature-blanket.com
                  <ExternalLinkIcon class="relative -top-[2px] inline size-4" />
                </a>
              </li>
              {#if !projectLinkURLPart}
                <li>
                  Enter your project's location and dates. If your project isn't
                  using the default weather source, also change the weather
                  source.
                </li>
              {/if}
              <li>
                Press the Search button to get weather data, and compare the
                weather data results with your current project.
              </li>
            </ul>

            <label for="description" class="label">
              If you tested the archived version, what was the result?
              <textarea
                id="archiveResult"
                class="textarea"
                name="archiveResult"
                rows="5"
                placeholder="e.g. When I used the archived version, the weather data was back to normal; it was not shifted."
              ></textarea>
            </label>
          </div>
        {/if}

        <label for="otherIssue" class="flex items-center space-x-2">
          <input
            id="otherIssue"
            class="checkbox"
            type="checkbox"
            name="otherIssue"
            bind:checked={otherIssue}
          />
          <p>A different issue</p>
        </label>

        {#if otherIssue}
          <label for="description" class="label">
            Describe the issue, as well as any steps taken beforehand
            <textarea
              id="description"
              class="textarea"
              name="description"
              rows="5"
              placeholder="e.g. I open my project from it's saved URL. After I get the weather data and look at the table, the weather data changed from what it used to be."
            ></textarea>
          </label>
        {/if}

        <label for="comments" class="label">
          Any other comments
          <textarea
            id="comments"
            class="textarea"
            name="comments"
            rows="5"
            placeholder="e.g. this feature works really well, but this features does not work well. I also have some ideas about how to improve this feature."
          ></textarea>
        </label>

        <!-- File Input -->
        <label class="label">
          Attach any relevant images or screenshots (5MB max)
          <input
            type="file"
            class="input"
            name="attachment"
            accept="image/png, image/jpeg"
          />
        </label>

        <div>
          <ToggleSwitch
            bind:checked={includeDebugInfo}
            label="Include Debug Information"
            details="Debug information includes device timezone, web app version and details, and current project details (if opened) which are used to help diagnose issues."
          />
        </div>

        <label for="your-email" class="label">
          Your email (if you're interested in further communication)
          <input
            id="your-email"
            class="input"
            type="email"
            name="email"
            placeholder="Your Email"
          />
        </label>
        <label for="your-name" class="label">
          Your name (if you're interested in further communication)
          <input
            id="your-name"
            class="input"
            type="name"
            name="name"
            placeholder="Your Name"
          />
        </label>

        <button
          disabled={submitting}
          class={[
            'btn btn-lg w-fit shadow-sm',
            submitting
              ? 'preset-filled-primary-50-950'
              : 'preset-filled-primary-500',
          ]}
          type="submit"
        >
          {#if submitting}
            <Spinner size="24" /> Sending Report
          {:else}
            Send Report
          {/if}
        </button>

        <input type="hidden" name="_captcha" value="false" />

        <input type="text" name="_honey" style="display:none" />

        {#if includeDebugInfo}
          <input
            type="hidden"
            name="timezone"
            value={Intl.DateTimeFormat().resolvedOptions().timeZone}
          />
          <input type="hidden" name="version" value={version} />

          <input type="hidden" name="projectURL" value={project.url.href} />

          <input
            type="hidden"
            name="loaded"
            value={encodeURIComponent(
              JSON.stringify(
                $state.snapshot(
                  locations.all.map((n) => n.wasLoadedFromSavedProject),
                ),
              ),
            )}
          />
          <input
            type="hidden"
            name="stringToDate"
            value={encodeURIComponent(
              JSON.stringify(stringToDate('2025-01-01')),
            )}
          />
          <input
            type="hidden"
            name="stringToDateVersion2"
            value={encodeURIComponent(
              JSON.stringify(stringToDateVersion2('2025-01-01')),
            )}
          />
          <input
            type="hidden"
            name="dateToISO8601String_stringToDate"
            value={encodeURIComponent(
              JSON.stringify(dateToISO8601String(stringToDate('2025-01-01'))),
            )}
          />
          <input
            type="hidden"
            name="dateToISO8601String_stringToDateVersion2"
            value={encodeURIComponent(
              JSON.stringify(
                dateToISO8601String(stringToDateVersion2('2025-01-01')),
              ),
            )}
          />
          <input
            type="hidden"
            name="dateToISO8601StringVersion2_stringToDate"
            value={encodeURIComponent(
              JSON.stringify(
                dateToISO8601StringVersion2(stringToDate('2025-01-01')),
              ),
            )}
          />
          <input
            type="hidden"
            name="dateToISO8601StringVersion2_stringToDate2"
            value={encodeURIComponent(
              JSON.stringify(
                dateToISO8601StringVersion2(stringToDateVersion2('2025-01-01')),
              ),
            )}
          />

          {#if browser}
            <input type="hidden" name="pageURL" value={params.get('pageURL')} />

            <input type="hidden" name="data0" value={params.get('data0')} />

            <input type="hidden" name="table0" value={params.get('table0')} />
          {/if}

          {#if weather.data.length}
            <input
              type="hidden"
              name="weatherData(first3)"
              value={JSON.stringify(weather.data.slice(0, 2))}
            />
          {/if}
        {/if}
      </form>
    </main>
  {/snippet}
</AppShell>
