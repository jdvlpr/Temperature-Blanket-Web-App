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
  import { PUBLIC_KOFI_LINK } from '$env/static/public';
  import { SUPPORTERS } from '$lib/constants';
  import { Avatar } from '@skeletonlabs/skeleton';
</script>

{#if SUPPORTERS}
  <!-- when there are more items, add these classes: sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 -->
  <div
    class="my-4 grid grid-cols-1 gap-4 rounded-none lg:grid-cols-2 2xl:grid-cols-3"
  >
    {#if SUPPORTERS?.gold?.length}
      <div class="relative flex items-center w-full col-span-full">
        <div class="flex-grow border-t border-surface-300-600-token"></div>
        <div class="flex-shrink mx-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-6 h-6"
            viewBox="0 0 512 512"
          >
            <path
              fill="currentColor"
              d="m328.375 384l3.698 74.999l-75.862-52.719l-76.287 52.769L183.625 384h-32.039l-5.522 112h36.692l73.413-50.78L329.242 496h36.694l-5.522-112zm87.034-229.086l-2.194-48.054L372.7 80.933l-25.932-40.519l-48.055-2.2L256 16.093l-42.713 22.126l-48.055 2.2L139.3 80.933L98.785 106.86l-2.194 48.054l-22.127 42.714l22.127 42.715l2.2 48.053l40.509 25.927l25.928 40.52l48.055 2.195L256 379.164l42.713-22.126l48.055-2.195l25.928-40.52l40.518-25.923l2.195-48.053l22.127-42.715Zm-31.646 76.949L382 270.377l-32.475 20.78l-20.78 32.475l-38.515 1.76L256 343.125l-34.234-17.733l-38.515-1.76l-20.78-32.475L130 270.377l-1.759-38.514l-17.741-34.235l17.737-34.228L130 124.88l32.471-20.78l20.78-32.474l38.515-1.76L256 52.132l34.234 17.733l38.515 1.76l20.78 32.474L382 124.88l1.759 38.515l17.741 34.233Z"
            /></svg
          >
          <div class="">
            <p class="">Gold Tier</p>
            <p class="text-xs">$6 per month</p>
          </div>
        </div>
        <div class="flex-grow border-t border-surface-300-600-token"></div>
      </div>
      {#each SUPPORTERS?.gold as { name, href, linkText, imageSrc, date }}
        <div
          class="bg-surface-200-700-token text-token px-2 py-4 rounded-container-token w-full flex flex-col justify-center"
        >
          <Avatar
            src={imageSrc}
            width="w-24"
            rounded="rounded-[5px]"
            background="bg-none"
            class="mx-auto flex-shrink-0"
          />
          <div class="flex flex-col justify-center items-center">
            <p class="text-xl font-bold">
              {name}
            </p>
            <a {href} target="_blank" class="link break-all">
              {linkText}
            </a>
            <p class="text-sm font-normal">
              Since {new Date(date).toLocaleDateString()}
            </p>
          </div>
        </div>
      {/each}
    {/if}

    {#if SUPPORTERS?.silver?.length}
      <div class="relative flex items-center w-full col-span-full">
        <div class="flex-grow border-t border-surface-300-600-token"></div>
        <div class="flex-shrink mx-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-6 h-6"
            viewBox="0 0 512 512"
          >
            <path
              fill="currentColor"
              d="m328.375 384l3.698 74.999l-75.862-52.719l-76.287 52.769L183.625 384h-32.039l-5.522 112h36.692l73.413-50.78L329.242 496h36.694l-5.522-112zm87.034-229.086l-2.194-48.054L372.7 80.933l-25.932-40.519l-48.055-2.2L256 16.093l-42.713 22.126l-48.055 2.2L139.3 80.933L98.785 106.86l-2.194 48.054l-22.127 42.714l22.127 42.715l2.2 48.053l40.509 25.927l25.928 40.52l48.055 2.195L256 379.164l42.713-22.126l48.055-2.195l25.928-40.52l40.518-25.923l2.195-48.053l22.127-42.715Zm-31.646 76.949L382 270.377l-32.475 20.78l-20.78 32.475l-38.515 1.76L256 343.125l-34.234-17.733l-38.515-1.76l-20.78-32.475L130 270.377l-1.759-38.514l-17.741-34.235l17.737-34.228L130 124.88l32.471-20.78l20.78-32.474l38.515-1.76L256 52.132l34.234 17.733l38.515 1.76l20.78 32.474L382 124.88l1.759 38.515l17.741 34.233Z"
            /></svg
          >
          <div class="">
            <p class="">Silver Tier</p>
            <p class="text-xs">$4 per month</p>
          </div>
        </div>
        <div class="flex-grow border-t border-surface-300-600-token"></div>
      </div>
      {#each SUPPORTERS.silver as { name, href, linkText, date }}
        <div
          class="h-fit bg-surface-200-700-token text-token p-4 rounded-container-token flex flex-col items-center"
        >
          <p class="text-xl font-bold">{name}</p>
          <a {href} target="_blank" class="link">{linkText}</a>
          <p class="text-sm font-normal w-fit">
            Since {new Date(date).toLocaleDateString()}
          </p>
        </div>
      {/each}
    {/if}

    {#if SUPPORTERS?.bronze?.length}
      <div class="relative flex items-center w-full col-span-full">
        <div class="flex-grow border-t border-surface-300-600-token"></div>
        <div class="flex-shrink mx-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-6 h-6"
            viewBox="0 0 512 512"
          >
            <path
              fill="currentColor"
              d="m328.375 384l3.698 74.999l-75.862-52.719l-76.287 52.769L183.625 384h-32.039l-5.522 112h36.692l73.413-50.78L329.242 496h36.694l-5.522-112zm87.034-229.086l-2.194-48.054L372.7 80.933l-25.932-40.519l-48.055-2.2L256 16.093l-42.713 22.126l-48.055 2.2L139.3 80.933L98.785 106.86l-2.194 48.054l-22.127 42.714l22.127 42.715l2.2 48.053l40.509 25.927l25.928 40.52l48.055 2.195L256 379.164l42.713-22.126l48.055-2.195l25.928-40.52l40.518-25.923l2.195-48.053l22.127-42.715Zm-31.646 76.949L382 270.377l-32.475 20.78l-20.78 32.475l-38.515 1.76L256 343.125l-34.234-17.733l-38.515-1.76l-20.78-32.475L130 270.377l-1.759-38.514l-17.741-34.235l17.737-34.228L130 124.88l32.471-20.78l20.78-32.474l38.515-1.76L256 52.132l34.234 17.733l38.515 1.76l20.78 32.474L382 124.88l1.759 38.515l17.741 34.233Z"
            /></svg
          >
          <div class="">
            <p class="">Bronze Tier</p>
            <p class="text-xs">$2 per month</p>
          </div>
        </div>
        <div class="flex-grow border-t border-surface-300-600-token"></div>
      </div>
      {#each SUPPORTERS?.bronze as { name, date }}
        <div
          class="h-fit bg-surface-200-700-token text-token p-4 rounded-container-token flex flex-col items-center"
        >
          <p class="text-xl font-bold">{name}</p>
          <p class="text-sm font-normal w-fit">
            Since {new Date(date).toLocaleDateString()}
          </p>
        </div>
      {/each}
    {/if}
  </div>
{:else}
  <p class="font-ornament my-40 text-8xl">8</p>
{/if}
{#if PUBLIC_KOFI_LINK}
  <div
    class="variant-soft-surface rounded-container-token flex flex-col gap-1 items-center p-4"
  >
    <Avatar
      initials=":)"
      width="w-16"
      rounded="rounded-full"
      class="mx-auto flex-shrink-0 text-token"
    />
    <a
      href="{PUBLIC_KOFI_LINK}/tiers"
      class="btn bg-secondary-hover-token underline font-bold whitespace-pre-wrap"
      target="_blank"
      rel="noopener noreferrer">Get your name or company listed here</a
    >
  </div>
{/if}
