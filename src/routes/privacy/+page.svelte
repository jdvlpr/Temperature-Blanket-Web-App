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
  import { PUBLIC_BASE_URL, PUBLIC_KOFI_LINK } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import { consentToMSClarityCookies } from '$lib/state';
  import { disableToastAnalytics } from '$lib/state/page-state.svelte';
  import { getToastStore } from '@skeletonlabs/skeleton';

  const toastStore = getToastStore();

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
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main class="max-w-screen-xl px-2 xl:px-0 flex flex-col gap-4 my-2">
      <p class="font-bold text-2xl hidden lg:inline-block">Privacy Policy</p>
      <div class="flex flex-col">
        <p class="font-bold text-xl">Introduction</p>
        <p>
          Temperature-blanket.com strives to handle user data in a minimal,
          secure, and responsible way. This Privacy Policy explains what data is
          collected and how it is used.
        </p>
      </div>

      <div class="flex flex-col">
        <p class="font-bold text-xl">Who is responsible for data collection?</p>
        <p>
          The developer of temperature-blanket.com is responsible for and has
          access to the data collected by this site. The developer can be
          contacted at info@temperature-blanket.com.
        </p>
      </div>

      <div class="flex flex-col">
        <p class="font-bold text-xl">Cookies and data privacy</p>

        <p>
          Learn how this site uses cookies and manage your preferences below.
        </p>

        <div
          class="card p-2 rounded-container-token bg-surface-200-700-token my-2 flex flex-col gap-2"
        >
          <div class="flex flex-col">
            <ToggleSwitch
              label="Analytics"
              onchange={() => {
                let thisEvent;
                if (consentToMSClarityCookies.value)
                  thisEvent = new CustomEvent('consentToMSClarity');
                else thisEvent = new CustomEvent('removeConsentToMSClarity');
                window.dispatchEvent(thisEvent);
              }}
              bind:checked={consentToMSClarityCookies.value}
            />
          </div>
          <p>
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
          </p>
          {#if $disableToastAnalytics}
            <button
              class="btn variant-filled-secondary w-fit my-2 whitespace-pre-wrap"
              onclick={() => {
                $disableToastAnalytics = false;
                toastStore.trigger({
                  message: 'The Analytics message can be shown again.',
                  background: 'bg-success-300 text-black',
                });
              }}
              ><span
                >Reset <span class="italic inline"
                  >"Don't show this message again"</span
                > for Analytics</span
              >
            </button>
          {/if}
        </div>
      </div>

      {#if PUBLIC_KOFI_LINK}
        <div class="flex flex-col">
          <p class="font-bold text-xl">Supporter details</p>
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
        <p class="font-bold text-xl">Contact information</p>
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
        <p class="font-bold text-xl">Website traffic and security</p>
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

      <div class="flex flex-col">
        <p class="font-bold text-xl">Changes to this Privacy Policy</p>
        <p>Any changes to this Privacy Policy will be made on this page.</p>
        <p class="italic">Last updated April 13, 2024</p>
      </div>
    </main>
  {/snippet}
</AppShell>
