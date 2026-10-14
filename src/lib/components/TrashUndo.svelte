<!-- The quick undo for something just moved to the Trash, shown in the list
where it was, so it's right there to undo -->

<script lang="ts">
  import { Undo2Icon } from '@lucide/svelte';
  import type { Attachment } from 'svelte/attachments';

  let {
    label,
    onundo,
    focus = false,
    onfocused,
    fill = false,
  }: {
    label: string;
    onundo: () => void;
    /** Takes keyboard focus, as the Delete button that was pressed is gone */
    focus?: boolean;
    onfocused?: () => void;
    /** Fills the slot its item left, stacking when that's narrow */
    fill?: boolean;
  } = $props();

  const takeFocus: Attachment<HTMLButtonElement> = (button) => {
    if (!focus) return;
    button.focus({ preventScroll: true });
    onfocused?.();
  };
</script>

<div class={['w-full', fill && '@container h-full']}>
  <div
    class={[
      'card preset-tonal-surface flex w-full items-center gap-2 text-sm',
      fill
        ? 'h-full flex-col justify-center p-3 text-center @xs:flex-row @xs:justify-between @xs:p-2 @xs:pl-4 @xs:text-left'
        : 'justify-between p-2 pl-4 text-left',
    ]}
    role="status"
  >
    <span class={fill ? 'line-clamp-3 @xs:line-clamp-1' : 'line-clamp-1'}
      >Moved {label} to the Trash</span
    >
    <button
      type="button"
      class="btn btn-sm hover:preset-tonal-surface"
      onclick={onundo}
      {@attach takeFocus}
    >
      <Undo2Icon />
      Undo
    </button>
  </div>
</div>
