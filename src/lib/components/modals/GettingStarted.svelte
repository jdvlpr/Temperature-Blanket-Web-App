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
  import { getModalStore } from '@skeletonlabs/skeleton';
  import ModalShell from './ModalShell.svelte';
  import Step1 from './gettingStartedSteps/Step1.svelte';
  import Step2 from './gettingStartedSteps/Step2.svelte';
  import Step3 from './gettingStartedSteps/Step3.svelte';
  import Step4 from './gettingStartedSteps/Step4.svelte';
  import Step5 from './gettingStartedSteps/Step5.svelte';

  const modalStore = getModalStore();
  interface Props {
    parent?: any;
  }

  let { parent }: Props = $props();

  // Source Data
  const steps = [
    { component: Step1, label: 'Step 1' },
    { component: Step2, label: 'Step 2' },
    { component: Step3, label: 'Step 3' },
    { component: Step4, label: 'Step 4' },
    { component: Step5, label: 'Step 5' },
  ];

  // Reactive
  let currentStep = $state(0);
  const isFirstStep = $derived(currentStep === 0);
  const isLastStep = $derived(currentStep === steps.length - 1);

  /** Determine if on the current step. */
  function isCurrentStep(index: number) {
    return currentStep === index;
  }

  /** Jump to a particular step. */
  function setStep(index: number) {
    currentStep = index;
  }

  /** Progress to the previous step. */
  function prevStep() {
    currentStep--;
  }

  /** Progress to the next step. */
  function nextStep() {
    currentStep++;
  }
</script>

<ModalShell {parent} hideCloseButton={true}>
  <div class="w-full">
    <!-- Stepper -->
    <div
      class="space-y-8 flex flex-col justify-between items-between min-h-[85vh] sm:min-h-[530px]"
    >
      <!-- Timeline -->
      <div class="relative">
        <!-- Numerals -->
        <div class="flex justify-between items-center gap-4">
          {#each steps as step, i}
            <!-- Numeral Button -->
            <button
              class="btn-icon btn-icon-sm rounded-full {isCurrentStep(i)
                ? 'preset-filled-primary-500'
                : 'preset-filled-surface-200-800'}"
              onclick={() => setStep(i)}
              title={step.label}
            >
              <span class="font-bold">{i + 1}</span>
            </button>
          {/each}
        </div>
        <!-- Line -->
        <hr
          class="hr !border-surface-200-800 absolute top-[50%] left-0 right-0 z-[-1]"
        />
      </div>
      <!-- Loop all steps -->
      {#each steps as step, i (step)}
        <!-- Filter to current step only -->
        {#if isCurrentStep(i)}
          <!-- Individual steps -->
          <div class="flex flex-col items-center gap-2"><step.component /></div>
        {/if}
      {/each}
      <!-- Navigation -->
      <nav class="flex justify-between items-center gap-4">
        <!-- Back Button -->
        <button
          type="button"
          class="btn preset-tonal hover:preset-filled"
          onclick={prevStep}
          disabled={isFirstStep}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>

          <span>Previous</span>
        </button>
        {#if isLastStep}
          <button
            type="button"
            class="btn preset-tonal hover:preset-filled"
            onclick={() => {
              modalStore.close();
            }}
          >
            <span>Let's Go!</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        {:else}
          <!-- Next Button -->
          <button
            type="button"
            class="btn preset-tonal hover:preset-filled"
            onclick={nextStep}
            disabled={isLastStep}
          >
            <span>Next</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        {/if}
      </nav>
    </div>
  </div>
</ModalShell>
