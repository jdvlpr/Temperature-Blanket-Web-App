<script lang="ts">
  import { ALL_YARN_WEIGHTS, ICONS } from '$lib/constants';
  import type { YarnWeight } from '$lib/types';
  import { pluralize } from '$lib/utils';
  import { brands } from '$lib/yarns/brands';

  export let selectedBrandId = '';
  export let selectedYarnWeightId = '';

  const yarnWeightIds: YarnWeight['id'][] = [
    ...new Set(
      brands
        .filter((brand) => {
          if (!selectedBrandId) return true;
          return brand.id === selectedBrandId;
        })
        .flatMap((brand) =>
          brand.yarns
            .filter((yarn) => yarn.weightId)
            .map((yarn) => yarn.weightId),
        ),
    ),
  ];

  if (!yarnWeightIds.length || !yarnWeightIds.includes(selectedYarnWeightId))
    selectedYarnWeightId = '';

  const yarnWeights = ALL_YARN_WEIGHTS.filter((y) =>
    yarnWeightIds.includes(y.id),
  ).map((n) => {
    const numberOfYarns = brands
      .filter((brand) => {
        if (!selectedBrandId) return true;
        return brand.id === selectedBrandId;
      })
      .flatMap((brand) => {
        return brand.yarns.filter((yarn) => yarn.weightId === n.id).length;
      })
      .reduce((partialSum, a) => partialSum + a, 0);

    return {
      ...n,
      numberOfYarns,
    };
  });
</script>

<label class="label text-left">
  <span class="flex items-center label gap-1">
    <!-- {@html ICONS.filter} -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 20 20"
      ><path
        fill="currentColor"
        d="M2.75 4a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5zM2 9.25C2 8.56 2.56 8 3.25 8h13.5a1.25 1.25 0 1 1 0 2.5H3.25C2.56 10.5 2 9.94 2 9.25m0 5.5c0-.966.784-1.75 1.75-1.75h12.5a1.75 1.75 0 1 1 0 3.5H3.75A1.75 1.75 0 0 1 2 14.75"
      /></svg
    >
    Yarn Weight
  </span>
  <select class="select" bind:value={selectedYarnWeightId} on:change>
    <option value="">All</option>
    {#each yarnWeights as { name, id, numberOfYarns }}
      <option value={id}
        >{name} ({numberOfYarns} {pluralize('yarn', numberOfYarns)})</option
      >
    {/each}
  </select>
</label>
