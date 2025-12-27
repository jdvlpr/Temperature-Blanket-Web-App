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
  import { dialog } from '$lib/state';
  import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';
  import Step1 from './gettingStartedSteps/Step1.svelte';
  import Step2 from './gettingStartedSteps/Step2.svelte';
  import Step3 from './gettingStartedSteps/Step3.svelte';
  import Step4 from './gettingStartedSteps/Step4.svelte';
  import Step5 from './gettingStartedSteps/Step5.svelte';

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

<div class="w-full p-4 pt-12">
  <!-- Stepper -->
  <div class="items-between flex flex-col justify-between space-y-4">
    <!-- Timeline -->
    <div class="relative">
      <!-- Numerals -->
      <div
        class="bg-surface-100 dark:bg-surface-950 rounded-container flex h-12 items-center justify-between gap-2 px-2"
      >
        {#each steps as step, i}
          <!-- Numeral Button -->
          <button
            class={[
              'btn-icon rounded-full',
              isCurrentStep(i)
                ? 'preset-filled-primary-500 btn-icon-md max-w-[68px] min-w-[36px] flex-auto'
                : 'preset-filled-surface-200-800 btn-icon-sm min-w-[24px] shrink',
            ]}
            onclick={() => setStep(i)}
            title={step.label}
          >
            <span class="font-bold">{i + 1}</span>
          </button>
          {#if i < steps.length - 1}
            <div class="border-surface-300 w-full border-t"></div>
          {/if}
        {/each}
      </div>
      <!-- Line -->
      <hr
        class="hr border-surface-200-800! absolute top-[50%] right-0 left-0 z-[-1]"
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
    <nav class="flex items-center justify-between gap-4">
      <!-- Back Button -->
      <button
        type="button"
        class="btn preset-tonal hover:preset-filled"
        onclick={prevStep}
        disabled={isFirstStep}
      >
        <ArrowLeftIcon />
        Previous
      </button>
      {#if isLastStep}
        <button
          type="button"
          class="btn preset-tonal hover:preset-filled"
          onclick={() => {
            dialog.close();
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
          Next
          <ArrowRightIcon />
        </button>
      {/if}
    </nav>
  </div>
</div>
