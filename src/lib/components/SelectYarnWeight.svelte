<script lang="ts">
  import { ALL_YARN_WEIGHTS } from '$lib/constants';
  import type { YarnWeight } from '$lib/types';
  import { pluralize } from '$lib/utils';
  import { brands } from '$lib/data/yarns/brands';
  import { CircleHelpIcon, WeightIcon } from '@lucide/svelte';

  interface Props {
    selectedBrandId?: string;
    selectedYarnWeightId?: string;
    onchange?: (event: Event) => void;
  }

  let {
    selectedBrandId = '',
    selectedYarnWeightId = $bindable(),
    onchange,
  }: Props = $props();

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
  <span class="flex items-center gap-1">
    <WeightIcon class="size-4" />
    <span>Yarn Weight</span>
    <a
      aria-label="See the yarn weights chart"
      href="/blog/yarn-weights{selectedYarnWeightId
        ? `?highlight=${ALL_YARN_WEIGHTS.find((n) => n.id === selectedYarnWeightId)?.name}`
        : ''}"
      class="link top-1"
      target="_blank"
      title="See the yarn weights chart"
    >
      <CircleHelpIcon class="size-4" /></a
    >
  </span>
  <select class="select" bind:value={selectedYarnWeightId} {onchange}>
    <option value="">All</option>
    {#each yarnWeights as { name, id, numberOfYarns }}
      <option value={id}
        >{name} ({numberOfYarns} {pluralize('yarn', numberOfYarns)})</option
      >
    {/each}
  </select>
</label>
