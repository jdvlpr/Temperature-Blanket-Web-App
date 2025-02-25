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
  import Card from '$lib/components/Card.svelte';

  let checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline text-success-500">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
`;
  let xIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline text-error-500">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
`;
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
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="max-w-(--breakpoint-md) m-auto text-left flex flex-col gap-2 mb-4 mx-auto px-2"
    >
      <div
        class="p-4 text-left flex flex-wrap justify-center items-end gap-4 rounded-container bg-surface-50-950"
      >
        <p>
          Making a request for a yarn to be included in the search results does
          not guarantee its inclusion. Requests will be processed based the
          order the request was received, the availability of the yarn, and the
          web app developer’s schedule.
        </p>
        <div class="flex flex-wrap gap-4">
          <div class="flex flex-col gap-2 card p-4">
            <p class="font-bold">Do Request</p>
            <p>
              {@html checkIcon} Yarn with solid or single-color colorways
            </p>
            <p>
              {@html checkIcon} Yarn for which a public webpage featuring images
              and names of every colorway is available
            </p>
            <p>
              {@html checkIcon} A suggestion for correcting or updating existing
              yarn colorways on temperature-blanket.com
            </p>
          </div>
          <div class="flex flex-col gap-2 card p-4">
            <p class="font-bold">Do Not Request</p>
            <p>
              {@html xIcon} Yarn with all variegated or multi-colored colorways*
            </p>
            <p>
              {@html xIcon} Custom-dyed yarn
            </p>
            <p>
              {@html xIcon} Yarn which is only available for a limited time or in
              limited quantities
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
            class="flex flex-col gap-4 m-2 mb-4"
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
                class="label flex items-start flex-col max-w-(--breakpoint-sm)"
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
