<script lang="ts">
  import { FIELD_ICON } from '#lib/constants/class-constants.js';
  import { ALL_YARN_WEIGHTS } from '#lib/constants/color-constants.js';
  import { getBrands } from '#lib/data/yarns/colorways.svelte.js';
  import type { YarnWeight } from '#lib/types/yarn-types.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import { CircleQuestionMarkIcon, SpoolIcon } from '@lucide/svelte';

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
      getBrands()
        .filter((brand) => {
          if (!selectedBrandId) return true;
          return brand.id === selectedBrandId;
        })
        .flatMap((brand) =>
          brand.yarns
            .filter((yarn) => yarn.weightId)
            .map((yarn) => yarn.weightId as YarnWeight['id']),
        ),
    ),
  ];

  if (
    selectedYarnWeightId &&
    !yarnWeightIds.includes(selectedYarnWeightId as YarnWeight['id'])
  ) {
    selectedYarnWeightId = '';
  } else if (!yarnWeightIds.length) {
    selectedYarnWeightId = '';
  }

  const yarnWeights = ALL_YARN_WEIGHTS.filter((y) => {
    if (!y.id) return false;
    return yarnWeightIds.includes(y.id);
  }).map((n) => {
    const numberOfYarns = getBrands()
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

<label class="label">
  <span class="label-text flex items-start gap-1"
    >Yarn Weight <a
      aria-label="See the yarn weights chart"
      href="/blog/yarn-weights{selectedYarnWeightId
        ? `?highlight=${ALL_YARN_WEIGHTS.find((n) => n.id === selectedYarnWeightId)?.name}`
        : ''}"
      class="link"
      target="_blank"
      title="See the yarn weights chart"
    >
      <CircleQuestionMarkIcon class="icon-sm" /></a
    ></span
  >
  <div class="relative flex items-center">
    <SpoolIcon class={FIELD_ICON} />
    <select
      class="select truncate pl-14"
      bind:value={selectedYarnWeightId}
      {onchange}
    >
      <option value="">All</option>
      {#each yarnWeights as { name, id, numberOfYarns }}
        <option value={id}
          >{name} ({numberOfYarns} {pluralize('yarn', numberOfYarns)})</option
        >
      {/each}
    </select>
  </div>
</label>
