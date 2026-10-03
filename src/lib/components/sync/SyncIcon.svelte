<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- Where a saved project is kept, as a small cloud icon beside its title. The
words are for hover and screen readers. -->

<script lang="ts">
  import type { SyncLabel } from '$lib/sync/status.svelte';
  import {
    CloudAlertIcon,
    CloudCheckIcon,
    CloudOffIcon,
    CloudUploadIcon,
  } from '@lucide/svelte';

  let { label }: { label: SyncLabel } = $props();

  const ICONS = {
    synced: CloudCheckIcon,
    waiting: CloudUploadIcon,
    error: CloudAlertIcon,
    local: CloudOffIcon,
  };

  const TONES = {
    success: 'text-success-700-300',
    warning: 'text-warning-700-300',
    error: 'text-error-700-300',
    surface: 'opacity-60',
  };

  const Icon = $derived(ICONS[label.icon]);
</script>

<span
  class="inline-flex shrink-0 {TONES[label.tone]}"
  title={label.text}
  data-testid="sync-label"
>
  <Icon class="size-4 shrink-0" aria-hidden="true" />
  <span class="sr-only">{label.text}</span>
</span>
