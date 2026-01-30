<script>
  import { dialog, project, weather } from '$lib/state';
  import { CloudCogIcon } from '@lucide/svelte';
  import ChooseWeatherSource from '../modals/ChooseWeatherSource.svelte';
</script>

<button
  class="btn hover:preset-tonal-surface w-fit"
  disabled={project.status.loading}
  onclick={async () => {
    dialog.trigger({
      type: 'component',
      component: { ref: ChooseWeatherSource },
      options: {
        size: 'medium',
      },
    });
  }}
>
  <CloudCogIcon />
  <span class="text-left whitespace-pre-wrap"
    >Weather Source: {weather.isUserEdited ? 'Custom' : weather.source.name}
  </span>
</button>
