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
    {@html ICONS.filter}
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
