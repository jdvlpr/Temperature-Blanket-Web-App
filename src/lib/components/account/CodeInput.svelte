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

<!-- A 6-digit code field. Accepts pasted codes with spaces or dashes, keeps
     iOS/Android one-time-code autofill (one input, not six boxes), and submits
     its form on the sixth digit once the rest of the form is filled in. -->
<script lang="ts">
  let {
    value = $bindable(''),
    label = 'Code',
    disabled = false,
  }: { value?: string; label?: string; disabled?: boolean } = $props();

  function oninput(event: Event & { currentTarget: HTMLInputElement }) {
    const input = event.currentTarget;
    value = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = value;
    if (value.length === 6 && input.form?.checkValidity())
      input.form.requestSubmit();
  }
</script>

<label class="label">
  <span class="label-text">{label}</span>
  <input
    type="text"
    class="input h-14 text-center font-mono text-3xl tracking-[0.4em] indent-[0.4em]"
    inputmode="numeric"
    autocomplete="one-time-code"
    autocapitalize="off"
    spellcheck="false"
    enterkeyhint="go"
    pattern={'[0-9]{6}'}
    placeholder="······"
    title="The 6-digit code from the email"
    required
    {value}
    {oninput}
    {disabled}
  />
</label>
