<script>
  import { SendIcon } from '@lucide/svelte';
  import AddToGallery from '../modals/AddToGallery.svelte';
  import { dialog } from '$lib/state';

  let { isPrimary = false } = $props();
</script>

<button
  class={[
    'btn w-fit whitespace-pre-wrap',
    isPrimary
      ? 'bg-primary-50-950 border-primary-500 hover:preset-tonal-primary border'
      : 'hover:preset-tonal-surface',
  ]}
  onclick={() =>
    dialog.trigger({
      type: 'component',
      component: {
        ref: AddToGallery,
      },
    })}
  title="Show Send to Gallery Modal"
>
  <SendIcon />
  Send to Project Gallery
</button>
