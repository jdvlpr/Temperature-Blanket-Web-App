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
  import { PUBLIC_BASE_URL, PUBLIC_KOFI_LINK } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import { consentToMSClarityCookies, localState, toast } from '$lib/state';
  import { RefreshCcwIcon } from '@lucide/svelte';

  let kofiUrl = new URL(PUBLIC_KOFI_LINK || 'https://ko-fi.com');

  let kofiLinkTitle = kofiUrl.hostname + kofiUrl.pathname;
</script>

<svelte:head>
  <title>Privacy Policy</title>
  <meta name="description" content="Privacy Policy" />

  <meta property="og:title" content="Privacy Policy" />
  <meta property="og:description" content="Privacy Policy" />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/privacy" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Privacy Policy">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="mx-auto my-2 flex max-w-(--breakpoint-md) flex-col gap-4 px-2 xl:px-0"
    >
      <h2 class="h2 text-gradient max-lg:hidden">Privacy Policy</h2>
      <div class="flex flex-col">
        <p class="text-xl font-bold">Introduction</p>
        <p>
          Temperature-blanket.com strives to handle user data in a minimal,
          secure, and responsible way. This Privacy Policy explains what data is
          collected and how it is used.
        </p>
      </div>

      <div class="flex flex-col">
        <p class="text-xl font-bold">Who is responsible for data collection?</p>
        <p>
          The developer of temperature-blanket.com is responsible for and has
          access to the data collected by this site. The developer can be
          contacted at info@temperature-blanket.com.
        </p>
      </div>

      <div class="flex flex-col">
        <p class="text-xl font-bold">Cookies and data privacy</p>

        <p>
          Learn how this site uses cookies and manage your preferences below.
        </p>

        <div class="my-2 flex max-w-(--breakpoint-sm) flex-col gap-2">
          <div class="flex flex-col">
            <ToggleSwitch
              label="Analytics Cookies"
              onchange={() => {
                let thisEvent;
                if (consentToMSClarityCookies.value)
                  thisEvent = new CustomEvent('consentToMSClarity');
                else thisEvent = new CustomEvent('removeConsentToMSClarity');
                window.dispatchEvent(thisEvent);
              }}
              detailsTextSize="text-normal"
              details={`<p>
            If you choose to accept Analytics, this site uses Microsoft Clarity
            to capture nonpersonally identifiable information about how you
            interact with temperature-blanket.com. Website usage data is
            captured using cookies to determine the popularity of services and
            features, and to inform future development and optimization. To see
            which cookies Microsoft Clarity sets, see the
            <a
              href="https://learn.microsoft.com/en-us/clarity/setup-and-installation/cookie-list"
              class="link"
              rel="noreferrer noopener"
              target="_blank">Cookie List</a
            >. For more information about how Microsoft collects and uses your
            data, visit the
            <a
              href="https://privacy.microsoft.com/privacystatement"
              class="link"
              rel="noreferrer noopener"
              target="_blank">Microsoft Privacy Statement</a
            >.
          </p>`}
              bind:checked={consentToMSClarityCookies.value}
            />
          </div>

          <div class="flex flex-col">
            <ToggleSwitch
              label="Preference Cookies (Required)"
              disabled
              detailsTextSize="text-normal"
              details={`<p>Your settings for the site theme are stored as cookies.</p>`}
              checked={true}
            />
          </div>

          {#if localState.value.disableToastAnalytics}
            <div
              class="rounded-container preset-filled-surface-100-900 flex w-fit flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 shadow-sm"
            >
              <p>Allow the cookie popup message to appear.</p>
              <button
                class="btn preset-filled-secondary-500"
                onclick={() => {
                  localState.value.disableToastAnalytics = false;
                  toast.trigger({
                    message: 'The cookie popup message can be shown again.',
                    background: 'preset-filled-success-100-900',
                  });
                }}
              >
                <RefreshCcwIcon />

                Reset Cookie Popup
              </button>
            </div>
          {/if}
        </div>
      </div>

      {#if PUBLIC_KOFI_LINK}
        <div class="flex flex-col">
          <p class="text-xl font-bold">Supporter details</p>
          <p>
            You can make a donation to the developer of temperature-blanket.com
            at <a href={PUBLIC_KOFI_LINK} target="_blank" class="link"
              >{kofiLinkTitle}</a
            >. Any personal details you provide there are used for communication
            between the developer and you. To learn more, visit
            <a
              href="https://more.ko-fi.com/privacy"
              target="_blank"
              class="link"
              rel="noreferrer noopener">Ko-Fi's privacy policy</a
            >. If you start a recurring donation, you can at that time specify
            what name will be displayed on the
            <a href="/supporters" class="link">supporter</a> page of temperature-blanket.com.
          </p>
        </div>
      {/if}
      <div class="flex flex-col">
        <p class="text-xl font-bold">Contact information</p>
        <p>
          If you <a href="/contact" class="link">contact</a> the developer, any personal
          information you provide will be used for communication between the developer
          and you.
        </p>
        <p>
          If you send a <a href="/yarn-search-request" class="link"
            >Yarn Search Request</a
          > and include an optional email addressed, it is used to contact you about
          your form submission.
        </p>
      </div>

      <div class="flex flex-col">
        <p class="text-xl font-bold">Website traffic and security</p>
        <p>
          Temperature-blanket.com uses Cloudflare to manage and protect traffic
          to this site. The data transfer between temperature-blanket.com and
          you is handled via Cloudflare's infrastructure to secure and stabilize
          the services of the site. To learn more, see the <a
            href="https://www.cloudflare.com/privacypolicy/"
            class="link"
            rel="noreferrer noopener"
            target="_blank">Cloudflare privacy policy</a
          >.
        </p>
      </div>

      <div class="mb-8 flex flex-col">
        <p class="text-xl font-bold">Changes to this Privacy Policy</p>
        <p>
          Any changes to this Privacy Policy will be made on this page and can
          be viewed on <a
            href="https://github.com/jdvlpr/Temperature-Blanket-Web-App/blame/main/src/routes/privacy/%2Bpage.svelte"
            target="_blank"
            class="link">GitHub</a
          >.
        </p>
        <p class="italic">Last updated February 19, 2025</p>
      </div>
    </main>
  {/snippet}
</AppShell>
