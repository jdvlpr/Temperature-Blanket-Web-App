<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script lang="ts">
  import CloseButton from '$lib/components/modals/CloseButton.svelte';
  import { CheckIcon } from '@lucide/svelte';

  interface Props {
    onSave: any;
    onClose: any;
    saveText?: string;
    disabled?: boolean;
  }

  let {
    onSave,
    onClose,
    saveText = 'Save',
    disabled = false,
  }: Props = $props();
</script>

<div
  class="flex flex-wrap items-center gap-x-2 gap-y-2 justify-center mx-auto w-full"
>
  <CloseButton {onClose} text="Cancel" />

  <button
    class="btn preset-filled-primary-500"
    onclick={onSave}
    {disabled}
    title={saveText}
  >
    <CheckIcon />
    {saveText}
  </button>
</div>
