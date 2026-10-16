<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- @component
  Post to Ravelry / Update on Ravelry, from a project's Share dialog: one
  dialog for the Ravelry project, photos included. Posting creates it (name,
  craft, status, dates, progress, notes, one yarn per color linked to
  Ravelry's yarn when confirmed, and the picture). Updating shows what's on
  Ravelry now and changes only what was edited here: fields, yarns (added
  ones, and removed ones this app added), photos (removed, added, in a new
  order) and the picture, which is drawn and sent again only when the project
  changed. The notes' link to the project's gallery page is kept by the
  server. The project loads behind the dialog (as Publish to Gallery does), so
  its picture is drawn full size.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import {
    addRavelryPhoto,
    deleteRavelryPhoto,
    getRavelryOptions,
    getRavelryProject,
    postRavelryProject,
    ravelryErrorMessage,
    ravelryPictureKey,
    RavelryRequestError,
    reorderRavelryPhotos,
    searchRavelryYarns,
    type RavelryOption,
    type RavelryPack,
    type RavelryPhoto,
    type RavelryProjectLink,
    type RavelryProjectRequest,
    type RavelryYarnMatch,
  } from '#lib/accounts/ravelry.js';
  import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import { extraColorsFromProjectHref } from '#lib/utils/extra-colors-utils.js';
  import { loadInPlace } from '#lib/utils/open-saved-project.js';
  import { svgToPNG } from '#lib/utils/preview-utils.svelte.js';
  import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckIcon,
    ExternalLinkIcon,
    ImageIcon,
    ImagePlusIcon,
    LoaderCircleIcon,
    SaveIcon,
    SendIcon,
    Trash2Icon,
    XIcon,
  } from '@lucide/svelte';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import type { Attachment } from 'svelte/attachments';

  let {
    projectId,
    href,
    name: initialName,
  }: {
    projectId: string;
    /** The saved project's link, loaded behind the dialog */
    href: string;
    /** Its name in My Projects */
    name: string;
  } = $props();

  // Posted already: this changes that Ravelry project (also true once this
  // dialog has posted it, so a retry after a failed photo carries on)
  let updating = $state(untrack(() => ravelryLinks.links.has(projectId)));
  let project = $state<RavelryProjectLink | null>(
    untrack(() => ravelryLinks.links.get(projectId) ?? null),
  );

  // The photos on Ravelry, in the order arranged here
  let photos = $state<RavelryPhoto[]>([]);

  let root: HTMLElement | null = $state(null);
  let destroyed = false;

  /** Takes the focus when it appears, as the button that asked is gone */
  const takeFocus: Attachment<HTMLElement> = (node) => {
    node.focus({ preventScroll: true });
  };

  // ---- Getting the project ready to draw (as Publish to Gallery does)
  let preparing = $state<'project' | 'weather' | 'error' | null>('project');
  let prepareError = $state('');
  let restorePreferences: (() => void) | undefined;
  let weatherAbort: AbortController | undefined;

  async function prepare() {
    try {
      restorePreferences = await loadInPlace(href, () => destroyed);
      if (destroyed) return restorePreferences?.();
    } catch {
      prepareError = 'Couldn’t open this project. Try again later.';
      return (preparing = 'error');
    }
    if (!weather.rawData.length) {
      if (weather.isUserEdited) {
        prepareError =
          'This project’s edited weather data isn’t saved with it. Open the project to post it.';
        return (preparing = 'error');
      }
      preparing = 'weather';
      const abort = (weatherAbort = new AbortController());
      try {
        weather.setRawData(await weatherSearch.fetchOnly(abort));
        weather.wasLoadedFromStorage = false;
      } catch {
        if (abort.signal.aborted) return;
        prepareError =
          'Couldn’t get the weather data for this project. Try again.';
        return (preparing = 'error');
      }
    }
    // What the picture is drawn from, to tell later whether it changed
    pictureKey = await ravelryPictureKey(
      href,
      [
        previews.activeId,
        previews.extraColorsHash,
        JSON.stringify(weather.rawData),
      ].join('|'),
    );
    if (!destroyed) preparing = null;
  }

  const onpagehide = () => restorePreferences?.();
  onDestroy(() => {
    destroyed = true;
    weatherAbort?.abort();
    restorePreferences?.();
    window.removeEventListener('pagehide', onpagehide);
    for (const item of added) if (item.url) URL.revokeObjectURL(item.url);
  });

  // ---- The form
  let name = $state(untrack(() => initialName));
  let crafts = $state<RavelryOption[]>([]);
  let statuses = $state<RavelryOption[]>([]);
  let craftId = $state<number | null>(null);
  let statusId = $state<number | null>(null);
  let started = $state('');
  let finishBy = $state('');
  let completed = $state('');
  let progress = $state<number | null>(null);
  let notes = $state('');

  type Fields = {
    name: string;
    craftId: number | null;
    statusId: number | null;
    started: string | null;
    finishBy: string | null;
    completed: string | null;
    progress: number | null;
    notes: string;
  };

  const progressOf = (value: number | null | undefined) =>
    value == null || Number.isNaN(value)
      ? null
      : Math.min(100, Math.max(0, Math.round(value)));

  /** The form as Fields (what's compared with Ravelry's) */
  const fields = (): Fields => ({
    name: name.trim(),
    craftId,
    statusId,
    started: started || null,
    finishBy: finishBy || null,
    completed: completed || null,
    progress: progressOf(progress),
    notes: notes.trim(),
  });

  /** What's on Ravelry, as the form last held it */
  let original = $state<Fields | null>(null);

  const CRAFT_KEY = 'tb-ravelry-craft';
  const rememberedCraft = () => {
    try {
      return Number(localStorage.getItem(CRAFT_KEY)) || null;
    } catch {
      return null;
    }
  };
  const rememberCraft = (id: number | null) => {
    try {
      if (id) localStorage.setItem(CRAFT_KEY, String(id));
    } catch {
      // Not remembered this time
    }
  };

  // Posting: the project's dates, once it's loaded: its first location's start
  // to its last's end
  const toDay = (value?: string | null) => value?.slice(0, 10) || '';
  let datesPrefilled = false;
  $effect(() => {
    if (updating || preparing || datesPrefilled) return;
    datesPrefilled = true;
    const days = (key: 'from' | 'to') =>
      locations.all
        .map((l) => l[key])
        .filter(Boolean)
        .sort();
    started ||= toDay(days('from')[0]);
    finishBy ||= toDay(days('to').at(-1));
  });

  // ---- Yarns: one per color; each yarn (brand + yarn) can be linked to Ravelry's
  const colors: Color[] = untrack(() => [
    ...(getColorsFromInput({ string: href }) || []),
    ...extraColorsFromProjectHref(href).map((extra) => extra.color),
  ]);
  const yarnName = (color: Color) =>
    [color.brandName, color.yarnName].filter(Boolean).join(' ');

  type AppYarn = { name: string; colorway: string };
  const yarnLabel = (yarn: AppYarn) =>
    [yarn.name, yarn.colorway].filter(Boolean).join(' – ');

  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  // Each yarn and colorway once
  const appYarns: AppYarn[] = colors
    .map((color) => ({ name: yarnName(color), colorway: color.name ?? '' }))
    .filter(
      (yarn, i, all) =>
        all.findIndex(
          (other) =>
            normalize(other.name) === normalize(yarn.name) &&
            normalize(other.colorway) === normalize(yarn.colorway),
        ) === i,
    );

  /** The same yarn: a colorway, and a name that is (or, for one linked to Ravelry's yarn, contains) ours */
  const samePack = (pack: RavelryPack, yarn: AppYarn) => {
    if (normalize(pack.colorway) !== normalize(yarn.colorway)) return false;
    const a = normalize(pack.name);
    const b = normalize(yarn.name);
    return !a || !b || a === b || a.includes(b) || b.includes(a);
  };

  type YarnChoice = {
    name: string;
    matches: RavelryYarnMatch[];
    /** The Ravelry yarn chosen, or 0 for none (sent as text) */
    chosen: number;
    searching: boolean;
  };
  let yarnChoices = $state<YarnChoice[]>([]);
  const setYarnChoices = (yarns: AppYarn[]) => {
    yarnChoices = [...new Set(yarns.map((y) => y.name).filter(Boolean))].map(
      (name) => ({ name, matches: [], chosen: 0, searching: true }),
    );
  };
  const chosenFor = (yarn: AppYarn) =>
    yarnChoices.find((c) => c.name === yarn.name)?.chosen || 0;

  /** Yarns to add (where Ravelry lacks them) and to remove (ones this app added that are no longer used) */
  let yarnPlan = $state<{
    add: { yarn: AppYarn; on: boolean }[];
    remove: { pack: RavelryPack; on: boolean }[];
  }>({ add: [], remove: [] });
  // The yarns are sent with the project; a retry doesn't send them again
  let yarnsSent = $state(false);

  // Suggested only when Ravelry's yarn has this name, from the same brand
  function suggestion(name: string, matches: RavelryYarnMatch[]) {
    const wanted = normalize(name);
    return (
      matches.find((m) => {
        const full = normalize(`${m.company} ${m.name}`);
        return (
          full === wanted ||
          (wanted.includes(normalize(m.company)) &&
            wanted.endsWith(normalize(m.name)))
        );
      })?.id ?? 0
    );
  }

  async function findMatches() {
    // One at a time: requests are shared on the free plan
    for (const choice of yarnChoices) {
      if (destroyed) return;
      try {
        choice.matches = await searchRavelryYarns(choice.name);
        choice.chosen = suggestion(choice.name, choice.matches);
      } catch {
        choice.matches = [];
      } finally {
        choice.searching = false;
      }
    }
  }

  /** The names whose Ravelry yarn can be chosen */
  const visibleChoices = $derived(
    yarnsSent
      ? []
      : updating
        ? yarnChoices.filter((c) =>
            yarnPlan.add.some((a) => a.on && a.yarn.name === c.name),
          )
        : yarnChoices,
  );

  // ---- What's on Ravelry (Update)
  let detailsState = $state<'loading' | 'ready' | 'gone' | 'error'>(
    untrack(() => (updating ? 'loading' : 'ready')),
  );
  let detailsError = $state('');

  async function loadDetails() {
    detailsState = 'loading';
    detailsError = '';
    try {
      const result = await getRavelryProject(projectId);
      if (destroyed) return;
      const { details } = result;
      project = result.project;
      ravelryLinks.set(result.project);
      photos = [...result.project.photos];
      name = details.name;
      craftId = details.craftId;
      statusId = details.statusId;
      started = toDay(details.started);
      finishBy = toDay(details.finishBy);
      completed = toDay(details.completed);
      progress = details.progress;
      notes = details.notes;
      original = fields();
      yarnPlan = {
        add: appYarns
          .filter((y) => !details.packs.some((p) => samePack(p, y)))
          .map((yarn) => ({ yarn, on: true })),
        remove: details.packs
          .filter((p) => p.ours && !appYarns.some((y) => samePack(p, y)))
          .map((pack) => ({ pack, on: true })),
      };
      setYarnChoices(yarnPlan.add.map((a) => a.yarn));
      detailsState = 'ready';
      void findMatches();
    } catch (e) {
      if (destroyed) return;
      if (e instanceof RavelryRequestError && e.code === 'RAVELRY_GONE') {
        // The server unlinked it
        ravelryLinks.remove(projectId);
        detailsState = 'gone';
      } else detailsState = 'error';
      detailsError = ravelryErrorMessage(e);
    }
  }

  let optionsError = $state('');
  onMount(async () => {
    window.addEventListener('pagehide', onpagehide);
    void prepare();
    if (updating) void loadDetails();
    else {
      setYarnChoices(appYarns);
      craftId = rememberedCraft();
    }
    try {
      const options = await getRavelryOptions();
      crafts = options.crafts;
      statuses = options.statuses;
      if (!updating) {
        craftId =
          craftId ??
          crafts.find((c) => /crochet/i.test(c.name))?.id ??
          crafts[0]?.id ??
          null;
        statusId =
          statuses.find((s) => /progress/i.test(s.name))?.id ??
          statuses[0]?.id ??
          null;
      }
    } catch (e) {
      optionsError = ravelryErrorMessage(e);
    }
    if (!updating) void findMatches();
  });

  // ---- The picture
  let pictureKey = $state<string | null>(null);
  const picturePhoto = $derived(photos.find((p) => p.isPicture));
  const pictureState = $derived<
    'checking' | 'unavailable' | 'current' | 'changed' | 'new'
  >(
    preparing === 'error'
      ? 'unavailable'
      : preparing
        ? 'checking'
        : !updating
          ? 'new'
          : pictureKey && pictureKey === project?.pictureKey && picturePhoto
            ? 'current'
            : 'changed',
  );
  const pictureNeeded = $derived(
    pictureState === 'new' || pictureState === 'changed',
  );
  const canDraw = $derived(
    !!previews.active?.svg &&
      !!previews.active.width &&
      !!previews.active.height,
  );

  async function drawPicture() {
    const active = previews.active;
    if (!active?.svg || !active.width || !active.height)
      throw new Error('The picture isn’t ready');
    const png = await svgToPNG({
      svgNode: active.svg,
      width: active.width,
      height: active.height,
      download: false,
    });
    document.getElementById('temporary-canvas')?.remove();
    return await (await fetch(png)).blob();
  }

  // ---- Photos: those on Ravelry (in order) and those to add
  const removed = new SvelteSet<number>();
  type Added = { id: number; file: File; url: string | null };
  let added = $state<Added[]>([]);
  let addedCount = 0;
  let fileInput = $state<HTMLInputElement>();
  let note = $state('');

  const keptPhotos = $derived(photos.filter((p) => !removed.has(p.photoId)));
  const mainIndex = $derived(photos.findIndex((p) => !removed.has(p.photoId)));
  const orderChanged = $derived(
    keptPhotos.map((p) => p.photoId).join() !==
      (project?.photos ?? [])
        .map((p) => p.photoId)
        .filter((id) => !removed.has(id))
        .join(),
  );

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    // HEIC photos can't be shown by most browsers
    const next = [...files].map((file) => ({
      id: addedCount++,
      file,
      url: /hei[cf]/i.test(file.type) ? null : URL.createObjectURL(file),
    }));
    added = [...added, ...next];
    note = `${next.length === 1 ? 'Photo' : `${next.length} photos`} will be added at the end when you save.`;
    if (fileInput) fileInput.value = '';
  }

  async function dropAdded(item: Added) {
    if (item.url) URL.revokeObjectURL(item.url);
    added = added.filter((a) => a.id !== item.id);
  }

  async function unadd(item: Added) {
    await dropAdded(item);
    note = 'Photo won’t be added.';
    await tick();
    fileInput?.focus({ preventScroll: true });
  }

  function toggleRemoved(photoId: number) {
    if (removed.has(photoId)) {
      removed.delete(photoId);
      note = 'Photo will stay.';
    } else {
      removed.add(photoId);
      note = 'Photo will be removed when you save.';
    }
  }

  async function move(index: number, delta: -1 | 1) {
    const to = index + delta;
    if (to < 0 || to >= photos.length) return;
    const photoId = photos[index].photoId;
    const next = [...photos];
    [next[index], next[to]] = [next[to], next[index]];
    photos = next;
    note = `Photo moved to position ${to + 1} of ${photos.length}.`;
    // The moved photo's button keeps the focus (or its other one, at an end)
    await tick();
    const button = (direction: string) =>
      root?.querySelector<HTMLButtonElement>(
        `[data-move="${photoId}-${direction}"]`,
      );
    const same = button(delta < 0 ? 'earlier' : 'later');
    (same && !same.disabled
      ? same
      : button(delta < 0 ? 'later' : 'earlier')
    )?.focus({ preventScroll: true });
  }

  const captionOf = (photo: RavelryPhoto, i: number) =>
    [
      i === mainIndex && 'Main photo',
      photo.isPicture ? 'Picture from Temperature Blanket' : `Photo ${i + 1}`,
    ]
      .filter(Boolean)
      .join(' · ');

  // ---- Changes
  const fieldChanges = $derived.by<RavelryProjectRequest>(() => {
    const o = original;
    const now = fields();
    if (!o) return {};
    return {
      ...(now.name !== o.name && { name: now.name }),
      ...(now.craftId !== o.craftId && { craftId: now.craftId }),
      ...(now.statusId !== o.statusId && { statusId: now.statusId }),
      ...(now.started !== o.started && { started: now.started }),
      ...(now.finishBy !== o.finishBy && { finishBy: now.finishBy }),
      ...(now.completed !== o.completed && { completed: now.completed }),
      ...(now.progress !== o.progress && { progress: now.progress }),
      ...(now.notes !== o.notes && { notes: now.notes }),
    };
  });
  const FIELD_LABELS: Record<string, string> = {
    name: 'name',
    craftId: 'craft',
    statusId: 'status',
    started: 'start date',
    finishBy: 'finish-by date',
    completed: 'completed date',
    progress: 'progress',
    notes: 'notes',
  };
  const addYarns = $derived(
    yarnsSent ? [] : yarnPlan.add.filter((a) => a.on).map((a) => a.yarn),
  );
  const removeYarns = $derived(
    yarnsSent ? [] : yarnPlan.remove.filter((r) => r.on).map((r) => r.pack),
  );
  const projectChanged = $derived(
    Object.keys(fieldChanges).length > 0 ||
      addYarns.length > 0 ||
      removeYarns.length > 0,
  );
  const changed = $derived(
    !updating ||
      projectChanged ||
      removed.size > 0 ||
      added.length > 0 ||
      orderChanged ||
      pictureState === 'changed',
  );

  // ---- Saving
  let step = $state('');
  let sendError = $state('');
  let sendErrorCode = $state('');
  let gone = $state('');
  let saveButton = $state<HTMLButtonElement>();
  let done = $state<{
    url: string;
    posted: boolean;
    summary: string[];
    processing: boolean;
  } | null>(null);

  const canSave = $derived(
    !step &&
      detailsState === 'ready' &&
      pictureState !== 'checking' &&
      (!pictureNeeded || canDraw) &&
      // Posting always has a picture
      (updating || pictureState === 'new') &&
      name.trim().length > 0 &&
      (updating || !optionsError) &&
      changed,
  );

  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? '' : 's'}`;

  async function save(event: Event) {
    event.preventDefault();
    if (!canSave) return;
    sendError = sendErrorCode = note = '';
    rememberCraft(craftId);
    const posted = !updating;
    const summary: string[] = [];
    let latest: RavelryPhoto[] = project?.photos ?? [];
    let processing = false;
    let touched = false;
    try {
      // Drawn first: if that fails, nothing has changed on Ravelry
      let picture: Blob | null = null;
      if (pictureNeeded) {
        step = 'Drawing the picture…';
        picture = await drawPicture();
      }

      if (!updating || projectChanged) {
        step = updating ? 'Saving on Ravelry…' : 'Posting to Ravelry…';
        const now = fields();
        const saved = await postRavelryProject(
          projectId,
          updating
            ? {
                ...fieldChanges,
                ...(addYarns.length || removeYarns.length
                  ? {
                      packs: {
                        add: addYarns.map((yarn) => ({
                          ...yarn,
                          ...(chosenFor(yarn)
                            ? { ravelryYarnId: chosenFor(yarn) }
                            : {}),
                        })),
                        remove: removeYarns.map((p) => p.packId),
                      },
                    }
                  : {}),
              }
            : {
                name: now.name,
                craftId,
                statusId,
                started: now.started,
                finishBy: now.finishBy,
                ...(now.completed ? { completed: now.completed } : {}),
                ...(now.progress !== null ? { progress: now.progress } : {}),
                notes: now.notes,
                yarns: appYarns.map((yarn) => ({
                  ...yarn,
                  ...(chosenFor(yarn)
                    ? { ravelryYarnId: chosenFor(yarn) }
                    : {}),
                })),
              },
        );
        touched = true;
        if (!updating) summary.push('Posted the project');
        else {
          const fieldNames = Object.keys(fieldChanges).map(
            (key) => FIELD_LABELS[key],
          );
          if (fieldNames.length)
            summary.push(`Changed the ${fieldNames.join(', ')}`);
          if (addYarns.length)
            summary.push(`Added ${plural(addYarns.length, 'yarn')}`);
          if (removeYarns.length)
            summary.push(`Removed ${plural(removeYarns.length, 'yarn')}`);
        }
        project = saved;
        latest = saved.photos;
        ravelryLinks.set(saved);
        // From here on this is an update of what was just saved
        updating = true;
        yarnsSent = true;
        original = fields();
      }

      // Photos taken down
      const doomed = [...removed];
      for (const [i, photoId] of doomed.entries()) {
        step = `Removing photo ${i + 1} of ${doomed.length} on Ravelry…`;
        latest = await deleteRavelryPhoto(projectId, photoId);
        touched = true;
        removed.delete(photoId);
        photos = photos.filter((p) => p.photoId !== photoId);
      }
      if (doomed.length)
        summary.push(`Removed ${plural(doomed.length, 'photo')}`);

      // The picture, in the place of the last one
      if (picture) {
        step = 'Adding the picture on Ravelry…';
        const oldId = photos.find((p) => p.isPicture)?.photoId;
        const known = new Set(latest.map((p) => p.photoId));
        const result = await addRavelryPhoto(projectId, picture, {
          picture: true,
          pictureKey,
        });
        touched = true;
        processing ||= result.processing;
        latest = result.photos;
        const fresh = latest.find((p) => p.isPicture && !known.has(p.photoId));
        photos =
          oldId === undefined
            ? fresh
              ? [...photos, fresh]
              : photos
            : fresh
              ? photos.map((p) => (p.photoId === oldId ? fresh : p))
              : photos.filter((p) => p.photoId !== oldId);
        if (fresh && project) {
          project = { ...project, pictureKey };
          ravelryLinks.set({ ...project, photos: latest });
        }
        summary.push(
          oldId === undefined ? 'Added the picture' : 'Replaced the picture',
        );
      }

      // Photos added, at the end
      const queue = [...added];
      for (const [i, item] of queue.entries()) {
        step =
          queue.length > 1
            ? `Adding photo ${i + 1} of ${queue.length} on Ravelry…`
            : 'Adding the photo on Ravelry…';
        const known = new Set(latest.map((p) => p.photoId));
        const result = await addRavelryPhoto(projectId, item.file);
        touched = true;
        processing ||= result.processing;
        latest = result.photos;
        photos = [...photos, ...latest.filter((p) => !known.has(p.photoId))];
        await dropAdded(item);
      }
      if (queue.length) summary.push(`Added ${plural(queue.length, 'photo')}`);

      // The order: as arranged here, anything unknown to this dialog at the end
      const present = new Set(latest.map((p) => p.photoId));
      const arranged = new Set(photos.map((p) => p.photoId));
      const wanted = [
        ...photos.map((p) => p.photoId).filter((id) => present.has(id)),
        ...latest.map((p) => p.photoId).filter((id) => !arranged.has(id)),
      ];
      if (
        wanted.length > 1 &&
        wanted.join() !== latest.map((p) => p.photoId).join()
      ) {
        step = 'Changing the order of the photos on Ravelry…';
        latest = await reorderRavelryPhotos(projectId, wanted);
        touched = true;
        summary.push('Changed the order of the photos');
      }

      photos = latest;
      if (project) {
        project = { ...project, photos: latest };
        ravelryLinks.set(project);
      }
      done = {
        url: project?.url ?? '',
        posted,
        summary,
        processing,
      };
    } catch (e) {
      if (project && touched) {
        project = { ...project, photos: latest };
        ravelryLinks.set(project);
      }
      if (e instanceof RavelryRequestError && e.code === 'RAVELRY_GONE') {
        ravelryLinks.remove(projectId);
        gone = ravelryErrorMessage(e);
      } else {
        sendErrorCode = e instanceof RavelryRequestError ? (e.code ?? '') : '';
        sendError =
          (touched
            ? 'Part of this is saved on Ravelry; the rest wasn’t. '
            : '') + ravelryErrorMessage(e);
      }
    } finally {
      step = '';
    }
    if (!done) {
      // The form was disabled, which took the focus
      await tick();
      saveButton?.focus({ preventScroll: true });
    }
  }

  const preparingText = $derived(
    preparing === 'error'
      ? prepareError
      : preparing === 'weather' && weatherSearch.label
        ? `Getting weather data for ${weatherSearch.label}…`
        : preparing
          ? 'Getting the project ready…'
          : '',
  );
  const pictureText = $derived(
    pictureState === 'current'
      ? 'Its picture is up to date.'
      : pictureState === 'changed' && picturePhoto
        ? 'The picture changed and replaces the last one.'
        : 'This picture goes to Ravelry.',
  );
  const statusText = $derived(step || note);
</script>

{#snippet yarnSelect(choice: YarnChoice)}
  <label class="label">
    <span class="label-text">{choice.name}</span>
    {#if choice.searching}
      <span class="flex items-center gap-2 text-sm"
        ><LoaderCircleIcon class="icon-sm animate-spin" aria-hidden="true" />
        Looking for it on Ravelry…</span
      >
    {:else}
      <select class="select" bind:value={choice.chosen}>
        <option value={0}>Don’t link (name only)</option>
        {#each choice.matches as match (match.id)}
          <option value={match.id}
            >{match.company}
            {match.name}{match.weight
              ? ` · ${match.weight}`
              : ''}{match.discontinued ? ' · discontinued' : ''}</option
          >
        {/each}
      </select>
    {/if}
  </label>
{/snippet}

{#if done}
  <div class="flex flex-col gap-4 p-4 text-left" role="status">
    <p
      class="flex items-center gap-2 font-bold"
      tabindex="-1"
      {@attach takeFocus}
    >
      <CheckIcon aria-hidden="true" />
      {done.posted ? 'Posted to Ravelry' : 'Saved on Ravelry'}
    </p>
    {#if done.summary.length}
      <ul class="list-inside list-disc text-sm">
        {#each done.summary as line (line)}
          <li>{line}</li>
        {/each}
      </ul>
    {/if}
    {#if done.processing}
      <p class="text-sm">
        Ravelry is still adding a photo. It shows up there in a moment.
      </p>
    {/if}
    <div class="flex flex-wrap gap-2">
      <!-- eslint-disable svelte/no-navigation-without-resolve -- Ravelry's site -->
      <a
        class="btn preset-filled-primary-500"
        href={done.url}
        target="_blank"
        rel="noopener noreferrer"
        ><ExternalLinkIcon aria-hidden="true" />View on Ravelry<span
          class="sr-only"
        >
          (opens in a new tab)</span
        ></a
      >
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
      <button
        type="button"
        class="btn preset-tonal-surface"
        onclick={() => dialog.close()}>Done</button
      >
    </div>
  </div>
{:else if gone || detailsState === 'gone' || detailsState === 'error'}
  <div class="flex flex-col gap-4 p-4 text-left">
    <p
      class="text-error-700-300 text-sm"
      role="alert"
      tabindex="-1"
      {@attach takeFocus}
    >
      {gone || detailsError}
    </p>
    <div class="flex flex-wrap justify-end gap-2">
      {#if detailsState === 'error' && !gone}
        <button
          type="button"
          class="btn preset-tonal-surface"
          onclick={loadDetails}>Try Again</button
        >
      {/if}
      <button
        type="button"
        class="btn preset-filled-primary-500"
        onclick={() => dialog.close()}>Close</button
      >
    </div>
  </div>
{:else}
  <form
    class="flex flex-col gap-4 p-4 text-left"
    onsubmit={save}
    bind:this={root}
  >
    <fieldset class="flex min-w-0 flex-col gap-4" disabled={!!step}>
      <div
        class="bg-surface-50 dark:bg-surface-950 rounded-container flex items-center gap-4 p-4"
      >
        <div
          class="pointer-events-none w-24 shrink-0 sm:w-32"
          aria-hidden="true"
        >
          {#if pictureState === 'current'}
            {@const img = picturePhoto?.mediumUrl ?? picturePhoto?.smallUrl}
            {#if img}<img src={img} alt="" class="h-auto w-full" />{/if}
          {:else if pictureState === 'unavailable'}
            <ImageIcon class="size-8" />
          {:else if previews.active && !preparing}
            <previews.active.previewComponent />
          {:else}
            <LoaderCircleIcon class="animate-spin" />
          {/if}
        </div>
        <p class="text-sm">
          {preparingText || pictureText}
          {#if pictureState === 'unavailable' && updating}
            The rest can still be saved.
          {/if}
        </p>
      </div>

      {#if detailsState === 'loading'}
        <p class="flex items-center gap-2 text-sm">
          <LoaderCircleIcon class="icon-sm animate-spin" aria-hidden="true" />
          Getting the project from Ravelry…
        </p>
      {:else}
        <label class="label">
          <span class="label-text">Project name on Ravelry</span>
          <input class="input" bind:value={name} maxlength="100" required />
        </label>

        {#if optionsError}
          <p class="text-error-700-300 text-sm" role="alert">{optionsError}</p>
        {:else if crafts.length || statuses.length}
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="label">
              <span class="label-text">Craft</span>
              <select class="select" bind:value={craftId}>
                {#if craftId === null}
                  <option value={null}>Not set</option>
                {/if}
                {#each crafts as craft (craft.id)}
                  <option value={craft.id}>{craft.name}</option>
                {/each}
              </select>
            </label>
            <label class="label">
              <span class="label-text">Status</span>
              <select class="select" bind:value={statusId}>
                {#if statusId === null}
                  <option value={null}>Not set</option>
                {/if}
                {#each statuses as status (status.id)}
                  <option value={status.id}>{status.name}</option>
                {/each}
              </select>
            </label>
          </div>
        {/if}

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="label">
            <span class="label-text">Started</span>
            <input class="input" type="date" bind:value={started} />
          </label>
          <label class="label">
            <span class="label-text">Finish by</span>
            <input class="input" type="date" bind:value={finishBy} />
          </label>
          <label class="label">
            <span class="label-text">Completed</span>
            <input class="input" type="date" bind:value={completed} />
          </label>
          <label class="label">
            <span class="label-text">Progress (%)</span>
            <input
              class="input"
              type="number"
              min="0"
              max="100"
              step="1"
              inputmode="numeric"
              bind:value={progress}
            />
          </label>
        </div>

        <label class="label">
          <span class="label-text">Notes{updating ? '' : ' (optional)'}</span>
          <textarea
            class="textarea"
            rows="4"
            bind:value={notes}
            maxlength="5000"
            aria-describedby="ravelry-notes-hint"></textarea>
        </label>
        <p id="ravelry-notes-hint" class="text-sm opacity-80">
          The notes end with “Planned with Temperature Blanket” and a link to
          this project’s gallery page. It stays at the end whatever you write
          here.
        </p>

        {#if !updating && !yarnsSent && yarnChoices.length}
          <fieldset class="flex flex-col gap-3">
            <legend class="label-text mb-1">Yarns on Ravelry</legend>
            <p class="text-sm opacity-80">
              Each color is added as a yarn. Link it to Ravelry’s page for the
              yarn, or keep just its name.
            </p>
            {#each visibleChoices as choice (choice.name)}
              {@render yarnSelect(choice)}
            {/each}
          </fieldset>
        {:else if updating && (yarnPlan.add.length || yarnPlan.remove.length) && !yarnsSent}
          <fieldset class="flex flex-col gap-3">
            <legend class="label-text mb-1">Yarns on Ravelry</legend>
            <p class="text-sm opacity-80">
              The yarns in this project differ from those on Ravelry. Yarns you
              added there yourself stay.
            </p>
            {#each yarnPlan.add as item (yarnLabel(item.yarn))}
              <label class="flex items-center gap-2">
                <input
                  class="checkbox"
                  type="checkbox"
                  bind:checked={item.on}
                />
                Add {yarnLabel(item.yarn)}
              </label>
            {/each}
            {#each yarnPlan.remove as item (item.pack.packId)}
              <label class="flex items-center gap-2">
                <input
                  class="checkbox"
                  type="checkbox"
                  bind:checked={item.on}
                />
                Remove {yarnLabel(item.pack)}
              </label>
            {/each}
            {#each visibleChoices as choice (choice.name)}
              {@render yarnSelect(choice)}
            {/each}
          </fieldset>
        {/if}

        <fieldset class="flex flex-col gap-3">
          <legend class="label-text mb-1">Photos on Ravelry</legend>
          <p class="text-sm opacity-80">
            Photos are stored on Ravelry, on this project’s page, and show on
            its card here and on its gallery page. The first is the project’s
            main photo.
          </p>
          {#if photos.length || added.length}
            <ul
              class="grid grid-cols-2 items-start gap-3 sm:grid-cols-3"
              aria-label="Photos"
            >
              {#each photos as photo, i (photo.photoId)}
                {@const isRemoved = removed.has(photo.photoId)}
                {@const replaced =
                  photo.isPicture && pictureState === 'changed'}
                <li class="flex flex-col gap-1">
                  <div class="relative">
                    <img
                      src={photo.mediumUrl ??
                        photo.smallUrl ??
                        photo.squareUrl ??
                        ''}
                      alt={photo.isPicture
                        ? `${initialName}: its picture from Temperature Blanket`
                        : `${initialName}: photo ${i + 1} of ${photos.length}`}
                      class={[
                        'bg-surface-100-900 h-auto w-full',
                        (isRemoved || replaced) && 'opacity-40',
                      ]}
                      loading="lazy"
                    />
                    {#if !replaced}
                      <button
                        type="button"
                        class={[
                          'btn-icon btn-icon-sm absolute top-2 right-2 shadow',
                          isRemoved
                            ? 'preset-filled-error-500'
                            : 'preset-filled-surface-50-950',
                        ]}
                        aria-label={`Remove photo ${i + 1} from Ravelry`}
                        aria-pressed={isRemoved}
                        onclick={() => toggleRemoved(photo.photoId)}
                        ><Trash2Icon
                          class="icon-sm"
                          aria-hidden="true"
                        /></button
                      >
                    {/if}
                  </div>
                  <p class="text-sm">
                    {#if isRemoved}
                      <strong>Will be removed</strong>
                    {:else if replaced}
                      Replaced by the new picture
                    {:else}
                      {captionOf(photo, i)}
                    {/if}
                  </p>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="btn-icon btn-icon-sm preset-tonal-surface"
                      aria-label={`Move photo ${i + 1} earlier`}
                      data-move="{photo.photoId}-earlier"
                      disabled={i === 0}
                      onclick={() => move(i, -1)}
                      ><ArrowLeftIcon
                        class="icon-sm"
                        aria-hidden="true"
                      /></button
                    >
                    <button
                      type="button"
                      class="btn-icon btn-icon-sm preset-tonal-surface"
                      aria-label={`Move photo ${i + 1} later`}
                      data-move="{photo.photoId}-later"
                      disabled={i === photos.length - 1}
                      onclick={() => move(i, 1)}
                      ><ArrowRightIcon
                        class="icon-sm"
                        aria-hidden="true"
                      /></button
                    >
                  </div>
                </li>
              {/each}
              {#each added as item (item.id)}
                <li class="flex flex-col gap-1">
                  <div class="relative">
                    {#if item.url}
                      <img
                        src={item.url}
                        alt={`New photo: ${item.file.name}`}
                        class="bg-surface-100-900 h-auto w-full"
                      />
                    {:else}
                      <div
                        class="bg-surface-100-900 flex aspect-square w-full items-center justify-center"
                      >
                        <ImageIcon class="size-8" aria-hidden="true" />
                      </div>
                    {/if}
                    <button
                      type="button"
                      class="btn-icon btn-icon-sm preset-filled-surface-50-950 absolute top-2 right-2 shadow"
                      aria-label={`Don’t add ${item.file.name}`}
                      onclick={() => unadd(item)}
                      ><XIcon class="icon-sm" aria-hidden="true" /></button
                    >
                  </div>
                  <p class="text-sm break-all">
                    New · {item.file.name}
                  </p>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="text-sm opacity-80">No photos yet.</p>
          {/if}
          <div class="flex">
            <label
              class="btn preset-tonal-surface cursor-pointer has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50"
            >
              <ImagePlusIcon aria-hidden="true" />Add Photos
              <input
                bind:this={fileInput}
                class="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/heic,image/heif"
                multiple
                onchange={(e) => addFiles(e.currentTarget.files)}
              />
            </label>
          </div>
        </fieldset>

        <p class="text-sm opacity-80">
          Other things on the Ravelry project (the pattern, needles, gauge,
          private notes) aren’t changed here.
        </p>
      {/if}

      <div class="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          class="btn preset-tonal-surface"
          onclick={() => dialog.close()}>Cancel</button
        >
        <button
          bind:this={saveButton}
          type="submit"
          class="btn preset-filled-primary-500"
          disabled={!canSave}
          >{#if updating}<SaveIcon aria-hidden="true" />Save on Ravelry{:else}<SendIcon
              aria-hidden="true"
            />Post to Ravelry{/if}</button
        >
      </div>
    </fieldset>

    <p
      class={['flex items-center gap-2 text-sm', !statusText && 'sr-only']}
      role="status"
    >
      {#if step}
        <LoaderCircleIcon class="icon-sm animate-spin" aria-hidden="true" />
      {/if}
      {statusText}
    </p>
    {#if sendError}
      <p class="text-error-700-300 text-sm" role="alert">
        {sendError}
        {#if sendErrorCode === 'RAVELRY_RECONNECT'}
          <a class="anchor" href={resolve('/account')}>Open your Account</a>
        {/if}
      </p>
    {/if}
  </form>
{/if}
