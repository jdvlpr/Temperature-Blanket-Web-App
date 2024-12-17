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
  <span class="flex items-center label gap-1">
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
    <span>Yarn Weight</span>
    <a
      aria-label="See the yarn weights chart"
      href="/blog/yarn-weights{selectedYarnWeightId
        ? `?highlight=${ALL_YARN_WEIGHTS.find((n) => n.id === selectedYarnWeightId)?.name}`
        : ''}"
      class="link"
      target="_blank"
      title="See the yarn weights chart"
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-5 flex-shrink-0"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
        />
      </svg></a
    >
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
