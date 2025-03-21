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
  import { beforeNavigate, onNavigate } from '$app/navigation';
  import { PUBLIC_MICROSOFT_CLARITY_ID } from '$env/static/public';
  import ModalProvider from '$lib/components/modals/ModalProvider.svelte';
  import ToastProvider from '$lib/components/ToastProvider.svelte';
  import { consentToMSClarityCookies, modal, toast } from '$lib/state';
  import { handleKeyDown, initializeLocalStorage, privacy } from '$lib/utils';
  import { RocketIcon, XIcon } from '@lucide/svelte';
  import { onMount, type Snippet } from 'svelte';
  import '../css/main.css';

  let bannerElement: HTMLElement | undefined;
  interface Props {
    children?: Snippet;
  }
  let { children }: Props = $props();

  onMount(async () => {
    initializeLocalStorage();

    // NOTE: Set window variable in order to access it inside the MS clarity function
    // See the script tag with id="clarity-script"
    window.MS_CLARITY_ID = PUBLIC_MICROSOFT_CLARITY_ID || null;
    privacy.init();
  });

  beforeNavigate(() => {
    modal.close();
  });

  onNavigate((navigation) => {
    if (!document.startViewTransition) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<svelte:window
  onkeydown={handleKeyDown}
  onoffline={() => {
    // Alert if offline
    toast.trigger({
      message: `<div
    class="w-full p-2 m-auto flex flex-col items-start text-left"
  >
    <div class="flex items-center justify-start gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="size-4 shrink-0" viewBox="0 0 36 36"
        ><circle cx="18" cy="29.54" r="3" fill="currentColor" class="clr-i-solid clr-i-solid-path-1" /><path
          fill="currentColor"
          d="m29.18 17.71l.11-.17a1.51 1.51 0 0 0-.47-2.1A20.57 20.57 0 0 0 18 12.37c-.56 0-1.11 0-1.65.07l3.21 3.21a17.41 17.41 0 0 1 7.6 2.52a1.49 1.49 0 0 0 2.02-.46"
          class="clr-i-solid clr-i-solid-path-2"
        /><path
          fill="currentColor"
          d="M32.76 9.38a27.9 27.9 0 0 0-22.58-3.11l2.63 2.63a24.68 24.68 0 0 1 18.29 3.22a1.49 1.49 0 0 0 2-.46l.11-.17a1.51 1.51 0 0 0-.45-2.11"
          class="clr-i-solid clr-i-solid-path-3"
        /><path
          fill="currentColor"
          d="m3 4.75l3.1 3.1a27.28 27.28 0 0 0-2.92 1.57a1.51 1.51 0 0 0-.48 2.11l.11.17a1.49 1.49 0 0 0 2 .46a24.69 24.69 0 0 1 3.67-1.9l3.14 3.14a20.63 20.63 0 0 0-4.53 2.09a1.51 1.51 0 0 0-.46 2.1l.11.17a1.49 1.49 0 0 0 2 .46A17.46 17.46 0 0 1 14.25 16l3.6 3.6a13.39 13.39 0 0 0-6.79 1.93a1.5 1.5 0 0 0-.46 2.09l.1.16a1.52 1.52 0 0 0 2.06.44a10.2 10.2 0 0 1 9-.7L29 30.75l1.41-1.41l-26-26Z"
          class="clr-i-solid clr-i-solid-path-4"
        /><path fill="none" d="M0 0h36v36H0z" /></svg
      >
      <span>No Internet Connection</span>
    </div>
    <p class="text-sm">Some features may not work as expected.</p>
  </div>`,
      background: 'preset-filled-warning-200-800',
    });
  }}
  ononline={() => {
    // Alert if online connection restored
    toast.trigger({
      message: `<div
    class="w-full text-center p-2 m-auto flex flex-col items-start justify-center"
  >
    <div class="flex flex-wrap items-center justify-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg"class="size-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21q-1.05 0-1.775-.725T9.5 18.5t.725-1.775T12 16t1.775.725t.725 1.775t-.725 1.775T12 21m-5.65-5.65l-2.1-2.15q1.475-1.475 3.463-2.337T12 10t4.288.875t3.462 2.375l-2.1 2.1q-1.1-1.1-2.55-1.725T12 13t-3.1.625t-2.55 1.725M2.1 11.1L0 9q2.3-2.35 5.375-3.675T12 4t6.625 1.325T24 9l-2.1 2.1q-1.925-1.925-4.462-3.012T12 7T6.563 8.088T2.1 11.1"/></svg>
     You are online
    </div>
  </div>`,
      background: 'preset-filled-success-100-900',
    });
  }}
/>

<svelte:head>
  <link rel="manifest" href="/manifest.json" />
  <link
    rel="apple-touch-icon"
    sizes="180x180"
    href="/images/apple-icon-180.png"
  />
  <link
    rel="icon"
    type="image/png"
    sizes="32x32"
    href="/images/favicon-32x32.png"
  />
  <link
    rel="icon"
    type="image/png"
    sizes="16x16"
    href="/images/favicon-16x16.png"
  />
  <link rel="shortcut icon" href="/favicon.ico" />
  <link rel="stylesheet" href="https://use.typekit.net/obw5vhr.css" />

  <meta name="theme-color" content="#f5f5f5" />

  {#if consentToMSClarityCookies.value && PUBLIC_MICROSOFT_CLARITY_ID}
    <script type="text/javascript" async id="clarity-script">
      (function (c, l, a, r, i, t, y) {
        c[a] =
          c[a] ||
          function () {
            (c[a].q = c[a].q || []).push(arguments);
          };
        t = l.createElement(r);
        t.async = 1;
        t.onload = function () {
          window.clarity('consent');
        };
        t.onerror = async function () {
          const loadError = new CustomEvent('analyticsUnableToLoad');
          window.dispatchEvent(loadError);

          const consentEvent = new CustomEvent('removeConsentToMSClarity');
          window.dispatchEvent(consentEvent);
        };
        t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script', window.MS_CLARITY_ID);
    </script>
  {/if}
</svelte:head>

<div
  class="bg-surface-100-900 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 p-2 text-center [view-transition-name:top-banner]"
  bind:this={bannerElement}
>
  <a
    href="/blog/2025-03-20-version-5"
    class="btn bg-primary-50-950 hover:preset-tonal"
  >
    <RocketIcon />
    Version 5 - What's New?</a
  >
  <button class="btn hover:preset-tonal" onclick={() => bannerElement.remove()}
    ><XIcon />Close</button
  >
</div>

{@render children?.()}

<ToastProvider />

<ModalProvider />

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }

  @keyframes fade-out {
    to {
      opacity: 0;
    }
  }

  @keyframes slide-from-right {
    from {
      transform: translateX(30px);
    }
  }

  @keyframes slide-to-left {
    to {
      transform: translateX(-30px);
    }
  }

  :root::view-transition-old(root) {
    animation:
      90ms cubic-bezier(0.4, 0, 1, 1) both fade-out,
      300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
  }

  :root::view-transition-new(root) {
    animation:
      210ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in,
      300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
  }
</style>
