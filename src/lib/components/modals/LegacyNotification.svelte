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
  let { v } = $props();
</script>

<div class="flex flex-col items-start gap-4 p-4">
  <h2 class="font-bold my-2 text-xl">There's Been An Update</h2>

  <p>
    Some breaking changes were made to improve the accuracy and functionality of
    this site. Because your project was made before these changes, unfortunately
    it can't be loaded.
  </p>

  <p>
    You can <a
      href="/changelog#{v}"
      target="_blank"
      rel="nofollow noreferrer"
      class="link"
      >click here to read more details about the changes that caused this
      notification.</a
    >
  </p>

  <p>
    Please start a new project after closing this notification. Sorry for any
    inconvenience!
  </p>
</div>
