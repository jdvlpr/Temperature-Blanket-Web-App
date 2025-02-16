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
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import { modal } from '$lib/state';

  interface Props {
    value: string;
    title: string;
    onOkay: any;
    parent: any;
  }

  let { value = $bindable(), title, onOkay, parent }: Props = $props();

  const id = 'text-input-daytime';

  function _onOkay() {
    onOkay(value);
    modal.close();
  }
</script>

<div
  class="inline-flex flex-col items-center mx-auto justify-center w-full text-center p-4"
>
  <div>
    <label for={id} class="my-2"><h3>{@html title}</h3></label>
    <p class="text-sm my-2">Hours:Minutes</p>

    <div
      class="flex flex-col gap-2 justify-center items-center my-2 w-fit mx-auto"
    >
      <input
        type="text"
        class="w-fit grow input text-xl"
        {id}
        {title}
        bind:value
      />
    </div>

    <div class="my-4">
      <SaveAndCloseButtons
        onSave={_onOkay}
        onClose={modal.close}
        disabled={!value.includes(':')}
      />
    </div>
  </div>
</div>
