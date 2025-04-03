<script>
  import { modal, weather } from '$lib/state';
  import { CloudCogIcon, CloudLightningIcon } from '@lucide/svelte';
  import ChooseWeatherSource from '../modals/ChooseWeatherSource.svelte';
</script>

<button
  class="btn hover:preset-tonal w-fit"
  onclick={async () => {
    modal.trigger({
      type: 'component',
      component: { ref: ChooseWeatherSource },
    });
  }}
>
  <CloudCogIcon />
  <span class="text-left whitespace-pre-wrap"
    >Weather Source: {weather.isUserEdited
      ? 'Custom'
      : weather.source.name}</span
  >
</button>
