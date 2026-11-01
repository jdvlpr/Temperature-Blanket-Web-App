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

<!-- Yarn Weights: the chart of weights and their names (Basics; once a blog
post). Links can name a row to mark: ?highlight=<name>. -->

<script lang="ts">
  import RelatedGuides from '#lib/components/docs/RelatedGuides.svelte';
  import YarnWeightChart from '#lib/components/YarnWeightChart.svelte';
</script>

<p>
  The same thickness of yarn goes by different names around the world. This
  chart puts them side by side: the name this site uses, the ply used in the UK,
  New Zealand and Australia, wraps per inch, and the standard weight number.
  Choose a row to mark it.
</p>

<YarnWeightChart />

<RelatedGuides slugs={['match-your-yarn']} />
