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
    PUBLIC_BASE_DOMAIN_NAME,
    PUBLIC_FACEBOOK_LINK,
    PUBLIC_GITHUB_LINK,
    PUBLIC_SITE_TITLE,
  } from '$env/static/public';
  import { FacebookIcon, GithubIcon, MailIcon } from '@lucide/svelte';

  let email = $state('Loading...');

  $effect(() => {
    email = `hello@${PUBLIC_BASE_DOMAIN_NAME}`;
  });
</script>

<div class="flex flex-col gap-4 mt-2">
  <a
    href="mailto:{email}"
    class="flex text-left gap-2 underline break-all w-fit"
  >
    <MailIcon />

    {email}
  </a>
  {#if PUBLIC_FACEBOOK_LINK}
    <a
      href={PUBLIC_FACEBOOK_LINK}
      target="_blank"
      rel="noreferrer"
      class="underline flex text-left gap-2 break-all w-fit"
    >
      <FacebookIcon />
      {PUBLIC_SITE_TITLE}</a
    >
  {/if}

  {#if PUBLIC_GITHUB_LINK}
    <a
      href={PUBLIC_GITHUB_LINK}
      target="_blank"
      rel="noreferrer"
      class="underline flex text-left gap-2 break-all w-fit"
    >
      <GithubIcon />

      <span>GitHub</span>
    </a>
  {/if}
</div>
