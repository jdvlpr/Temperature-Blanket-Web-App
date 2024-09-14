<script lang="ts">
  import { ALL_YARN_WEIGHTS } from '$lib/constants';
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
  <span class="flex items-center label">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="size-4 mr-1"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
      />
    </svg>
    Filter Yarn Weight
  </span>
  <select class="select" bind:value={selectedYarnWeightId}>
    <option value="">All</option>
    {#each yarnWeights as { name, id, numberOfYarns }}
      <option value={id}
        >{name} ({numberOfYarns} {pluralize('yarn', numberOfYarns)})</option
      >
    {/each}
  </select>
</label>
