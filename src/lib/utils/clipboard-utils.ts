import { toast, type ToastSettings } from '$lib/state/page-state.svelte';

/**
 * Copies text (or clipboard items, like an image) and confirms it with a toast, which screen readers announce.
 * Returns whether the copy worked.
 */
export async function copyToClipboard(
  data: string | ClipboardItem[],
  success: string | Omit<ToastSettings, 'category'>,
  errorMessage = 'Unable to copy to clipboard',
): Promise<boolean> {
  try {
    if (typeof data === 'string') await navigator.clipboard.writeText(data);
    else await navigator.clipboard.write(data);
  } catch {
    toast.trigger({ message: errorMessage, category: 'error' });
    return false;
  }
  toast.trigger({
    ...(typeof success === 'string' ? { message: success } : success),
    category: 'success',
  });
  return true;
}
