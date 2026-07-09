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

<script>
  import { PUBLIC_BASE_DOMAIN_NAME, PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { ChevronDownIcon, CircleQuestionMarkIcon } from '@lucide/svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';

  let value = $state(['club']);

  let isExpandedRevealInstructions = $state(false);
</script>

<svelte:head>
  <title>FAQ</title>
  <meta name="description" content="Frequently Asked Questions" />

  <meta property="og:title" content="Frequently Asked Questions" />
  <meta property="og:description" content="Frequently Asked Questions" />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/faq" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="FAQ">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="mx-auto mb-8 flex max-w-(--breakpoint-md) flex-col gap-4 px-2 lg:px-0"
    >
      <div>
        <h2 class="h2 text-gradient my-2">Frequently Asked Questions</h2>
        <section id="faq" class="flex flex-col gap-4">
          <Accordion
            {value}
            onValueChange={(e) => (value = e.value)}
            multiple
            class="w-full"
          >
            <Accordion.Item value="what-is-temperature-blanket">
              <Accordion.ItemTrigger
                class="flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <CircleQuestionMarkIcon />

                  <p class="font-bold">What is a Temperature Blanket?</p>
                </div>

                <Accordion.ItemIndicator class="group">
                  <ChevronDownIcon
                    class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                  />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>

              <Accordion.ItemContent>
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide>
                      See this blog post: <a
                        href="/blog/what-is-a-temperature-blanket"
                        class="link whitespace-pre-wrap"
                      >
                        What's a Temperature Blanket?</a
                      >
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>
            <Accordion.Item value="weather-data-inaccurate">
              <Accordion.ItemTrigger
                class="flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <CircleQuestionMarkIcon />

                  <p class="font-bold">
                    Why does the weather data change, or why is it inaccurate?
                  </p>
                </div>

                <Accordion.ItemIndicator class="group">
                  <ChevronDownIcon
                    class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                  />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>

              <Accordion.ItemContent>
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide>
                      <p>
                        For recent weather data, it may take up to a week for
                        all the latest data to be available. Older weather data
                        may occasionally change as well. Weather data comes from <a
                          href="https://open-meteo.com/"
                          target="_blank"
                          class="link">Open-Meteo</a
                        >
                        or
                        <a
                          href="https://meteostat.net"
                          target="_blank"
                          class="link">Meteostat</a
                        >. It may take up to a week for their weather models to
                        incorporate the latest data. Older data may also
                        occasionally be updated to include newly obtained data.
                        You can use the information given or check back later
                        for updates.
                      </p>
                      <p>
                        If you don't want to use updated data, you should make
                        sure to
                        <a
                          href="/documentation#download-weather-data-csv"
                          class="link"
                          target="_blank"
                          >download your project's weather data</a
                        >
                        when you first create your project, and then
                        <a
                          href="/documentation#import-weather-data"
                          class="link"
                          target="_blank">import it back into your project</a
                        > if you need. Sorry for any inconvenience.
                      </p>
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>

            <Accordion.Item value="how-do-the-range-values-work">
              <Accordion.ItemTrigger
                class="flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <CircleQuestionMarkIcon />

                  <p class="font-bold">
                    Why do the range values repeat (0 to 10, 10 to 20…), and how
                    can I make them not overlap (0 to 9, 10 to 19…)?
                  </p>
                </div>

                <Accordion.ItemIndicator class="group">
                  <ChevronDownIcon
                    class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                  />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>

              <Accordion.ItemContent>
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide>
                      <p class="">
                        Watch an explanation in the video below (it will start
                        at 8:49).
                      </p>
                      <div class="my-2 w-full">
                        <iframe
                          width="560"
                          height="315"
                          src="https://www.youtube.com/embed/7NRLrpZb0Lo?si=n4fmzlt9_0GKGNad&amp;start=529"
                          title="YouTube video player"
                          frameborder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerpolicy="strict-origin-when-cross-origin"
                          allowfullscreen
                          class="aspect-video h-auto w-full"
                        ></iframe>
                      </div>

                      <p>
                        The default setting will include the first number up to
                        but not including the second number, so there’s not
                        actually any weather value that would be in two ranges
                        at once. To make the range values not overlap, you will
                        need to change the
                        <a
                          class="link"
                          href="/documentation#range-calculation-methods"
                          data-type="internal"
                          data-id="#range-calculation-methods"
                          >range calculation method</a
                        >. If you do, be careful to cover all weather values in
                        your ranges. For example, you might need to use decimals
                        (0 to 9.99, 10 to 19.99, 20 to 29.99…). You can read
                        this
                        <a
                          class="link"
                          rel="noreferrer noopener"
                          href="https://www.reddit.com/r/temperatureblanket/comments/10mliw0/if_a_gauge_says_1115_red_then_1620_blue_which/"
                          target="_blank"
                          >survey and discussion about this on reddit</a
                        > if you want to learn more about what led to the default
                        range behavior.
                      </p>
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>

            <Accordion.Item value="is-there-an-app">
              <Accordion.ItemTrigger
                class="flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <CircleQuestionMarkIcon />

                  <p class="font-bold">Is there an app?</p>
                </div>

                <Accordion.ItemIndicator class="group">
                  <ChevronDownIcon
                    class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                  />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>

              <Accordion.ItemContent>
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide>
                      <p>
                        The website is the app. It's not in the Apple or Google
                        app store, but you can
                        <a
                          href="https://support.google.com/chrome/answer/9658361"
                          target="_blank"
                          class="link"
                          >install {PUBLIC_BASE_DOMAIN_NAME}
                          like an app on your device</a
                        >.
                      </p>
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>

            <Accordion.Item value="is-it-free">
              <Accordion.ItemTrigger
                class="flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <CircleQuestionMarkIcon />

                  <p class="font-bold">Is it free?</p>
                </div>

                <Accordion.ItemIndicator class="group">
                  <ChevronDownIcon
                    class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                  />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>

              <Accordion.ItemContent>
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide>
                      <p>Yep!</p>
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>

            <Accordion.Item value="yarn">
              <Accordion.ItemTrigger
                class="flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <CircleQuestionMarkIcon />

                  <p class="font-bold">
                    Why isn’t the yarn I want to use on this web app?
                  </p>
                </div>

                <Accordion.ItemIndicator class="group">
                  <ChevronDownIcon
                    class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                  />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>

              <Accordion.ItemContent>
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide>
                      <p>
                        Probably because nobody requested it yet!
                        <a
                          class="link"
                          rel="noreferrer noopener"
                          href="/yarn-search-request"
                          data-id="/yarn-search-request"
                          >Read about the requirements and suggest yarn
                          colorways using this form</a
                        >.
                      </p>
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>

            <Accordion.Item value="no-weather">
              <Accordion.ItemTrigger
                class="flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <CircleQuestionMarkIcon />

                  <p class="font-bold">
                    What if there’s no weather data for my location?
                  </p>
                </div>

                <Accordion.ItemIndicator class="group">
                  <ChevronDownIcon
                    class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                  />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>

              <Accordion.ItemContent>
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide>
                      If your location doesn’t have weather data, it means one
                      of the
                      <a
                        class="link"
                        href="/documentation#weather-sources"
                        data-id="#weather-sources">weather sources</a
                      > wasn’t able to provide data for the days or place you requested.
                      You can try changing the dates: select a different year, or
                      make sure no days are in the future. If that doesn’t work, try
                      searching for a different nearby location.
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>
            <Accordion.Item value="specific-date-over-multiple-years">
              <Accordion.ItemTrigger
                class="flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <CircleQuestionMarkIcon />

                  <p class="font-bold">
                    How can I make a temperature blanket project with a specific
                    date over multiple years?
                  </p>
                </div>

                <Accordion.ItemIndicator class="group">
                  <ChevronDownIcon
                    class="h-5 w-5 transition group-data-[state=open]:rotate-180"
                  />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>

              <Accordion.ItemContent>
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide>
                      <p class="mb-2">
                        This web app isn't designed for this specific use-case,
                        so <span class="font-bold text-warning-600-400"
                          >it's not recommended</span
                        >. There is a way you can do it, but it is a tedious
                        process, and you may experience performance issues when
                        searching for weather data. That being said, press
                        <span class="italic">Reveal Instructions</span> below to see
                        how you would go about making a project with a specific date
                        over multiple years (e.g. a blanket showing weather data for
                        March 10 from 1942 to 2026) using the Project Planner on this
                        web app.
                      </p>
                      <Expand
                        bind:isExpanded={isExpandedRevealInstructions}
                        label="Reveal Instructions"
                      />
                      {#if isExpandedRevealInstructions}
                        <ol class="ml-8 mt-2 list-decimal">
                          <li>
                            Enter and select your location, then for the
                            location's duration, choose <span class="italic"
                              >Custom</span
                            >.
                          </li>
                          <li>
                            Set the <span class="italic">From</span> and
                            <span class="italic">To</span> dates to the first date
                            you want to use (e.g. both fields would be set to March
                            10, 1942, for only one day of weather data).
                          </li>
                          <li>
                            Press <span class="italic">Add Location</span>.
                          </li>
                          <li>
                            Enter and select the same location, then repeat
                            steps 2-3 for each year you want to include in your
                            project, changing the <span class="italic"
                              >From</span
                            >
                            and <span class="italic">To</span> dates to the same date
                            in the following year.
                          </li>
                          <li>
                            Once you've added a new location for each year, you
                            can proceed with the rest of the Project Planner as
                            usual. Make sure to save your project so you don't
                            have to set up all the locations again.
                          </li>
                        </ol>
                      {/if}
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion>
        </section>
      </div>
      <p class="my-4">
        If you have other questions not listed here, you can search the <a
          href="/documentation"
          class="link">documentation</a
        >
        or email hello@temperature-blanket.com.
      </p>
    </main>
  {/snippet}
</AppShell>
