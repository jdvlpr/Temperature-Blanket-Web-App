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
  import {
    PUBLIC_BASE_URL,
    PUBLIC_YARN_SEARCH_REQUEST_FORM_LINK,
  } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { ArrowLeftIcon, CircleCheckIcon, CircleMinusIcon } from '@lucide/svelte';
</script>

<svelte:head>
  <title>Request Yarn Colorways</title>
  <meta
    name="description"
    content="Request yarn colorways to be added to the site."
  />

  <meta property="og:title" content="Request Yarn Colorways" />
  <meta
    property="og:description"
    content="Request yarn colorways to be added to the site."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/yarn-search-request" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Request Yarn Colorways">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="m-auto mx-auto lg:mt-4 mb-4 flex max-w-(--breakpoint-md) flex-col gap-4 px-2 text-left"
    >
    <a href="/contact" class="btn hover:preset-tonal w-fit max-lg:mt-2"
        ><ArrowLeftIcon /> Contact</a
      >

    <h2 class="h2 text-gradient ">Request Yarn Colorways</h2>
      <div
        class="rounded-container bg-surface-50-950 flex flex-wrap items-end justify-center gap-2 p-4 text-left"
      >
        <p>
          Making a request for a yarn to be included in the search results does
          not guarantee its inclusion. Requests will be processed based the
          order the request was received, the availability of the yarn, and the
          web app developer’s schedule.
        </p>
        <div class="flex flex-wrap gap-2">
          <div class="card flex flex-col gap-2 p-4">
            <p class="font-bold">Do Request</p>
            <p>
              <CircleCheckIcon
                class="inline"
                style="color:var(--color-success-500)"
              /> Yarn with solid or single-color colorways
            </p>
            <p>
              <CircleCheckIcon
                class="inline"
                style="color:var(--color-success-500)"
              /> Yarn for which a public webpage featuring images and names of every
              colorway is available
            </p>
            <p>
              <CircleCheckIcon
                class="inline"
                style="color:var(--color-success-500)"
              /> A suggestion for correcting or updating existing yarn colorways
              on temperature-blanket.com
            </p>
          </div>
          <div class="card flex flex-col gap-2 p-4">
            <p class="font-bold">Do Not Request</p>
            <p>
              <CircleMinusIcon
                class="inline"
                style="color:var(--color-error-500)"
              /> Yarn with all variegated or multi-colored colorways*
            </p>
            <p>
              <CircleMinusIcon
                class="inline"
                style="color:var(--color-error-500)"
              /> Custom-dyed yarn
            </p>
            <p>
              <CircleMinusIcon
                class="inline"
                style="color:var(--color-error-500)"
              /> Yarn which is only available for a limited time or in limited quantities
            </p>
          </div>
        </div>
        <p class="text-sm">
          *Variegated colorways cannot be processed; only yarn colorways of a
          single color can be included in the search results. If a yarn has
          variegated colorways as well as solid colorways, only solid colorways
          will be considered.
        </p>
      </div>
      <div>
        {#if PUBLIC_YARN_SEARCH_REQUEST_FORM_LINK}
          <form
            action={PUBLIC_YARN_SEARCH_REQUEST_FORM_LINK}
            method="POST"
            class="m-2 mb-4 flex flex-col gap-4"
          >
            <div class="tex-left flex flex-col items-start gap-1">
              <label for="brand-name" class="label flex items-center"
                >Brand Name</label
              >
              <input
                id="brand-name"
                class="input"
                type="text"
                name="brandName"
                placeholder="Brand Name"
                required
              />
            </div>

            <div class="tex-left flex flex-col items-start gap-1">
              <label for="yarn-name" class="label flex items-center"
                >Yarn Name</label
              >
              <input
                id="yarn-name"
                class="input"
                type="text"
                name="yarnName"
                placeholder="Yarn Name"
                required
              />
            </div>

            <div class="tex-left flex flex-col items-start gap-1">
              <label
                for="web-address"
                class="label flex max-w-(--breakpoint-sm) flex-col items-start"
              >
                Web Address
                <span class="text-sm"
                  >Please include a URL to the brand's own webpage for the yarn.
                  The webpage should contain the yarn's details including images
                  and names of its colorways.</span
                >
              </label>
              <input
                id="web-address"
                class="input"
                type="url"
                name="webAddress"
                placeholder="Web Address"
                required
              />
            </div>

            <div class="tex-left flex flex-col items-start gap-1">
              <label for="other-comments" class="label">Other Comments </label>
              <textarea
                id="other-comments"
                class="textarea"
                name="otherComments"
                placeholder="Other Comments"
              ></textarea>
            </div>

            <div class="tex-left flex flex-col items-start gap-1">
              <label for="your-email" class="label flex items-center"
                >Your email (if you want a reply)</label
              >
              <input
                id="your-email"
                class="input"
                type="email"
                name="email"
                placeholder="Your Email"
              />
            </div>

            <button
              class="btn preset-filled-primary-500 w-fit shadow-sm"
              type="submit">Send Yarn Request</button
            >

            <p>Expect up to a few weeks for your request to be processed.</p>

            <input
              type="hidden"
              name="_next"
              value="{PUBLIC_BASE_URL}/yarn-search-request/thank-you"
            />
            <input
              type="hidden"
              name="_subject"
              value="Yarn Search Request Response"
            />
          </form>
        {:else}
          <p class="italic">
            Developer message: missing yarn search request form link.
          </p>
        {/if}
      </div>
    </main>
  {/snippet}
</AppShell>
