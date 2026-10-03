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
  }: {
    label: string;
    onundo: () => void;
    /** Takes keyboard focus, as the Delete button that was pressed is gone */
    focus?: boolean;
    onfocused?: () => void;
  } = $props();

  const takeFocus: Attachment<HTMLButtonElement> = (button) => {
    if (!focus) return;
    button.focus({ preventScroll: true });
    onfocused?.();
  };
</script>

<div
  class="card preset-tonal-surface flex w-full items-center justify-between gap-2 p-2 pl-4 text-left text-sm"
  role="status"
>
  <span class="line-clamp-1">Moved {label} to the Trash</span>
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
