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
  import {
    TableOfContents,
    getDrawerStore,
    tocCrawler,
  } from '@skeletonlabs/skeleton';
  const drawerStore = getDrawerStore();
</script>

<svelte:head>
  <title>Yarn Colorways JSON API</title>
  <meta
    name="description"
    content="Find yarn colorways by HTML hex color code."
  />

  <meta property="og:title" content="Yarn Colorways JSON API" />
  <meta
    property="og:description"
    content="Find yarn colorways by HTML hex color code."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/api/yarn-colorways" />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/api-images/yarn-colorways-api.png"
  />
  <meta property="og:image:width" content="1366" />
  <meta property="og:image:height" content="768" />
</svelte:head>

<AppShell pageName="API">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex mx-auto my-1">
      <AppLogo />
    </div>
    <button
      class="btn bg-secondary-hover-token flex items-center sm:hidden"
      title="Open Navigation Sidebar"
      onclick={() =>
        drawerStore.open({
          id: 'documentation',
          position: 'right',
        })}
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
      <img
        src="/images/api-images/yarn-colorways-api.png"
        class="h-56 object-cover w-full rounded-container-token mb-4"
        alt="Yarn Colorways API"
      />
      <div class="pb-4 text-left flex gap-4">
        <div
          use:tocCrawler={{ mode: 'generate' }}
          class="w-full flex flex-col gap-8"
        >
          <div class="flex flex-col gap-4">
            <h2 class="font-bold text-2xl scroll-mt-[58px]">
              Yarn Colorways API
            </h2>
            <section
              class="gap-2 flex flex-col mt-2 lg:mt-0 card variant-soft-secondary p-4 rounded-container-token text-token"
            >
              <p>Find yarn colorways by HTML hex color code.</p>

              <p>
                The <a
                  href="https://rapidapi.com/temperature-blanket-temperature-blanket-default/api/yarn-colorways/"
                  target="_blank"
                  class="link">Yarn Colorways API</a
                >
                is a JSON API providing access to the yarn database from
                {PUBLIC_BASE_DOMAIN_NAME}.
              </p>

              <p>
                Yarn details and HTML hex color codes are added by the developer
                of {PUBLIC_BASE_DOMAIN_NAME}
                at the request of users using
                <a href="/yarn-search-request" class="link">this form</a>.
              </p>
              <p class="">
                HTML hex colors are approximations of fiber colors. Real yarn
                colors will look different than what’s on a screen. Any
                trademarked yarn or colorway details are owned by their
                respective companies.
              </p>
              <p class="">
                The data is provided “as is” and without any guarantees of
                quality, performance, or suitability for any purpose.
              </p>
              <p class="">
                <a href="#terms-and-license" class="link"
                  >See the terms of use and license.</a
                >
              </p>
            </section>
          </div>

          <h2 class="font-bold text-2xl" id="using-the-api">Using the API</h2>

          <section id="sign-up" class="scroll-mt-[58px] gap-2 flex flex-col">
            <h3 class="font-bold text-xl">Sign Up</h3>
            <p class="first-letter:capitalize">
              {PUBLIC_BASE_DOMAIN_NAME} uses
              <a
                href="https://rapidapi.com/temperature-blanket-temperature-blanket-default/api/yarn-colorways/"
                target="_blank"
                class="link">RapidAPI</a
              >
              for delivering the
              <a
                href="https://rapidapi.com/temperature-blanket-temperature-blanket-default/api/yarn-colorways/"
                target="_blank"
                class="link">Yarn Colorways API</a
              >.
            </p>

            <p>
              Access to the API requires users to send their RapidAPI key along
              with every request. <a
                href="https://rapidapi.com/temperature-blanket-temperature-blanket-default/api/yarn-colorways/"
                target="_blank"
                class="link">Create an account</a
              >
              and
              <a
                href="https://rapidapi.com/temperature-blanket-temperature-blanket-default/api/yarn-colorways//pricing"
                target="_blank"
                class="link">subscribe to one of the plans</a
              > to get a key for accessing the Yarn Colorways API. The free plan
              allows up to 500 calls per month.
            </p>
          </section>
          <section
            id="sending-requests"
            class="scroll-mt-[58px] gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Making a Request</h3>
            <p>This is the base URL for all endpoints:</p>
            <p
              class="break-all whitespace-pre-wrap codeblock code text-token p-4 w-fit"
            >
              https://yarn-colorways.p.rapidapi.com/v1
            </p>

            <p>Include the following headers:</p>
            <p
              class="break-all whitespace-pre-wrap codeblock code text-token p-4 w-fit"
            >
              "X-RapidAPI-Key": 'your-rapidapi-key', <br />"X-RapidAPI-Host":
              "yarn-colorways.p.rapidapi.com"
            </p>
            <p>
              All requests should use the <span class="code text-token px-2"
                >GET</span
              > method.
            </p>
          </section>

          <section
            id="reading-a-response"
            class="scroll-mt-[58px] gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Reading a Response</h3>
            <p>
              A successful response will return a JSON object that contains two
              properties: <span class="font-bold">meta</span>
              and
              <span class="font-bold">data</span>. The meta object provides
              general information about the data. The data property is an array
              that contains the actual data output.
            </p>
            <p>
              Here's an example of a successful response from the <a
                href="#colorways"
                class="link">/colorways</a
              > endpoint.
            </p>
            <p
              class="break-all whitespace-pre-wrap codeblock code text-token p-4 w-fit"
            >
              {`{
      "meta": {
          "limit": 50, // the maxmimum number of results
          "offset": 0, // the starting index of the results
          "total": 6743 // the total number of results
      },
      "data": [
          {
              "name": "Olive"
              "hex": "#665e3f"
              "brandId": "bernat"
              "brandName": "Bernat"
              "yarnId": "blanket"
              "yarnName": "Blanket"
              "yarnWeightId": 'sb'
              "dateAccessed": "2024-01-19"
              "href": "https://www.yarnspirations.com/products/bernat-blanket-yarn-300g-10-5oz-1"
          },
          ...
      ]
  }`}
            </p>
            <p>
              If you encouter an error, look at the <a
                href="#status-codes"
                class="link">Status Codes</a
              >
              to find out why.
            </p>
          </section>

          <h2 class="font-bold text-2xl" id="endpoints">Endpoints</h2>

          <section
            id="find-yarn-by-color"
            class="scroll-mt-[58px] card bg-surface-200-700-token p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Find Yarn by Color</h3>
            <p>Get best-matching yarn colorways for a specified color.</p>

            <p>
              <span class="font-bold">Method</span>
              <span class="code px-2 text-token">GET</span>
            </p>
            <p>
              <span class="font-bold">URL</span>
              <span class="code px-2 text-token">/match/{`[color]`}</span>
            </p>

            <p class="font-bold">Parameters</p>
            <p>
              When calling this endpoint, refer to the following parameters.
            </p>
            <div class="overflow-scroll max-w-[80vw] sm:max-w-[90vw]">
              <table
                class="border-separate border-spacing-0 w-full border-surface-300-600-token border rounded-container-token overflow-hidden"
              >
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Default</th>
                  </tr>
                </thead>
                <tbody
                  class="[&>tr:nth-child(odd)]:bg-surface-50-900-token [&>tr:nth-child(even)]:bg-surface-100-800-token"
                >
                  <tr>
                    <td>color</td>
                    <td
                      >An HTML hex color code, or any string that can be
                      correctly parsed as a color by
                      <a
                        href="https://gka.github.io/chroma.js/"
                        target="_blank"
                        class="link">chroma.js</a
                      >
                      (just make sure the string is URL encoded).</td
                    >
                    <td>String</td>
                    <td><span class="">Yes</span></td>
                    <td
                      ><span
                        class="variant-soft-surface rounded-container-token px-2 text-token"
                        >undefined</span
                      ></td
                    >
                  </tr>
                  <tr>
                    <td>brand</td>
                    <td
                      >A <a href="#brands" class="link">brand ID or name</a>, or
                      a comma-separated list of brand IDs or brand names to
                      filter the results by.</td
                    >
                    <td>String</td>
                    <td>No</td>
                    <td
                      ><span
                        class="variant-soft-surface rounded-container-token px-2 text-token"
                        >undefined</span
                      ></td
                    >
                  </tr>
                  <tr>
                    <td>yarn</td>
                    <td
                      >A <a href="#yarns" class="link">yarn ID or name</a>, or a
                      comma-separated list of yarn IDs or yarn names to filter
                      the results by.</td
                    >
                    <td>String</td>
                    <td>No</td>
                    <td
                      ><span
                        class="variant-soft-surface rounded-container-token px-2 text-token"
                        >undefined</span
                      ></td
                    >
                  </tr>
                  <tr>
                    <td>weight</td>
                    <td
                      >A <a href="#weights" class="link"
                        >yarn weight ID or name</a
                      >.</td
                    >
                    <td>String</td>
                    <td>No</td>
                    <td
                      ><span
                        class="variant-soft-surface rounded-container-token px-2 text-token"
                        >undefined</span
                      ></td
                    >
                  </tr>
                  <tr>
                    <td>limit</td>
                    <td
                      >The maximum number of yarn colorways to include in the
                      results. Maximum is
                      <span class="code px-2 text-token">500</span>.</td
                    >
                    <td>Number</td>
                    <td>No</td>
                    <td><span class="code px-2 text-token">50</span></td>
                  </tr>
                  <tr>
                    <td>offset</td>
                    <td>The starting index of the data to return.</td>
                    <td>Number</td>
                    <td>No</td>
                    <td><span class="code px-2 text-token">0</span></td>
                  </tr>
                  <tr>
                    <td>threshold</td>
                    <td
                      >The minimum percentage amount the yarn colorway must
                      match the supplied color, between
                      <span class="code px-2 text-token">0</span>
                      and
                      <span class="code px-2 text-token">100</span>.</td
                    >
                    <td>Number</td>
                    <td>No</td>
                    <td><span class="code px-2 text-token">75</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="font-bold">Examples</p>

            <p
              class="break-all whitespace-pre-wrap codeblock code text-token p-4 w-fit"
            >
              {`// get colorways matching an HTML hex code without the # hash 
  GET https://yarn-colorways.p.rapidapi.com/v1/match/665e3f 

  // get colorways matching a URL encoded HTML hex code #665e3f
  GET https://yarn-colorways.p.rapidapi.com/v1/match/%23665e3f 

  // get colorways matching a standard HTML color name 
  GET https://yarn-colorways.p.rapidapi.com/v1/match/green 

  // get colorways matching a URL encoded RGB color code rgb(102,94,63)
  GET https://yarn-colorways.p.rapidapi.com/v1/match/rgb%28102%2C94%2C63%29

  // get matches only from a specified brand and yarn
  GET https://yarn-colorways.p.rapidapi.com/v1/match/665e3f?brand=cascade&yarn=anchor_bay`}
            </p>

            <p class="font-bold">Response</p>

            <p>
              A successful response's <span class="font-bold">data</span> property
              will contain an array of colorway objects with the following properties:
            </p>

            <div class="overflow-scroll max-w-[80vw] sm:max-w-[90vw]">
              <table
                class="border-separate border-spacing-0 w-full border-surface-300-600-token border rounded-container-token overflow-hidden"
              >
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Description</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody
                  class="[&>tr:nth-child(odd)]:bg-surface-50-900-token [&>tr:nth-child(even)]:bg-surface-100-800-token"
                >
                  <tr>
                    <td>name</td>
                    <td>The name of the colorway.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>hex</td>
                    <td>The HTML hex color code of the colorway.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>yarnId</td>
                    <td>The ID of the yarn.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>yarnName</td>
                    <td>The name of the yarn.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>yarnWeightId</td>
                    <td>The id of the yarn weight.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>brandId</td>
                    <td>The ID of the brand.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>brandName</td>
                    <td>The name of the brand.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>dateAccessed</td>
                    <td
                      >YYYY-MM-DD date when the colorway was added to the
                      database.</td
                    >
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>href</td>
                    <td>The webpage where the colorway was found.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>delta</td>
                    <td
                      >The calculated difference between the specified color and
                      the yarn colorway hex, between 0 (most similar) and 100
                      (most different).</td
                    >
                    <td>Number</td>
                  </tr>
                  <tr>
                    <td>percentMatch</td>
                    <td
                      >The percentage that the supplied color matches the
                      colorway hex, rounded down to the nearest integer.</td
                    >
                    <td>Number</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section
            id="colorways"
            class="scroll-mt-[58px] card bg-surface-200-700-token p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Colorways</h3>
            <p>Get yarn colorways.</p>

            <p>
              <span class="font-bold">Method</span>
              <span class="code px-2 text-token">GET</span>
            </p>
            <p>
              <span class="font-bold">URL</span>
              <span class="code px-2 text-token">/colorways</span>
            </p>

            <p class="font-bold">Parameters</p>
            <p>
              When calling this endpoint, refer to the following parameters.
            </p>
            <div class="overflow-scroll max-w-[80vw] sm:max-w-[90vw]">
              <table
                class="border-separate border-spacing-0 w-full border-surface-300-600-token border rounded-container-token overflow-hidden"
              >
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Default</th>
                  </tr>
                </thead>
                <tbody
                  class="[&>tr:nth-child(odd)]:bg-surface-50-900-token [&>tr:nth-child(even)]:bg-surface-100-800-token"
                >
                  <tr>
                    <td>color</td>
                    <td
                      >An HTML hex color code, or any string that can be
                      correctly parsed as a color by
                      <a
                        href="https://gka.github.io/chroma.js/"
                        target="_blank"
                        class="link">chroma.js</a
                      >
                      (just make sure the string is URL encoded).</td
                    >
                    <td>String</td>
                    <td>No</td>
                    <td
                      ><span
                        class="variant-soft-surface rounded-container-token px-2 text-token"
                        >undefined</span
                      ></td
                    >
                  </tr>
                  <tr>
                    <td>name</td>
                    <td>Any colorway name. Text case is ignored.</td>
                    <td>String</td>
                    <td>No</td>
                    <td
                      ><span
                        class="variant-soft-surface rounded-container-token px-2 text-token"
                        >undefined</span
                      ></td
                    >
                  </tr>
                  <tr>
                    <td>brand</td>
                    <td
                      >A <a href="#brands" class="link">brand ID or name</a>, or
                      a comma-separated list of brand IDs or brand names to
                      filter the results by.</td
                    >
                    <td>String</td>
                    <td>No</td>
                    <td
                      ><span
                        class="variant-soft-surface rounded-container-token px-2 text-token"
                        >undefined</span
                      ></td
                    >
                  </tr>
                  <tr>
                    <td>yarn</td>
                    <td
                      >A <a href="#yarns" class="link">yarn ID or name</a>, or a
                      comma-separated list of yarn IDs or yarn names to filter
                      the results by.</td
                    >
                    <td>String</td>
                    <td>No</td>
                    <td
                      ><span
                        class="variant-soft-surface rounded-container-token px-2 text-token"
                        >undefined</span
                      ></td
                    >
                  </tr>
                  <tr>
                    <td>weight</td>
                    <td
                      >A <a href="#weights" class="link"
                        >yarn weight ID or name</a
                      >.</td
                    >
                    <td>String</td>
                    <td>No</td>
                    <td
                      ><span
                        class="variant-soft-surface rounded-container-token px-2 text-token"
                        >undefined</span
                      ></td
                    >
                  </tr>
                  <tr>
                    <td>limit</td>
                    <td
                      >The maximum number of yarn colorways to include in the
                      results. Maximum is 500.</td
                    >
                    <td>Number</td>
                    <td>No</td>
                    <td><span class="code px-2 text-token">50</span></td>
                  </tr>
                  <tr>
                    <td>offset</td>
                    <td>The starting index of the data to return.</td>
                    <td>Number</td>
                    <td>No</td>
                    <td><span class="code px-2 text-token">0</span></td>
                  </tr>
                  <tr>
                    <td>sortBy</td>
                    <td
                      >The property to sort the results by. Accepted values are
                      <span class="code px-2 text-token">default</span>,
                      <span class="code px-2 text-token">lightness</span>, or
                      <span class="code px-2 text-token">name</span>.
                    </td>
                    <td>String</td>
                    <td>No</td>
                    <td><span class="code px-2 text-token">default</span></td>
                  </tr>
                  <tr>
                    <td>direction</td>
                    <td
                      >The direction to sort the results. Accepted values are
                      <span class="code px-2 text-token">ASC</span>
                      (ascending) or
                      <span class="code px-2 text-token">DESC</span>
                      (descending).
                    </td>
                    <td>String</td>
                    <td>No</td>
                    <td><span class="code px-2 text-token">ASC</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="font-bold">Example</p>

            <p
              class="break-all whitespace-pre-wrap codeblock code text-token p-4 w-fit"
            >
              {`// get all colorways 
  GET https://yarn-colorways.p.rapidapi.com/v1/colorways

  // get all colorways from a specified brand and yarn, sorted by lightest-to-darkest 
  GET https://yarn-colorways.p.rapidapi.com/v1/colorways?brand=premire&yarn=afternoon_cotton&sortBy=lightness

  // get all colorways with a specified name 
  GET https://yarn-colorways.p.rapidapi.com/v1/colorways?name=peach

  `}
            </p>

            <p class="font-bold">Response</p>

            <p>
              A successful response's <span class="font-bold">data</span> property
              will contain an array of colorway objects with the following properties:
            </p>

            <div class="overflow-scroll max-w-[80vw] sm:max-w-[90vw]">
              <table
                class="border-separate border-spacing-0 w-full border-surface-300-600-token border rounded-container-token overflow-hidden"
              >
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Description</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody
                  class="[&>tr:nth-child(odd)]:bg-surface-50-900-token [&>tr:nth-child(even)]:bg-surface-100-800-token"
                >
                  <tr>
                    <td>name</td>
                    <td>The name of the colorway.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>hex</td>
                    <td>The HTML hex color code of the colorway.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>yarnId</td>
                    <td>The ID of the yarn.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>yarnName</td>
                    <td>The name of the yarn.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>yarnWeightId</td>
                    <td>The id of the yarn weight.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>brandId</td>
                    <td>The ID of the brand.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>brandName</td>
                    <td>The name of the brand.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>dateAccessed</td>
                    <td
                      >YYYY-MM-DD date when the colorway was added to the
                      database.</td
                    >
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>href</td>
                    <td>The webpage where the colorway was found.</td>
                    <td>String</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section
            id="brands"
            class="scroll-mt-[58px] card bg-surface-200-700-token p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Brands</h3>
            <p>
              Get all brand IDs and names, useful to filter <a
                href="#find-yarn-by-color"
                class="link">/match</a
              >
              or
              <a href="#colorways" class="link">/colorways</a> results.
            </p>

            <p>
              <span class="font-bold">Method</span>
              <span class="code px-2 text-token">GET</span>
            </p>
            <p>
              <span class="font-bold">URL</span>
              <span class="code px-2 text-token">/brands</span>
            </p>

            <p class="font-bold">Parameters</p>
            <p>There are no parameters when calling this request.</p>

            <p class="font-bold">Example</p>

            <p
              class="break-all whitespace-pre-wrap codeblock code text-token p-4 w-fit"
            >
              {`// get all brands 
  GET https://yarn-colorways.p.rapidapi.com/v1/brands 
  `}
            </p>

            <p class="font-bold">Response</p>

            <p>
              A successful response's <span class="font-bold">data</span> property
              will contain an array of brand objects with the following properties:
            </p>

            <div class="overflow-scroll max-w-[80vw] sm:max-w-[90vw]">
              <table
                class="border-separate border-spacing-0 w-full border-surface-300-600-token border rounded-container-token overflow-hidden"
              >
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Description</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody
                  class="[&>tr:nth-child(odd)]:bg-surface-50-900-token [&>tr:nth-child(even)]:bg-surface-100-800-token"
                >
                  <tr>
                    <td>brandName</td>
                    <td>The name of the brand.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>brandId</td>
                    <td>The ID of the brand.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>yarns</td>
                    <td>The number of yarns in this brand.</td>
                    <td>Number</td>
                  </tr>
                  <tr>
                    <td>colorways</td>
                    <td>The number of colorways in this brand.</td>
                    <td>Number</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section
            id="yarns"
            class="scroll-mt-[58px] card bg-surface-200-700-token p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Yarns</h3>
            <p>
              Get all yarn IDs and names, useful to filter <a
                href="#find-yarn-by-color"
                class="link">/match</a
              >
              or
              <a href="#colorways" class="link">/colorways</a> results.
            </p>

            <p>
              <span class="font-bold">Method</span>
              <span class="code px-2 text-token">GET</span>
            </p>
            <p>
              <span class="font-bold">URL</span>
              <span class="code px-2 text-token">/yarns</span>
            </p>

            <p class="font-bold">Parameters</p>
            <p>
              When calling this endpoint, refer to the following parameters.
            </p>
            <div class="overflow-scroll max-w-[80vw] sm:max-w-[90vw]">
              <table
                class="border-separate border-spacing-0 w-full border-surface-300-600-token border rounded-container-token overflow-hidden"
              >
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Default</th>
                  </tr>
                </thead>
                <tbody
                  class="[&>tr:nth-child(odd)]:bg-surface-50-900-token [&>tr:nth-child(even)]:bg-surface-100-800-token"
                >
                  <tr>
                    <td>brand</td>
                    <td
                      >The brand ID or name, or a comma-separated list of brand
                      IDs or brand names to filter the results by.</td
                    >
                    <td>String</td>
                    <td>No</td>
                    <td
                      ><span
                        class="variant-soft-surface rounded-container-token px-2 text-token"
                        >undefined</span
                      ></td
                    >
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="font-bold">Example</p>

            <p
              class="break-all whitespace-pre-wrap codeblock code text-token p-4 w-fit"
            >
              {`// get all yarns 
  GET https://yarn-colorways.p.rapidapi.com/v1/yarns

  // filter by brand 
  GET https://yarn-colorways.p.rapidapi.com/v1/yarns?brand=hobbii 

  // filter by multiple brands 
  GET https://yarn-colorways.p.rapidapi.com/v1/yarns?brand=bernat,loops_and_threads,plymouth_yarn
  `}
            </p>

            <p class="font-bold">Response</p>

            <p>
              A successful response's <span class="font-bold">data</span> property
              will contain an array of yarn objects with the following properties:
            </p>

            <div class="overflow-scroll max-w-[80vw] sm:max-w-[90vw]">
              <table
                class="border-separate border-spacing-0 w-full border-surface-300-600-token border rounded-container-token overflow-hidden"
              >
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Description</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody
                  class="[&>tr:nth-child(odd)]:bg-surface-50-900-token [&>tr:nth-child(even)]:bg-surface-100-800-token"
                >
                  <tr>
                    <td>brandName</td>
                    <td>The name of the brand.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>brandId</td>
                    <td>The ID of the brand.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>yarnId</td>
                    <td>The ID of the yarn.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>yarnName</td>
                    <td>The name of the yarn.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>yarnWeightId</td>
                    <td>The id of the yarn weight.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>colorways</td>
                    <td>The number of colorways in this yarn.</td>
                    <td>Number</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section
            id="weights"
            class="scroll-mt-[58px] card bg-surface-200-700-token p-4 gap-2 flex flex-col"
          >
            <h3 class="font-bold text-xl">Yarn Weights</h3>
            <p>
              Get all yarn weight IDs and names, useful to filter <a
                href="#find-yarn-by-color"
                class="link">/match</a
              >
              or
              <a href="#colorways" class="link">/colorways</a> results.
            </p>

            <p>
              <span class="font-bold">Method</span>
              <span class="code px-2 text-token">GET</span>
            </p>
            <p>
              <span class="font-bold">URL</span>
              <span class="code px-2 text-token">/weights</span>
            </p>

            <p class="font-bold">Parameters</p>
            <p>There are no parameters when calling this request.</p>

            <p class="font-bold">Example</p>

            <p
              class="break-all whitespace-pre-wrap codeblock code text-token p-4 w-fit"
            >
              {`// get all yarn weights 
  GET https://yarn-colorways.p.rapidapi.com/v1/weights
  `}
            </p>

            <p class="font-bold">Response</p>

            <p>
              A successful response's <span class="font-bold">data</span> property
              will contain an array of yarn weight objects with the following properties:
            </p>

            <div class="overflow-scroll max-w-[80vw] sm:max-w-[90vw]">
              <table
                class="border-separate border-spacing-0 w-full border-surface-300-600-token border rounded-container-token overflow-hidden"
              >
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Description</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody
                  class="[&>tr:nth-child(odd)]:bg-surface-50-900-token [&>tr:nth-child(even)]:bg-surface-100-800-token"
                >
                  <tr>
                    <td>id</td>
                    <td>The id of the yarn weight.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>name</td>
                    <td>The name of the yarn weight.</td>
                    <td>String</td>
                  </tr>
                  <tr>
                    <td>yarns</td>
                    <td>The number of yarns in this weight</td>
                    <td>String</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section
            id="status-codes"
            class="scroll-mt-[58px] gap-2 flex flex-col"
          >
            <h2 class="font-bold text-xl">Status Codes</h2>
            <p>Responses will have one of the following status codes:</p>
            <div class="overflow-scroll max-w-[80vw] sm:max-w-[90vw]">
              <table
                class="border-separate border-spacing-0 w-full border-surface-300-600-token border rounded-container-token overflow-hidden"
              >
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody
                  class="[&>tr:nth-child(odd)]:bg-surface-50-900-token [&>tr:nth-child(even)]:bg-surface-100-800-token"
                >
                  <tr>
                    <td>200</td>
                    <td>Success: All is fine</td>
                  </tr>
                  <tr>
                    <td>400</td>
                    <td>Bad Request: Please check the query parameters</td>
                  </tr>
                  <tr>
                    <td>401</td>
                    <td>Unauthorized: Make sure to send a valid RapidAPI key</td
                    >
                  </tr>
                  <tr>
                    <td>403</td>
                    <td
                      >Forbidden: You're not allowed to access this endpoint</td
                    >
                  </tr>
                  <tr>
                    <td>404</td>
                    <td>Not Found: This endpoint doesn't exist</td>
                  </tr>
                  <tr>
                    <td>429</td>
                    <td>Too Many Requests: You've exceeded the quota</td>
                  </tr>
                  <tr>
                    <td>503</td>
                    <td
                      >Service Temporarily Unavailable: The API is currently
                      down</td
                    >
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <div class="flex flex-col gap-4">
            <h2
              class="font-bold text-2xl scroll-mt-[58px]"
              id="terms-and-license"
            >
              Terms & License
            </h2>
            <section class="gap-2 flex flex-col mt-2 lg:mt-0">
              <p class="">
                Data is provided under the terms of the <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  class="link"
                  >CC BY 4.0 DEED Attribution 4.0 International license</a
                >.
              </p>
              <div class="">
                <p>You are free to:</p>
                <p class="ml-4">
                  <span class="font-bold">Share</span> — copy and redistribute the
                  material in any medium or format for any purpose, even commercially.
                </p>
                <p class="ml-4">
                  <span class="font-bold">Adapt</span> — remix, transform, and build
                  upon the material for any purpose, even commercially.
                </p>

                <p class="mt-4">Under the following terms:</p>
                <p class="ml-4">
                  <span class="font-bold">Attribution</span>
                  — You must give appropriate credit, provide a link to
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    class="link">this license</a
                  >, and indicate if changes were made. You may do so in any
                  reasonable manner, but not in any way that suggests the
                  licensor endorses you or your use.
                </p>
              </div>
              <p class="font-bold">Example Attribution:</p>
              <p
                class="text-token w-fit p-4 variant-soft-tertiary rounded-container-token break-all max-w-[90vw]"
              >
                Yarn colorways from
                <a href={PUBLIC_BASE_URL} target="_blank" class="link"
                  >{PUBLIC_BASE_DOMAIN_NAME}</a
                >
                licensed under
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  class="link">CC BY 4.0 DEED</a
                >.
              </p>
              <p class="">
                HTML hex colors are approximations of fiber colors. Real yarn
                colors will look different than what’s on a screen. Any
                trademarked yarn or colorway details are owned by their
                respective companies.
              </p>
              <p class="">
                The data is provided “as is” and without any guarantees of
                quality, performance, or suitability for any purpose.
              </p>
            </section>
          </div>
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

<style>
  table th,
  table td {
    padding: 8px;
  }
</style>
