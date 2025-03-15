<script lang="ts">
  import { toast } from '$lib/state';
  import type { LocationType } from '$lib/types';
  import { ClipboardCopyIcon } from '@lucide/svelte';

  interface Props {
    location: LocationType;
  }
  let { location }: Props = $props();
</script>

<div class="mt-8 mb-2 flex flex-col gap-4 p-2 lg:p-4">
  <h4 class="h4">{location.label}</h4>
  <div class="flex w-full flex-col gap-4">
    <div class="items-s flex flex-col gap-2">
      <p class="text-sm">Latitude, Longitude:</p>
      <p class="code w-fit !text-base select-all">
        {location.lat}, {location.lng}
      </p>
      <button
        class="btn hover:preset-tonal w-fit"
        onclick={() => {
          const latlng = `${location.lat}, ${location.lng}`;
          try {
            window.navigator.clipboard.writeText(latlng);
            toast.trigger({
              message: 'Copied',
              category: 'success',
            });
          } catch {
            toast.trigger({
              message: 'Unable to copy to clipboard',
              category: 'error',
            });
          }
        }}
      >
        <ClipboardCopyIcon />
        Copy Lat, Lng
      </button>
    </div>

    <a
      href="https://www.geonames.org/{location.id}"
      target="_blank"
      class="link"
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
