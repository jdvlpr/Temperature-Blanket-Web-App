<script lang="ts">
  import type { LocationType } from '$lib/types';
  import { GlobeIcon, MapPinnedIcon, PersonStandingIcon } from '@lucide/svelte';

  interface Props {
    location: LocationType;
  }
  let { location }: Props = $props();
</script>

<div class="mt-8 mb-2 flex flex-col gap-4 p-2 lg:p-4">
  <div class="flex flex-col">
    <h4 class="h4">{location.label}</h4>
  </div>
  <div class="flex w-full flex-col gap-4">
    {#if location.fclName}
      <p>
        <MapPinnedIcon class="relative -top-[1px] mr-1 inline size-5" /> Class:
        <span class="badge bg-surface-100-900 text-base"
          >{location.fclName}</span
        >
      </p>
    {/if}
    {#if location.population}
      <p>
        <PersonStandingIcon class="relative -top-[1px] mr-1 inline size-5" /> Population:
        <span class="badge bg-surface-100-900 text-base"
          >{location.population}</span
        >
      </p>
    {/if}
    <div class="items-s flex flex-col gap-2">
      <p class="">
        <GlobeIcon class="relative -top-[1px] mr-1 inline size-5" /> Latitude, Longitude:
        <span class=" badge bg-surface-100-900 text-base select-all">
          {location.lat}, {location.lng}
        </span>
      </p>
    </div>

    <a
      href="https://www.geonames.org/{location.id}"
      target="_blank"
      class="link btn hover:preset-tonal w-fit"
      >More info from GeoNames <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-external-link relative -top-[2px] inline size-4"
        ><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path
          d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
        /></svg
      ></a
    >
  </div>
</div>
