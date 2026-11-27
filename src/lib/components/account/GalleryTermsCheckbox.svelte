<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- "I agree to the Gallery terms", in the Publish dialogs before an
account's first page (App Store guideline 1.2): required, once per account
(galleryOwner.termsAcceptedAt). The terms open in a new tab, so the dialog
stays as it is. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { ExternalLinkIcon } from '@lucide/svelte';

  let {
    checked = $bindable(false),
    disabled = false,
  }: { checked?: boolean; disabled?: boolean } = $props();
</script>

<label class="flex items-start gap-2">
  <input
    type="checkbox"
    class="checkbox mt-0.5"
    bind:checked
    {disabled}
    required
    data-testid="gallery-terms"
  />
  <span
    >I agree to the <a
      href={resolve('/terms')}
      target="_blank"
      rel="noopener"
      class="link inline-flex items-center gap-1"
      >Gallery terms<ExternalLinkIcon class="icon-sm" aria-hidden="true" /></a
    >: nothing objectionable or abusive.</span
  >
</label>
