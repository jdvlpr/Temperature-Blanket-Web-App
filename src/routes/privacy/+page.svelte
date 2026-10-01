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

<script lang="ts">
  import { PUBLIC_BASE_URL, PUBLIC_KOFI_LINK } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import {
    consentToMSClarityCookies,
    toast,
  } from '$lib/state/page-state.svelte';
  import { preferences } from '$lib/storage/preferences.svelte';
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
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="mx-auto my-2 flex max-w-(--breakpoint-md) flex-col gap-4 px-2 xl:px-0"
    >
      <h2 class="h2 text-gradient mt-2 max-lg:hidden">Privacy Policy</h2>
      <div class="flex flex-col gap-2">
        <p class="text-xl font-bold">Introduction</p>
        <p>
          Temperature-blanket.com strives to handle user data in a minimal,
          secure, and responsible way. This Privacy Policy explains what
          personal data is collected, why, on what legal basis, who receives it,
          how long it is kept, and the rights you have over it, as the EU and UK
          General Data Protection Regulation (GDPR) requires.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-xl font-bold">Who is responsible for data collection?</p>
        <p>
          The developer of temperature-blanket.com is responsible for and has
          access to the data collected by this site. The developer can be
          contacted at info@temperature-blanket.com.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-xl font-bold">Cookies and data privacy</p>

        <p>
          Learn how this site uses cookies and manage your preferences below.
        </p>

        <div class="my-2 flex max-w-(--breakpoint-sm) flex-col gap-3">
          <div class="flex flex-col gap-3">
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
            Off unless you turn it on. If you allow analytics, this site uses
            Microsoft Clarity to record how you use it, such as clicks, scrolling
            and the pages you visit, along with details about your device and
            browser and a random identifier stored in cookies. Text you type
            into fields is masked. This shows which features are used and what
            to improve. You can turn it off at any time here, which removes the
            cookies. To see which cookies Microsoft Clarity sets, see the
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

          <div class="flex flex-col gap-3">
            <ToggleSwitch
              label="Preference Cookies (Required)"
              disabled
              detailsTextSize="text-normal"
              details={`<p>Your settings for the site theme are stored as cookies. Other settings, and projects you save, are stored in your browser's own storage and aren't sent to this site unless you add them to an account, share a link or send a project to the Project Gallery.</p>`}
              checked={true}
            />
            {#if __ACCOUNTS_ENABLED__}
              <ToggleSwitch
                label="Sign-in Cookies (Required when signed in)"
                disabled
                detailsTextSize="text-normal"
                details={`<p>When you sign in, a secure cookie keeps you signed in, and a second cookie tells the site you may be signed in so it only checks when needed. Both are removed when you sign out. See Accounts, below.</p>`}
                checked={true}
              />
            {/if}
          </div>

          {#if preferences.value.disableToastAnalytics}
            <div
              class="rounded-container preset-filled-surface-100-900 flex w-fit flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 shadow-sm"
            >
              <p>Allow the cookie popup message to appear.</p>
              <button
                class="btn preset-filled-secondary-500"
                onclick={() => {
                  preferences.value.disableToastAnalytics = false;
                  toast.trigger({
                    message: 'The cookie popup message can be shown again.',
                    category: 'success',
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

      {#if __ACCOUNTS_ENABLED__}
        <div class="flex flex-col gap-2">
          <p class="text-xl font-bold">Accounts</p>
          <p>
            You don’t need an account to use temperature-blanket.com. Without
            one, projects you save stay only in your web browser and are never
            sent to this site. If you create an
            <a href="/account" class="link">account</a>, the data below is
            stored so you can sign in and use your projects on every device
            where you’re signed in.
          </p>

          <p class="font-bold">What is stored</p>
          <ul class="list-disc space-y-1 pl-6">
            <li>
              <span class="font-bold">Your email address</span>, to sign you in
              and to send you sign-in codes and security notices, such as a
              notice when your email address is changed. It is not used for
              newsletters or marketing. While project sync is in a private beta,
              invited email addresses are also kept in the site’s settings.
            </li>
            <li>
              <span class="font-bold">A display name and profile picture</span>,
              if you add a name or sign in with Google. If you sign in with
              Google, Google shares your name, email address and profile picture
              link. Your picture is loaded from Google’s servers. The sign-in
              tokens Google provides are stored encrypted and aren’t used to
              access your Google account.
            </li>
            <li>
              <span class="font-bold">Sign-in sessions</span>: for each device
              where you’re signed in, the IP address and browser details it
              signed in from, to keep your account secure. A session ends when
              you sign out, or after 60 days without use.
            </li>
            <li>
              <span class="font-bold">Your saved projects</span>, if you add
              them to your account: everything in a project, including its
              locations, dates, weather data and colors. Projects sync to the
              devices where you’re signed in and are not public unless you send
              one to the
              <a href="/gallery" class="link">Project Gallery</a>.
            </li>
            <li>
              <span class="font-bold">Security records</span>: to prevent abuse,
              counts of recent sign-in requests from each IP address, and of
              sign-in codes requested for each email address (stored in a
              scrambled form that can’t be turned back into the address). These
              are kept for about a day.
            </li>
          </ul>

          <p class="font-bold">How long it is kept</p>
          <p>
            Your account data is kept until you delete your account. Sign-in
            codes expire after 5 minutes. When you change a synced project, the
            previous version is kept for up to 7 days before it is deleted. When
            you remove a synced project, a small record of its removal,
            including its title, is kept for up to 180 days so your other
            devices remove it too.
          </p>

          <p class="font-bold">Who processes it</p>
          <p>
            Account data and synced projects are stored with
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              class="link"
              rel="noreferrer noopener"
              target="_blank">Cloudflare</a
            >, which hosts this site. Emails are sent through
            <a
              href="https://resend.com/legal/privacy-policy"
              class="link"
              rel="noreferrer noopener"
              target="_blank">Resend</a
            >, which receives your email address and the email’s contents. If
            you sign in with Google, Google’s
            <a
              href="https://policies.google.com/privacy"
              class="link"
              rel="noreferrer noopener"
              target="_blank">privacy policy</a
            > applies to that sign-in. Your data is not sold or shared with anyone
            else.
          </p>

          <p class="font-bold">Your choices</p>
          <p>
            On your <a href="/account" class="link">account page</a> you can change
            your name and email address, unlink Google, sign out of every device,
            download your account data and synced projects, and delete your account.
            Deleting your account removes your account data and synced projects from
            this site straight away; projects saved in your browser stay there. For
            anything else, contact info@temperature-blanket.com.
          </p>

          <p>
            This site also stores your name, email address and picture link in
            your browser, so the site can show who is signed in without asking
            the server. It is removed when you sign out.
          </p>
        </div>
      {/if}

      <div class="flex flex-col gap-2">
        <p class="text-xl font-bold">Project Gallery</p>
        <p>
          If you send a project to the
          <a href="/gallery" class="link">Project Gallery</a>, the project is
          published for anyone to see: its locations, dates, weather data,
          colors, yarn details and project link. It is stored on a separate
          website run by the developer that hosts the gallery. No account
          details are sent. To have a gallery project removed, contact
          info@temperature-blanket.com.
        </p>
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
      <div class="flex flex-col gap-2">
        <p class="text-xl font-bold">Contact information</p>
        <p>
          If you <a href="/contact" class="link">contact</a> the developer, any personal
          information you provide will be used for communication between the developer
          and you, and kept only as long as needed to answer and follow up.
        </p>
        <p>
          If you send a <a href="/yarn-search-request" class="link"
            >Yarn Search Request</a
          > and include an optional email address, it is used to contact you about
          your form submission. The request is sent through a third-party form service.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-xl font-bold">Services this site uses</p>
        <p>
          <span class="font-bold">Hosting and security.</span>
          Temperature-blanket.com is hosted by Cloudflare, which handles all traffic
          to this site to keep it secure and available, and so receives your IP address
          and browser details. To learn more, see the
          <a
            href="https://www.cloudflare.com/privacypolicy/"
            class="link"
            rel="noreferrer noopener"
            target="_blank">Cloudflare privacy policy</a
          >.
        </p>
        <p>
          <span class="font-bold">Weather and locations.</span>
          Location searches, and weather from Meteostat, go through this site’s server
          to GeoNames and Meteostat, which receive what you searched for and the locations’
          coordinates, but not your IP address. Weather from Open-Meteo, in the Project
          Planner and on the Weather Forecast page, is requested by your browser directly
          from
          <a
            href="https://open-meteo.com/en/terms#privacy"
            class="link"
            rel="noreferrer noopener"
            target="_blank">Open-Meteo</a
          > in Switzerland, which receives your IP address and the locations’ coordinates.
          If you use your current location, your browser asks your permission first.
        </p>
        <p>
          <span class="font-bold">Videos.</span>
          Videos from YouTube load only when you choose to play one. YouTube (Google)
          then receives your IP address and details about your browser. See the
          <a
            href="https://policies.google.com/privacy"
            class="link"
            rel="noreferrer noopener"
            target="_blank">Google privacy policy</a
          >.
        </p>
        <p>
          <span class="font-bold">Google Sheets export.</span>
          If you export a project to Google Sheets, your browser loads Google’s sign-in,
          you sign in to Google, and the project is written to a new spreadsheet in
          your Google Drive. This site doesn’t receive or keep your Google sign-in
          or your spreadsheet.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-xl font-bold">Map imagery on the Globe page</p>
        <p>
          The <a href="/globe" class="link">Globe</a> page draws the Earth's surface
          using map tiles served by NASA's Global Imagery Browse Services (GIBS),
          part of NASA's Earth Observing System Data and Information System. These
          images are public domain and require no account or key.
        </p>
        <p>
          Because your browser requests these tiles directly from NASA, NASA
          receives your IP address, and the tiles you request indicate which
          part of the world you are looking at. No account information, project
          data, or other personal details are sent. This happens only while you
          are on the Globe page. To learn more, see the <a
            href="https://www.nasa.gov/privacy/"
            class="link"
            rel="noreferrer noopener"
            target="_blank">NASA privacy policy</a
          >.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-xl font-bold">Legal bases</p>
        <p>Personal data is only used where the GDPR allows it:</p>
        <ul class="list-disc space-y-1 pl-6">
          <li>
            <span class="font-bold">To provide a service you ask for</span>
            (Article 6(1)(b), a contract): your account, syncing your projects, and
            the emails that come with them.
          </li>
          <li>
            <span class="font-bold">With your consent</span>
            (Article 6(1)(a)): analytics, and projects you send to the Project Gallery.
            You can withdraw consent at any time, which doesn’t affect what happened
            before.
          </li>
          <li>
            <span class="font-bold">Legitimate interests</span>
            (Article 6(1)(f)): keeping the site and accounts secure (sign-in sessions,
            request limits, Cloudflare), delivering the site’s features (weather,
            maps, videos you play), and answering messages you send. You can object
            to this use; see Your rights.
          </li>
        </ul>
        <p>
          Giving personal data is optional. An email address is needed only to
          create an account; everything else works without one. No decisions
          about you are made by automated means, and no profiles are built for
          advertising.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-xl font-bold">Transfers outside the EU and UK</p>
        <p>
          Some of the services above, including Cloudflare, Resend, Google and
          Microsoft, are based in the United States or may process data there.
          These transfers rely on the EU–U.S. Data Privacy Framework (and its UK
          extension) where the provider is certified, or otherwise on the
          European Commission’s Standard Contractual Clauses. Open-Meteo is in
          Switzerland, which the EU recognizes as protecting personal data
          adequately.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-xl font-bold">Your rights</p>
        <p>You have the right to:</p>
        <ul class="list-disc space-y-1 pl-6">
          <li>get a copy of your personal data</li>
          <li>have it corrected</li>
          <li>have it deleted</li>
          <li>limit how it is used, or object to its use</li>
          <li>receive it in a machine-readable format (data portability)</li>
          <li>withdraw your consent at any time</li>
        </ul>
        <p>
          With an account, you can do most of this yourself on your
          <a href="/account" class="link">account page</a>. For anything else,
          email info@temperature-blanket.com. You’ll get a reply within one
          month. You can also complain to the data protection authority where
          you live or work.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-xl font-bold">Age and security</p>
        <p>
          Accounts are for people aged 16 and over. This site uses encrypted
          connections (HTTPS), has no passwords to leak, stores sign-in codes
          only in a scrambled form, and limits repeated sign-in attempts.
        </p>
      </div>

      <div class="mb-8 flex flex-col gap-2">
        <p class="text-xl font-bold">Changes to this Privacy Policy</p>
        <p>
          Any changes to this Privacy Policy will be made on this page and can
          be viewed on <a
            href="https://github.com/jdvlpr/Temperature-Blanket-Web-App/blame/main/src/routes/privacy/%2Bpage.svelte"
            target="_blank"
            class="link">GitHub</a
          >.
        </p>
        <p class="italic">Last updated September 28, 2026</p>
      </div>
    </main>
  {/snippet}
</AppShell>
