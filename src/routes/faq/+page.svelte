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
  import { PUBLIC_BASE_DOMAIN_NAME, PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
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
  <svelte:fragment slot="stickyHeader">
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  </svelte:fragment>
  <main slot="main" class="max-w-screen-xl px-2 lg:px-0 flex flex-col gap-4">
    <div>
      <h2 class="font-bold text-2xl my-2">Frequently Asked Questions</h2>
      <section
        id="faq"
        class="card variant-soft-surface p-4 flex flex-col gap-4"
      >
        <Accordion>
          <AccordionItem id="weather-data-inaccurate">
            <svelte:fragment slot="lead">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </svelte:fragment>
            <svelte:fragment slot="summary"
              ><p class="font-bold">
                Why does the weather data change, or why is it inaccurate?
              </p></svelte:fragment
            >
            <svelte:fragment slot="content">
              <p>
                For recent weather data, it may take up to a week for all the
                latest data to be available. Older weather data may occasionally
                change as well. Weather data comes from <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  class="link">Open-Meteo</a
                >
                or
                <a href="https://meteostat.net" target="_blank" class="link"
                  >Meteostat</a
                >. It may take up to a week for their weather models to
                incorporate the latest data. Older data may also occasionally be
                updated to include newly obtained data. You can use the
                information given or check back later for updates.
              </p>
              <p>
                If you don't want to use updated data, you should make sure to
                <a
                  href="/documentation#download-weather-data-csv"
                  class="link"
                  target="_blank">download your project's weather data</a
                >
                when you first create your project, and then
                <a
                  href="/documentation#import-weather-data"
                  class="link"
                  target="_blank">import it back into your project</a
                > if you need. Sorry for any inconvenience.
              </p>
            </svelte:fragment>
          </AccordionItem>
          <AccordionItem id="is-there-an-app">
            <svelte:fragment slot="lead">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </svelte:fragment>
            <svelte:fragment slot="summary"
              ><p class="font-bold">Is there an app?</p></svelte:fragment
            >
            <svelte:fragment slot="content">
              <p>
                The website is the app. It's not in the Apple or Google app
                store, but you can
                <a
                  href="https://support.google.com/chrome/answer/9658361"
                  target="_blank"
                  class="link"
                  >install {PUBLIC_BASE_DOMAIN_NAME}
                  like an app on your device</a
                >.
              </p>
            </svelte:fragment>
          </AccordionItem>
          <AccordionItem id="is-it-free">
            <svelte:fragment slot="lead">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </svelte:fragment>
            <svelte:fragment slot="summary"
              ><p class="font-bold">Is it free?</p></svelte:fragment
            >
            <svelte:fragment slot="content">
              <p>Yep!</p>
            </svelte:fragment>
          </AccordionItem>
          <AccordionItem>
            <svelte:fragment slot="lead">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </svelte:fragment>
            <svelte:fragment slot="summary"
              ><p class="font-bold">
                Why do the range values repeat (0 to 10, 10 to 20…), and how can
                I make them not overlap (0 to 9, 10 to 19…)?
              </p></svelte:fragment
            >
            <svelte:fragment slot="content">
              <p>
                The default setting (From ≤ Range &lt; To) will include the
                first number up to but not including the second number, so
                there’s not actually any weather value that would be in two
                ranges at once. To make the range values not overlap, you will
                need to change the
                <a
                  class="link"
                  href="/documentation#range-calculation-methods"
                  data-type="internal"
                  data-id="#range-calculation-methods"
                  >range calculation method</a
                >. If you do, be careful to cover all weather values in your
                ranges. For example, you might need to use decimals (0 to 9.99,
                10 to 19.99, 20 to 29.99…). You can read this
                <a
                  class="link"
                  rel="noreferrer noopener"
                  href="https://www.reddit.com/r/temperatureblanket/comments/10mliw0/if_a_gauge_says_1115_red_then_1620_blue_which/"
                  target="_blank">survey and discussion about this on reddit</a
                > if you want to learn more about what led to the default range behavior.
              </p>
            </svelte:fragment>
          </AccordionItem>
          <AccordionItem>
            <svelte:fragment slot="lead">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </svelte:fragment>
            <svelte:fragment slot="summary"
              ><p class="font-bold">
                Why isn’t the yarn I want to use on this web app?
              </p></svelte:fragment
            >
            <svelte:fragment slot="content">
              <p>
                Probably because nobody requested it yet!
                <a
                  class="link"
                  rel="noreferrer noopener"
                  href="/yarn-search-request"
                  data-id="/yarn-search-request"
                  >Read about the requirements and suggest yarn colorways using
                  this form</a
                >.
              </p>
            </svelte:fragment>
          </AccordionItem>
          <AccordionItem>
            <svelte:fragment slot="lead">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </svelte:fragment>
            <svelte:fragment slot="summary"
              ><p class="font-bold">
                What if there’s no weather data for my location?
              </p></svelte:fragment
            >
            <svelte:fragment slot="content">
              If your location doesn’t have weather data, it means one of the
              <a
                class="link"
                href="/documentation#weather-sources"
                data-id="#weather-sources">weather sources</a
              > wasn’t able to provide data for the days or place you requested.
              You can try changing the dates: select a different year, or make sure
              no days are in the future. If that doesn’t work, try searching for
              a different nearby location.
            </svelte:fragment>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
    <p>
      If you have other questions not listed here, you can search the <a
        href="/documentation"
        class="link">documentation</a
      >
      or email hello@temperature-blanket.com.
    </p>
  </main>
</AppShell>
