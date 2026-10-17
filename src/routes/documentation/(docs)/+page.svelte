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

<!-- Guides & Help's front page: search, getting started, every guide and
reference page, and the common questions (the FAQ was folded in here; /faq
redirects to #common-questions, and its questions keep their ids).
Links to the old single-page documentation (/documentation#weather-sources)
are sent on to where each section is now, replacing the old address so
Back doesn't return to it. -->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { PUBLIC_BASE_DOMAIN_NAME } from '$app/env/public';
  import DocsSearch from '#lib/components/docs/DocsSearch.svelte';
  import { CARD_BOX, CARD_HOVER } from '#lib/constants/class-constants.js';
  import {
    DOCS_TITLE,
    GUIDES,
    OLD_ANCHORS,
    REFERENCE,
    docsHref,
  } from '#lib/docs/docs-index.js';
  import { onMount } from 'svelte';

  onMount(() => {
    const target = OLD_ANCHORS[decodeURIComponent(location.hash.slice(1))];
    if (target && target !== '/documentation')
      goto(target, { replaceState: true });
  });

  const guide = (slug: string) => `/documentation/guides/${slug}`;
</script>

<div class="flex flex-col gap-8" data-pagefind-body>
  <header class="flex flex-col gap-4">
    <h1 class="h2 text-gradient" data-pagefind-meta="title">{DOCS_TITLE}</h1>
    <p class="text-lg opacity-80">
      Step-by-step guides for planning a temperature blanket, and help with
      every part of the site.
    </p>
    <div data-pagefind-ignore>
      <DocsSearch />
    </div>
  </header>

  <section id="getting-started" class="flex flex-col gap-3">
    <h2 class="text-2xl font-bold">Getting Started</h2>
    <p>
      The <a href="/" class="link">Project Planner</a> turns the weather of a place
      and dates into a pattern, one row or square for each day, colored by its weather.
    </p>
    <ol class="ml-6 list-decimal space-y-1">
      <li>Choose a place and the dates your blanket covers.</li>
      <li>Search for the weather.</li>
      <li>
        Make a gauge: the colors of your yarn, and the ranges of weather each
        one stands for.
      </li>
      <li>See your blanket in the preview.</li>
      <li>Save your project, and download the pattern.</li>
    </ol>
    <p>
      You don't need an account. Without one, projects are saved in this
      browser. With one, they're also on every device you sign in on, and you
      can publish to the gallery and post to Ravelry.
    </p>
    <p>
      New here? Start with
      <a href={guide('plan-a-blanket')} class="link"
        >Plan a Blanket, Start to Finish</a
      >.
    </p>
  </section>

  {#each [{ id: 'guides', heading: 'Guides', intro: 'Step by step, for the things people most often want to do.', pages: GUIDES }, { id: 'reference', heading: 'Reference', intro: 'Every part of the site, and what each option does.', pages: REFERENCE }] as { id, heading, intro, pages } (id)}
    <section {id} class="flex flex-col gap-3" data-pagefind-ignore>
      <h2 class="text-2xl font-bold">{heading}</h2>
      <p class="opacity-80">{intro}</p>
      <ul class="grid gap-2 sm:grid-cols-2">
        {#each pages as page (page.slug)}
          <li class="flex">
            <a
              href={docsHref(page)}
              class={[CARD_BOX, CARD_HOVER, 'flex w-full flex-col gap-1 px-3']}
            >
              <span class="font-bold">{page.title}</span>
              <span class="text-sm opacity-80">{page.summary}</span>
            </a>
          </li>
        {/each}
      </ul>
    </section>
  {/each}

  <section id="common-questions" class="flex flex-col gap-4">
    <h2 class="text-2xl font-bold">Common Questions</h2>

    <div id="what-is-temperature-blanket" class="space-y-1">
      <h3 class="font-bold">What is a temperature blanket?</h3>
      <p>
        A blanket that records the weather: each row or square is one day, in
        the color of that day's temperature (or rain, snow or daylight).
        <a href="/blog/what-is-a-temperature-blanket" class="link"
          >More about temperature blankets</a
        >.
      </p>
    </div>

    <div id="weather-data-inaccurate" class="space-y-1">
      <h3 class="font-bold">Why does the weather change, or look wrong?</h3>
      <p>
        The newest days can take up to a week to be complete, and older days are
        sometimes corrected. The weather also comes from a station or model near
        you, so it can differ from your own thermometer.
        <a href={guide('weather-doesnt-match')} class="link"
          >What to do about it</a
        >.
      </p>
    </div>

    <div id="how-do-the-range-values-work" class="space-y-1">
      <h3 class="font-bold">
        Why do the range numbers repeat (0 → 10, 10 → 20…)?
      </h3>
      <p>
        By default, each range includes its first number but not its last, so a
        day is never in two ranges: 10° is in 10 → 20, not 0 → 10. You can
        change which ends a range includes.
        <a href={guide('choose-ranges')} class="link">How ranges work</a>.
      </p>
    </div>

    <div id="no-weather" class="space-y-1">
      <h3 class="font-bold">What if there's no weather for my place?</h3>
      <p>
        Try other dates (no days in the future), a nearby place, or the other
        weather source. You can also import weather you have yourself.
        <a href={guide('weather-doesnt-match')} class="link">More help</a>.
      </p>
    </div>

    <div id="specific-date-over-multiple-years" class="space-y-1">
      <h3 class="font-bold">
        Can I make a blanket of one date over many years?
      </h3>
      <p>
        Yes, like a birthday in every year since you were born, though it takes
        some setting up.
        <a href={guide('same-date-several-years')} class="link">Here's how</a>.
      </p>
    </div>

    <div id="yarn" class="space-y-1">
      <h3 class="font-bold">Why isn't the yarn I want here?</h3>
      <p>
        Probably because nobody has asked for it yet!
        <a href="/yarn-search-request" class="link"
          >Ask for a yarn to be added</a
        >.
      </p>
    </div>

    <div id="is-there-an-app" class="space-y-1">
      <h3 class="font-bold">Is there an app?</h3>
      <p>
        The website is the app. It's not in the Apple or Google app store, but
        you can
        <a
          href="https://support.google.com/chrome/answer/9658361"
          target="_blank"
          rel="noopener noreferrer"
          class="link">install {PUBLIC_BASE_DOMAIN_NAME} like an app</a
        > on your phone, tablet or computer.
      </p>
    </div>

    <div id="is-it-free" class="space-y-1">
      <h3 class="font-bold">Is it free?</h3>
      <p>Yep!</p>
    </div>

    <p>
      Have another question? <a href="/contact" class="link">Get in touch</a>.
    </p>
  </section>
</div>
