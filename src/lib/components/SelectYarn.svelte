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
  import { ALL_YARN_WEIGHTS, ICONS } from '$lib/constants';
  import { defaultYarn } from '$lib/state';
  import { delay, pluralize, stringToBrandAndYarnDetails } from '$lib/utils';
  import { brands } from '$lib/yarns/brands';
  import autocomplete from 'autocompleter';
  import { onMount, untrack } from 'svelte';

  interface Props {
    selectedBrandId?: string;
    selectedYarnId?: string;
    selectedYarnWeightId?: string;
    context?: string;
    disabled?: boolean;
    preselectDefaultYarn?: boolean;
    onselectautocomplete?;
  }

  let {
    selectedBrandId = $bindable(),
    selectedYarnId = $bindable(),
    selectedYarnWeightId = '',
    context = '',
    disabled = false,
    preselectDefaultYarn = true,
    onselectautocomplete = () => {},
  }: Props = $props();

  let inputElement = $state();
  let autocompleteContainer = $state();
  let inputGroup = $state();
  let forceDisplayAll = $state(false);
  let inputValue = $state('');
  let showingAutocomplete = $state(false);

  let allYarns = $state(getAllYarns());

  function onSelectedYarnWeightIdChange() {
    if (selectedBrandId || selectedYarnId) {
      inputValue = getYarnValue({
        brandId: selectedBrandId,
        yarnId: selectedYarnId,
      });
    }
  }

  function getYarnValue({ brandId, yarnId }) {
    let yarn = allYarns.find(
      (yarn) => yarn.meta.brandId === brandId && yarn.meta.yarnId === yarnId,
    );

    let yarnWeight = yarn?.meta.yarnWeightId
      ? ` (${ALL_YARN_WEIGHTS.find((y) => y.id === yarn?.meta.yarnWeightId)?.name})`
      : null;

    if (yarn)
      return `${yarn.meta.brandName} - ${yarn.meta.yarnName}${yarnWeight || ''}`;

    yarn = allYarns.find((yarn) => yarn?.meta.brandId === brandId);

    if (yarn) {
      const numberOfYarns = brands
        .find((brand) => brand.id === yarn.meta.brandId)
        .yarns.filter((yarn) => {
          if (!selectedYarnWeightId) return true;
          return yarn.weightId === selectedYarnWeightId;
        }).length;

      return `${yarn.meta.brandName} (${numberOfYarns} ${pluralize(
        'yarn',
        +numberOfYarns,
      )})`;
    }

    return '';
  }

  function getSearchText(text) {
    if (text.includes('(')) {
      text = text.split('(')[0].trim();
    }
    if (text.includes('-')) {
      text = text.split('-');
    }
    if (text.includes(',')) {
      text = text.split(',');
    }
    return text;
  }

  function matches(find, n) {
    find = find?.toLowerCase().trim() || null;
    return (
      n.meta?.brandName?.toLowerCase().includes(find) ||
      n.meta?.yarnName?.toLowerCase().includes(find)
    );
  }

  function boldMe(string, searchText) {
    const regex = new RegExp(`(${searchText})`, 'gi'); // Case-insensitive search
    return string.replace(
      regex,
      "<span class='font-bold text-primary-700-300'>$1</span>",
    );
  }

  function getAllYarns(selectedYarnWeightId = null) {
    return brands.flatMap((brand) => {
      return brand.yarns
        .filter((yarn) => {
          if (!selectedYarnWeightId) return true;
          return yarn.weightId === selectedYarnWeightId;
        })
        .map((yarn) => {
          const totalBrandColorways = brand.yarns
            .filter((yarn) => {
              if (!selectedYarnWeightId) return true;
              return yarn.weightId === selectedYarnWeightId;
            })
            .flatMap((n) =>
              n.colorways.reduce((a, b) => {
                return a + b.colors.length;
              }, 0),
            )
            .reduce((a, b) => {
              return a + b;
            }, 0);
          const meta = {
            brandName: brand.name,
            brandId: brand.id,
            totalBrandYarns: brand.yarns.filter((yarn) => {
              if (!selectedYarnWeightId) return true;
              return yarn.weightId === selectedYarnWeightId;
            }).length,
            totalBrandColorways,
          };
          return {
            group: JSON.stringify(meta),
            meta: {
              ...meta,
              yarnName: yarn.name,
              yarnId: yarn.id,
              yarnWeightId: yarn?.weightId,
              numberOfColorways: yarn.colorways.reduce((a, b) => {
                return a + b.colors.length;
              }, 0),
            },
          };
        });
    });
  }

  onMount(() => {
    if (selectedBrandId || selectedYarnId) {
      inputValue = getYarnValue({
        brandId: selectedBrandId,
        yarnId: selectedYarnId,
      });
      forceDisplayAll = true;
    } else if (defaultYarn.value && preselectDefaultYarn) {
      let { brandId, yarnId } = stringToBrandAndYarnDetails(defaultYarn.value);
      if (brandId) selectedBrandId = brandId;
      if (yarnId) selectedYarnId = yarnId;
      inputValue = getYarnValue({
        brandId: selectedBrandId,
        yarnId: selectedYarnId,
      });
    }

    autocomplete({
      onSelect: function (item, input) {
        inputValue = `${item.meta.brandName} - ${item.meta.yarnName}${
          item.meta.yarnWeightId
            ? ` (${ALL_YARN_WEIGHTS.find((y) => y.id === item.meta.yarnWeightId).name})`
            : ''
        }`;
        selectedBrandId = item.meta.brandId;
        selectedYarnId = item.meta.yarnId;
        showingAutocomplete = false;
        inputElement.blur();
        onselectautocomplete({
          selectedBrandId,
          selectedYarnId,
        });
      },
      input: inputElement,
      disableAutoSelect: true,
      minLength: 0,
      showOnFocus: true,
      container: autocompleteContainer,
      emptyMsg: 'No matching yarn',
      customize: function (input, inputRect, container, maxHeight) {
        const group = inputGroup?.getBoundingClientRect();
        if (group) {
          container.style.width = `${group.width}px`;
          container.style.left = `${group.left}px`;
        }
        container.style.zIndex = `12000`;
        if (maxHeight > 480) container.style.maxHeight = `480px`;
        container.style.overflowY = `scroll`;
        if (context === 'modal') {
          container.style.position = 'fixed';
          container.style.top = `${inputRect.bottom}px`;
        }
      },
      render: function (item, currentValue) {
        var div = document.createElement('div');

        const searchText = getSearchText(currentValue);

        let yarn = item.meta.yarnName;

        let yarnWeight = item.meta.yarnWeightId
          ? ALL_YARN_WEIGHTS.find((y) => y.id === item.meta.yarnWeightId).name
          : null;

        if (currentValue) {
          if (typeof searchText !== 'string' && searchText.length === 2) {
            if (matches(searchText[0], item))
              yarn = boldMe(yarn, searchText[0].trim());
            if (matches(searchText[1], item))
              yarn = boldMe(yarn, searchText[1].trim());
          } else {
            yarn = boldMe(yarn, searchText);
          }
        }

        div.innerHTML = `<div class="inline-block ml-4">
                            ${yarn} <span class="text-sm opacity-60">(${yarnWeight ? `${yarnWeight}, ` : ''}${item.meta.numberOfColorways.toLocaleString()} colorways)</span>
                        </div>`;
        div.dataset.id = `${item.meta.brandId}-${item.meta.yarnId}`;
        div.classList.add('selectable-yarn-list-item');
        return div;
      },
      renderGroup: function (groupName, currentValue) {
        var div = document.createElement('div');
        const meta = JSON.parse(groupName);
        const item = { meta };

        let { brandName, brandId, totalBrandColorways, totalBrandYarns } = meta;

        const searchText = getSearchText(currentValue);

        if (currentValue) {
          if (typeof searchText !== 'string' && searchText.length === 2) {
            if (matches(searchText[0], item))
              brandName = boldMe(brandName, searchText[0].trim());
            if (matches(searchText[1], item))
              brandName = boldMe(brandName, searchText[1].trim());
          } else {
            // brand = boldMe(brand, searchText);
            brandName = boldMe(brandName, searchText);
          }
        }

        div.innerHTML = `<span class="font-bold">${brandName}</span> <span class="text-sm opacity-60">(${totalBrandYarns} ${pluralize(
          'yarn',
          +totalBrandYarns,
        )}, ${totalBrandColorways.toLocaleString()} colorways)</span>`;
        div.dataset.id = brandId;
        div.classList.add('selectable-yarn-list-item');
        div.onclick = (e) => {
          e.preventDefault();
          inputElement.blur();
          inputValue = `${meta.brandName} (${totalBrandYarns} ${pluralize('yarn', +totalBrandYarns)})`;
          selectedBrandId = brandId;
          selectedYarnId = '';
          forceDisplayAll = true;
          onselectautocomplete({
            selectedBrandId,
            selectedYarnId,
          });
        };
        return div;
      },
      fetch: function (text, update) {
        var suggestions = allYarns.filter((n) => {
          if (!inputValue.length || forceDisplayAll) return true;
          const searchText = getSearchText(text);

          if (typeof searchText !== 'string' && searchText.length === 2) {
            return matches(searchText[0], n) || matches(searchText[1], n);
          } else {
            return matches(searchText, n);
          }
        });
        update(suggestions);
        forceDisplayAll = false;
      },
      click: (e) => {
        forceDisplayAll = true;
        e.fetch();
      },
    });
  });

  $effect(() => {
    selectedYarnWeightId;
    untrack(() => {
      onSelectedYarnWeightIdChange();
      allYarns = getAllYarns(selectedYarnWeightId);
    });
  });
</script>

<div
  class="w-full flex flex-col justify-start md:col-span-2 gap-1"
  bind:this={inputGroup}
>
  <span class="flex items-center label gap-1">
    {@html ICONS.filter}
    Yarn Name
  </span>

  <div class="flex flex-wrap items-center justify-center gap-1">
    <div
      class="input-group input-group-divider flex grid-cols-[1fr_auto] w-full"
    >
      <input
        bind:this={inputElement}
        class="input truncate"
        {disabled}
        id="input-select-yarn"
        type="text"
        name="yarn-filter-search"
        autocomplete="off"
        onfocus={async () => {
          showingAutocomplete = true;

          if (selectedBrandId && selectedYarnId) {
            await delay(100);
            const element = document.querySelector(
              `[data-id="${selectedBrandId}-${selectedYarnId}"]`,
            );
            if (element) {
              const topPos = element.offsetTop;
              element.classList.add('selected');
              element.setAttribute('aria-selected', 'true');
              setTimeout(function () {
                document.getElementsByClassName('autocomplete')[0].scrollTo({
                  top: topPos,
                  behavior: 'smooth',
                });
              }, 10);
            }
          } else if (selectedBrandId) {
            await delay(100);
            const element = document.querySelector(
              `[data-id="${selectedBrandId}"]`,
            );
            if (element) {
              const topPos = element.offsetTop;
              setTimeout(function () {
                document.getElementsByClassName('autocomplete')[0].scrollTo({
                  top: topPos,
                  behavior: 'smooth',
                });
              }, 10);
            }
            if (inputValue.includes('(')) {
              inputValue = inputValue.split('(')?.[0]?.trim() || inputValue;
            }
          }
        }}
        onblur={() => (showingAutocomplete = false)}
        bind:value={inputValue}
        placeholder="{allYarns.length} {pluralize(
          'Yarn',
          allYarns.length,
        )} ({allYarns
          .reduce((a, b) => {
            return a + b.meta.numberOfColorways;
          }, 0)
          .toLocaleString()} colorways)"
      />
      {#if !showingAutocomplete}
        <button
          aria-label="Show All Yarns"
          {disabled}
          class="btn-icon px-2! h-10 grow-0 shrink-0 basis-0"
          onclick={() => {
            forceDisplayAll = true;
            inputElement.focus();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>
      {/if}
      {#if inputValue.length || showingAutocomplete}
        <button
          aria-label="Clear"
          {disabled}
          class="btn-icon px-2! h-10 grow-0 shrink-0 basis-0"
          onclick={async () => {
            inputValue = '';
            selectedBrandId = '';
            selectedYarnId = '';
            await delay(10);
            if (!inputValue.length) showingAutocomplete = false;
            document.getElementById('input-select-yarn')?.focus();
            onselectautocomplete({
              selectedBrandId,
              selectedYarnId,
            });
          }}
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      {/if}
    </div>
  </div>
  <div bind:this={autocompleteContainer} class="text-left"></div>
</div>
