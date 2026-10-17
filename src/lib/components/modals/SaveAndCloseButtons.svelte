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

<script lang="ts">
  import DialogFooter from '#lib/components/modals/DialogFooter.svelte';
  import {
    BTN_DANGER,
    BTN_PRIMARY,
    BTN_SECONDARY,
  } from '#lib/constants/class-constants.js';
  import { Trash2Icon } from '@lucide/svelte';
  import type { Component, Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    onSave: any;
    onClose: any;
    saveText?: string;
    disabled?: boolean;
    /** Destructive: red, with a trash can */
    danger?: boolean;
    /** Only when it says more than the text, as a download */
    icon?: Component;
    /** Full-width content shown with the buttons, above them */
    above?: Snippet;
    sticky?: boolean;
    class?: ClassValue;
  }

  let {
    onSave,
    onClose,
    saveText = 'Save',
    disabled = false,
    danger = false,
    icon: Icon = danger ? Trash2Icon : undefined,
    above,
    sticky = true,
    class: className,
  }: Props = $props();
</script>

<DialogFooter {above} {sticky} class={className}>
  <button class={BTN_SECONDARY} onclick={onClose}>Cancel</button>

  <button class={danger ? BTN_DANGER : BTN_PRIMARY} onclick={onSave} {disabled}>
    {#if Icon}<Icon />{/if}
    {saveText}
  </button>
</DialogFooter>
