<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- Beta Feedback: the site owner's list of what was sent with Send Feedback
(GET /api/beta/feedback; only accounts in BETA_FEEDBACK_OWNERS). How ready
people say this version is, then each one, newest first, to mark done or turn
into a GitHub issue (filled in without who sent it). Only in the beta's
build (+page.ts). -->

<script lang="ts">
  import { page } from '$app/state';
  import { signInHref } from '#lib/accounts/redirect.js';
  import AppShell from '#lib/components/AppShell.svelte';
  import {
    BTN_PRIMARY,
    BTN_SECONDARY,
    PAGE,
    PAGE_TOOL,
  } from '#lib/constants/class-constants.js';
  import {
    FEEDBACK_KINDS,
    issueUrl,
    READY_ANSWERS,
    readinessCounts,
    type FeedbackItem,
    type FeedbackStatus,
  } from '#lib/utils/beta-feedback.js';
  import {
    CheckIcon,
    ExternalLinkIcon,
    LoaderCircleIcon,
    RotateCcwIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  type Show = FeedbackStatus | 'all';

  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

  let show = $state<Show>('new');
  let items = $state<FeedbackItem[]>([]);
  let loading = $state(true);
  let problem = $state<'signed-out' | 'not-owner' | 'failed' | null>(null);

  async function load() {
    loading = true;
    problem = null;
    try {
      const response = await fetch('/api/beta/feedback');
      if (response.status === 401) problem = 'signed-out';
      else if (response.status === 403) problem = 'not-owner';
      else if (!response.ok) problem = 'failed';
      else items = (await response.json()).feedback;
    } catch {
      problem = 'failed';
    } finally {
      loading = false;
    }
  }

  onMount(load);

  async function setStatus(item: FeedbackItem, status: FeedbackStatus) {
    const before = item.status;
    item.status = status;
    const response = await fetch(`/api/beta/feedback/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!response?.ok) item.status = before;
  }

  const shown = $derived(
    show === 'all' ? items : items.filter((item) => item.status === show),
  );
  const newCount = $derived(items.filter((i) => i.status === 'new').length);
  // Read when the list loads, not on every change
  let now = $state(Date.now());
  $effect(() => {
    if (!loading) now = Date.now();
  });
  const recent = $derived(readinessCounts(items, now - TWO_WEEKS_MS));
  const allTime = $derived(readinessCounts(items));

  const kindLabel = (kind: FeedbackItem['kind']) =>
    FEEDBACK_KINDS.find(({ value }) => value === kind)?.label ?? kind;
  const readyLabel = (ready: FeedbackItem['ready']) =>
    READY_ANSWERS.find(({ value }) => value === ready)?.label;
  const percent = (part: number, total: number) =>
    total ? `${Math.round((part / total) * 100)}%` : '–';
  const date = (ms: number) =>
    new Date(ms).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  const SHOWS: { value: Show; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'done', label: 'Done' },
    { value: 'all', label: 'All' },
  ];
</script>

<svelte:head>
  <title>Beta Feedback</title>
</svelte:head>

<AppShell pageName="Beta Feedback">
  {#snippet main()}
    <main class={[PAGE, PAGE_TOOL, 'mt-2 mb-8 flex flex-col gap-6']}>
      <h2 class="h2 text-gradient mt-2 max-lg:hidden">Beta Feedback</h2>

      {#if loading}
        <p class="flex items-center gap-2">
          <LoaderCircleIcon class="animate-spin" aria-hidden="true" />
          Loading feedback…
        </p>
      {:else if problem === 'signed-out'}
        <p>Sign in with the site owner’s account to read feedback.</p>
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- signInHref is a path here -->
        <a href={signInHref(page.url)} class="{BTN_PRIMARY} w-fit">Sign In</a>
      {:else if problem === 'not-owner'}
        <p>
          Only the site owner can read feedback. Owners are the accounts listed
          in <code class="code">BETA_FEEDBACK_OWNERS</code>.
        </p>
      {:else if problem === 'failed'}
        <p>Feedback couldn’t be loaded.</p>
        <button type="button" class="{BTN_SECONDARY} w-fit" onclick={load}
          >Try Again</button
        >
      {:else}
        <section
          class="flex flex-col gap-2"
          aria-labelledby="feedback-readiness"
        >
          <h3 id="feedback-readiness" class="h4">Ready for the Main Site?</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            {#each [{ label: 'Last 2 weeks', counts: recent }, { label: 'All time', counts: allTime }] as { label, counts } (label)}
              <div class="card preset-tonal-surface flex flex-col gap-1 p-4">
                <p class="text-sm opacity-80">
                  {label} · {counts.total}
                  {counts.total === 1 ? 'answer' : 'answers'}
                </p>
                <p class="text-2xl font-bold">
                  {percent(counts.yes + counts.mostly, counts.total)}
                  <span class="text-base font-normal">ready or mostly</span>
                </p>
                <p class="text-sm">
                  Ready {counts.yes} · Mostly {counts.mostly} · Not yet {counts[
                    'not-yet'
                  ]}
                </p>
              </div>
            {/each}
          </div>
        </section>

        <section class="flex flex-col gap-4" aria-labelledby="feedback-list">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 id="feedback-list" class="h4">
              Feedback <span class="font-normal opacity-70"
                >({newCount} new)</span
              >
            </h3>
            <div class="flex gap-1" role="radiogroup" aria-label="Show">
              {#each SHOWS as option (option.value)}
                <label
                  class="btn btn-sm has-checked:preset-filled-primary-500 hover:preset-tonal-surface cursor-pointer"
                >
                  <input
                    type="radio"
                    name="feedback-show"
                    value={option.value}
                    bind:group={show}
                    class="sr-only"
                  />
                  {option.label}
                </label>
              {/each}
            </div>
          </div>

          {#if shown.length === 0}
            <p class="opacity-80">Nothing here.</p>
          {/if}

          {#each shown as item (item.id)}
            <article
              class={[
                'card preset-outlined-surface-200-800 flex flex-col gap-3 p-4',
                item.status === 'done' && 'opacity-70',
              ]}
            >
              <header class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span class="badge preset-tonal-primary"
                  >{kindLabel(item.kind)}</span
                >
                {#if readyLabel(item.ready)}
                  <span class="badge preset-tonal-surface"
                    >Ready? {readyLabel(item.ready)}</span
                  >
                {/if}
                <span class="text-sm opacity-80">{date(item.createdAt)}</span>
                <span class="text-sm opacity-80"
                  ><code class="code">{item.page}</code></span
                >
              </header>

              {#if item.message}
                <p class="whitespace-pre-wrap">{item.message}</p>
              {/if}

              <p class="text-sm opacity-80">
                {#if item.email}
                  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- mailto -->
                  <a
                    href="mailto:{item.email}?subject={encodeURIComponent(
                      'Your feedback on the beta',
                    )}"
                    class="link">{item.email}</a
                  >
                  {item.signedIn ? '(account)' : ''}
                {:else}
                  Anonymous
                {/if}
                {#if item.context.analytics}
                  · Clarity on (look for the “beta_feedback” event)
                {/if}
              </p>

              <details class="text-sm">
                <summary class="cursor-pointer opacity-80"
                  >Details{item.context.errors.length
                    ? ` · ${item.context.errors.length} ${item.context.errors.length === 1 ? 'error' : 'errors'}`
                    : ''}</summary
                >
                <dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  <dt class="opacity-70">Version</dt>
                  <dd>{item.context.version}</dd>
                  <dt class="opacity-70">Browser</dt>
                  <dd class="break-all">{item.context.userAgent}</dd>
                  <dt class="opacity-70">Screen</dt>
                  <dd>{item.context.viewport}</dd>
                  <dt class="opacity-70">Language</dt>
                  <dd>{item.context.language}</dd>
                  <dt class="opacity-70">Link</dt>
                  <dd>
                    {item.context.hadQuery
                      ? 'A project link (query not kept)'
                      : 'None'}
                  </dd>
                </dl>
                {#if item.context.errors.length}
                  <pre
                    class="pre mt-2 overflow-x-auto text-xs whitespace-pre-wrap">{item.context.errors.join(
                      '\n',
                    )}</pre>
                {/if}
              </details>

              <div class="flex flex-wrap gap-2">
                {#if item.status === 'new'}
                  <button
                    type="button"
                    class="btn btn-sm preset-tonal"
                    onclick={() => setStatus(item, 'done')}
                  >
                    <CheckIcon /> Mark Done
                  </button>
                {:else}
                  <button
                    type="button"
                    class="btn btn-sm preset-tonal"
                    onclick={() => setStatus(item, 'new')}
                  >
                    <RotateCcwIcon /> Mark New
                  </button>
                {/if}
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- GitHub -->
                <a
                  href={issueUrl(item)}
                  target="_blank"
                  rel="noopener"
                  class="btn btn-sm hover:preset-tonal-surface"
                  title="Filled in without who sent it. Check the message before posting: the repository is public"
                >
                  Create GitHub Issue
                  <ExternalLinkIcon class="icon-sm" aria-hidden="true" />
                </a>
              </div>
            </article>
          {/each}
        </section>
      {/if}
    </main>
  {/snippet}
</AppShell>
