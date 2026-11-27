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

<!-- Gallery Reports: the site owner's list of reported gallery pages (GET
/api/gallery/reports; only accounts in BETA_FEEDBACK_OWNERS), those with new
reports first. Each shows the page (its picture for a project), why it was
reported and what was said, then Hide Page (WordPress's trash; a page
published without an account is hidden in WordPress's admin instead),
Dismiss, and Stop Publishing for This Person (hides all their pages). Apple
expects action within about a day: check daily. The account button's badge
counts pages with new reports. -->

<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { PUBLIC_WORDPRESS_BASE_URL } from '$app/env/public';
  import { signInHref } from '#lib/accounts/redirect.js';
  import { ownerReports } from '#lib/accounts/owner-reports.svelte.js';
  import AppShell from '#lib/components/AppShell.svelte';
  import {
    BTN_DANGER,
    BTN_PRIMARY,
    BTN_SECONDARY,
    PAGE,
    PAGE_TOOL,
  } from '#lib/constants/class-constants.js';
  import type { ReportedPage } from '#lib/server/gallery/reports.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { fetchProjectsByIds } from '#lib/utils/gallery-utils.js';
  import { REPORT_REASON_LABELS } from '#lib/utils/gallery-report.js';
  import { getTitleTextFromLocationsMeta } from '#lib/utils/project-utils.svelte.js';
  import {
    ExternalLinkIcon,
    EyeOffIcon,
    LoaderCircleIcon,
    RotateCcwIcon,
    UserRoundXIcon,
    XIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';

  type Show = 'new' | 'hidden' | 'dismissed' | 'all';

  let show = $state<Show>('new');
  let pages = $state<ReportedPage[]>([]);
  let loading = $state(true);
  let problem = $state<'signed-out' | 'not-owner' | 'failed' | null>(null);
  /** A project page's picture and name from the gallery, when it's there */
  let found = new SvelteMap<number, { image?: string; name: string }>();
  let busy = new SvelteSet<number>();
  /** Pages published without an account, which only WordPress's admin can hide */
  let needsAdmin = new SvelteSet<number>();

  async function load() {
    loading = true;
    problem = null;
    try {
      const response = await fetch(
        `/api/gallery/reports${show === 'all' ? '' : `?status=${show}`}`,
      );
      if (response.status === 401) problem = 'signed-out';
      else if (response.status === 403) {
        problem = 'not-owner';
        ownerReports.remember(false);
      } else if (!response.ok) problem = 'failed';
      else {
        pages = (await response.json()).pages;
        const counted = await fetch('/api/gallery/reports?count=new')
          .then((r) => r.json())
          .catch(() => ({ newCount: 0 }));
        ownerReports.remember(true, counted.newCount ?? 0);
        void loadPictures();
      }
    } catch {
      problem = 'failed';
    } finally {
      loading = false;
    }
  }

  async function loadPictures() {
    const ids = pages
      .filter((p) => p.kind === 'project' && !found.has(p.postId))
      .map((p) => p.postId);
    if (!ids.length) return;
    try {
      for (const project of await fetchProjectsByIds(ids))
        found.set(project.databaseId, {
          image:
            project.featuredImage?.node?.mediaDetails?.sizes?.[0]?.sourceUrl ??
            project.featuredImage?.node?.mediaItemUrl,
          name:
            project.projectName?.trim() ||
            getTitleTextFromLocationsMeta(project.locations),
        });
    } catch {
      // Shown without pictures
    }
  }

  onMount(load);

  async function act(
    item: ReportedPage,
    action: 'hide' | 'dismiss' | 'reopen' | 'stop' | 'allow',
  ) {
    busy.add(item.postId);
    try {
      const response = await fetch(`/api/gallery/reports/${item.postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const body =
        response.status === 204
          ? null
          : await response.json().catch(() => null);
      if (body?.code === 'NO_PUBLISHER') {
        needsAdmin.add(item.postId);
        return;
      }
      if (!response.ok) {
        toast.trigger({
          message: body?.message
            ? `${body.message}.`
            : 'That didn’t work. Try again.',
          category: 'error',
        });
        return;
      }
      toast.trigger({
        message:
          action === 'hide'
            ? 'Page hidden.'
            : action === 'stop'
              ? `Publishing stopped. ${body?.hidden ?? 0} ${body?.hidden === 1 ? 'page' : 'pages'} hidden.`
              : action === 'allow'
                ? 'They can publish again. Their hidden pages stay hidden.'
                : action === 'dismiss'
                  ? 'Reports dismissed.'
                  : 'Reports marked new.',
      });
      await load();
    } finally {
      busy.delete(item.postId);
    }
  }

  function confirmStop(item: ReportedPage) {
    void dialog.trigger({
      type: 'confirm',
      title: 'Stop Publishing for This Person?',
      body: 'They won’t be able to publish or update gallery pages, and every page of theirs is hidden. They aren’t told.',
      confirmText: 'Stop Publishing',
      danger: true,
      response: (confirmed) => {
        if (confirmed) void act(item, 'stop');
      },
    });
  }

  const reasonLabel = (reason: string) =>
    REPORT_REASON_LABELS.find((r) => r.value === reason)?.label ?? reason;
  const date = (ms: number) =>
    new Date(ms).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  const pagePath = (item: ReportedPage) =>
    item.kind === 'palette'
      ? resolve('/gallery/palette/[id]', { id: String(item.postId) })
      : resolve('/gallery/[id]', { id: String(item.postId) });
  const adminHref = (item: ReportedPage) =>
    `${PUBLIC_WORDPRESS_BASE_URL}/wp-admin/post.php?post=${item.postId}&action=edit`;

  const SHOWS: { value: Show; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'dismissed', label: 'Dismissed' },
    { value: 'all', label: 'All' },
  ];
</script>

<svelte:head>
  <title>Gallery Reports</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<AppShell pageName="Gallery Reports">
  {#snippet main()}
    <main class={[PAGE, PAGE_TOOL, 'mt-2 mb-8 flex flex-col gap-6']}>
      <h2 class="h2 text-gradient mt-2 max-lg:hidden">Gallery Reports</h2>

      {#if loading && !pages.length}
        <p class="flex items-center gap-2">
          <LoaderCircleIcon class="animate-spin" aria-hidden="true" />
          Loading reports…
        </p>
      {:else if problem === 'signed-out'}
        <p>Sign in with the site owner’s account to read reports.</p>
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- signInHref is a path here -->
        <a href={signInHref(page.url)} class="{BTN_PRIMARY} w-fit">Sign In</a>
      {:else if problem === 'not-owner'}
        <p>
          Only the site owner can read reports. Owners are the accounts listed
          in <code class="code">BETA_FEEDBACK_OWNERS</code>.
        </p>
      {:else if problem === 'failed'}
        <p>Reports couldn’t be loaded.</p>
        <button type="button" class="{BTN_SECONDARY} w-fit" onclick={load}
          >Try Again</button
        >
      {:else}
        <section class="flex flex-col gap-4" aria-labelledby="reports-list">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 id="reports-list" class="h4">
              Reported Pages <span class="font-normal opacity-70"
                >({ownerReports.newCount ?? 0} new)</span
              >
            </h3>
            <div
              class="flex flex-wrap gap-1"
              role="radiogroup"
              aria-label="Show"
            >
              {#each SHOWS as option (option.value)}
                <label
                  class="btn btn-sm has-checked:preset-filled-primary-500 hover:preset-tonal-surface cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reports-show"
                    value={option.value}
                    bind:group={show}
                    onchange={load}
                    class="sr-only"
                  />
                  {option.label}
                </label>
              {/each}
            </div>
          </div>
          <p class="text-sm opacity-80">
            Apple expects action on a report within about a day. A report never
            hides a page by itself.
          </p>

          {#if pages.length === 0}
            <p class="opacity-80">Nothing here.</p>
          {/if}

          {#each pages as item (item.postId)}
            {@const info = found.get(item.postId)}
            {@const name = item.title || info?.name || `Page ${item.postId}`}
            <article
              class={[
                'card preset-outlined-surface-200-800 flex flex-col gap-3 p-4',
                !item.newCount && 'opacity-80',
              ]}
            >
              <header class="flex items-start gap-3">
                {#if info?.image}
                  <img
                    src={info.image}
                    alt=""
                    class="rounded-base size-16 shrink-0 object-cover"
                  />
                {/if}
                <div class="flex min-w-0 flex-col gap-1">
                  <a href={pagePath(item)} class="link font-bold break-words"
                    >{name}</a
                  >
                  <p class="flex flex-wrap gap-x-2 gap-y-1 text-sm opacity-80">
                    <span
                      >{item.kind === 'palette' ? 'Palette' : 'Project'}</span
                    >
                    <span>
                      {item.reports.length}
                      {item.reports.length === 1
                        ? 'report'
                        : 'reports'}{item.newCount
                        ? `, ${item.newCount} new`
                        : ''}
                    </span>
                    {#if item.hidden}<span class="badge preset-tonal-surface"
                        >Hidden</span
                      >{/if}
                    {#if item.publishingStopped}<span
                        class="badge preset-tonal-error"
                        >Publishing stopped</span
                      >{/if}
                    {#if !item.hasPublisher}<span
                        >Published without an account</span
                      >{/if}
                  </p>
                </div>
              </header>

              <ul class="flex flex-col gap-2">
                {#each item.reports as report (report.id)}
                  <li class="border-surface-200-800 border-l-2 pl-3">
                    <p class="text-sm">
                      <span class="font-bold">{reasonLabel(report.reason)}</span
                      >
                      <span class="opacity-70">· {date(report.createdAt)}</span>
                      {#if report.status !== 'new'}
                        <span class="opacity-70">· {report.status}</span>
                      {/if}
                    </p>
                    {#if report.message}
                      <p class="whitespace-pre-wrap">{report.message}</p>
                    {/if}
                    <p class="text-sm opacity-80">
                      {#if report.email}
                        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- mailto -->
                        <a
                          href="mailto:{report.email}?subject={encodeURIComponent(
                            'Your report of a gallery page',
                          )}"
                          class="link">{report.email}</a
                        >
                        {report.signedIn ? '(account)' : ''}
                      {:else}
                        Anonymous
                      {/if}
                    </p>
                  </li>
                {/each}
              </ul>

              {#if needsAdmin.has(item.postId)}
                <p class="text-sm" role="status">
                  This page was published without an account, so it can only be
                  hidden in WordPress’s admin (move it to the Trash there), then
                  Dismiss its reports here.
                </p>
              {/if}

              <div class="flex flex-wrap gap-2">
                {#if !item.hidden}
                  {#if item.hasPublisher}
                    <button
                      type="button"
                      class="btn btn-sm preset-tonal"
                      disabled={busy.has(item.postId)}
                      onclick={() => act(item, 'hide')}
                    >
                      <EyeOffIcon /> Hide Page
                    </button>
                  {:else}
                    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- WordPress admin -->
                    <a
                      href={adminHref(item)}
                      target="_blank"
                      rel="noopener"
                      class="btn btn-sm preset-tonal"
                    >
                      Open in WordPress
                      <ExternalLinkIcon class="icon-sm" aria-hidden="true" />
                    </a>
                  {/if}
                {/if}
                {#if item.newCount}
                  <button
                    type="button"
                    class="btn btn-sm preset-tonal"
                    disabled={busy.has(item.postId)}
                    onclick={() => act(item, 'dismiss')}
                  >
                    <XIcon /> Dismiss
                  </button>
                {:else}
                  <button
                    type="button"
                    class="btn btn-sm hover:preset-tonal-surface"
                    disabled={busy.has(item.postId)}
                    onclick={() => act(item, 'reopen')}
                  >
                    <RotateCcwIcon /> Mark New
                  </button>
                {/if}
                {#if item.hasPublisher}
                  {#if item.publishingStopped}
                    <button
                      type="button"
                      class="btn btn-sm hover:preset-tonal-surface"
                      disabled={busy.has(item.postId)}
                      onclick={() => act(item, 'allow')}
                    >
                      Let Them Publish Again
                    </button>
                  {:else}
                    <button
                      type="button"
                      class="{BTN_DANGER} btn-sm"
                      disabled={busy.has(item.postId)}
                      onclick={() => confirmStop(item)}
                    >
                      <UserRoundXIcon /> Stop Publishing for This Person
                    </button>
                  {/if}
                {/if}
              </div>
            </article>
          {/each}
        </section>
      {/if}
    </main>
  {/snippet}
</AppShell>
