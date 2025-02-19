<script lang="ts">
  import { page } from '$app/state';
  import { ALL_YARN_WEIGHTS, yarnWeightIcons } from '$lib/constants';

  let highlight = $state(null);

  $effect(() => {
    highlight = page.url.searchParams.get('highlight') || null;
    if (highlight) {
      const el = document.getElementById(highlight);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  const yarnDetails = [
    {
      standard_name: '0: Lace',
      icon: yarnWeightIcons.find((n) => n.name === '0').icon,
      wpi: '',
      ply: '',
    },
    {
      standard_name: '0: Lace',
      icon: yarnWeightIcons.find((n) => n.name === '0').icon,
      wpi: '',
      ply: '1',
    },
    {
      standard_name: '0: Lace',
      icon: yarnWeightIcons.find((n) => n.name === '0').icon,
      wpi: '',
      ply: '2',
    },
    {
      standard_name: '0: Lace',
      icon: yarnWeightIcons.find((n) => n.name === '0').icon,
      wpi: '',
      ply: '3',
    },
    {
      standard_name: '1: Super Fine',
      icon: yarnWeightIcons.find((n) => n.name === '1').icon,
      wpi: '14',
      ply: '4',
    },
    {
      standard_name: '2: Fine',
      icon: yarnWeightIcons.find((n) => n.name === '2').icon,
      wpi: '12',
      ply: '5',
    },
    {
      standard_name: '3: Light',
      icon: yarnWeightIcons.find((n) => n.name === '3').icon,
      wpi: '11',
      ply: '8',
    },
    {
      standard_name: '4: Medium',
      icon: yarnWeightIcons.find((n) => n.name === '4').icon,
      wpi: '9',
      ply: '10',
    },
    {
      standard_name: '4: Medium',
      icon: yarnWeightIcons.find((n) => n.name === '4').icon,
      wpi: '8',
      ply: '10',
    },
    {
      standard_name: '5: Bulky',
      icon: yarnWeightIcons.find((n) => n.name === '5').icon,
      wpi: '7',
      ply: '12',
    },
    {
      standard_name: '6: Super Bulky',
      icon: yarnWeightIcons.find((n) => n.name === '6').icon,
      wpi: '5-6',
    },
    {
      standard_name: '7: Jumbo',
      icon: yarnWeightIcons.find((n) => n.name === '7').icon,
      wpi: '0-4',
    },
  ];
  const yarnChart = ALL_YARN_WEIGHTS.map((weight, index) => {
    const details = yarnDetails[index];
    return {
      ...weight,
      ...details,
    };
  });
</script>

<div class="flex flex-col gap-4">
  <div class="mt-4 flex flex-col gap-2">
    <h2 class="h2 text-gradient">Yarn Weights</h2>
    <p class="text-sm">
      Based on <a
        href="https://www.ravelry.com/help/yarn/weights"
        class="link"
        target="_blank">Ravelry Standard Yarn Weights</a
      >
    </p>
  </div>
  <div class="overflow-x-auto">
    <table
      class="border-separate border-spacing-0 w-full border-surface-300-700 border rounded-container overflow-hidden text-left"
    >
      <thead class="bg-surface-200-800">
        <tr class="">
          <th class="min-w-[160px]"
            ><p>Name</p>
            <p class="text-sm font-normal">Used in this app</p></th
          >
          <th class="min-w-[110px]"
            ><p>Ply</p>
            <p class="text-sm font-normal">For UK, NZ, AU</p></th
          >
          <th class="min-w-[140px]"
            ><p>Wraps Per Inch</p>
            <p class="text-sm font-normal">(wpi)</p></th
          >
          <th class="w-[255px] min-w-[250px]">
            <p>Standard Name & Icon</p>
            <p>
              <a
                href="https://www.craftyarncouncil.com/standards/yarn-weight-system"
                target="_blank"
                class="link text-sm font-normal"
                >Craft Yarn Council's Yarn Standards</a
              >
            </p></th
          >
        </tr>
      </thead>
      <tbody
        class="[&>tr:nth-child(odd)]:bg-surface-50-950 [&>tr:nth-child(even)]:bg-surface-100-900"
      >
        {#each yarnChart as { name, id, wpi, ply, standard_name, icon }}
          <tr
            id={name}
            class=" scroll-mt-20"
            class:!bg-primary-50-950={highlight === name}
            onclick={() => {
              if (highlight !== name) {
                highlight = name;
                page.url.searchParams.set('highlight', name);
                history.replaceState(history.state, '', page.url);
              } else {
                highlight = null;
                page.url.searchParams.delete('highlight');
                history.replaceState(history.state, '', page.url);
              }
            }}
          >
            <td class="">{name}</td>
            <td
              >{#if ply}{ply} ply{:else}-{/if}</td
            >
            <td
              >{#if wpi}
                {wpi} wpi{:else}-
              {/if}</td
            >

            <td class=""
              ><div class="flex flex-wrap items-center gap-2 justify-between">
                {standard_name}
                {@html icon}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  table th,
  table td {
    padding: 6px 12px;
  }
  table th {
    vertical-align: top;
  }
</style>
