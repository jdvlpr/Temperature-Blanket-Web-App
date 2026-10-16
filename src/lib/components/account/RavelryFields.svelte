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
  The Ravelry part of Publish to Gallery / Edit Gallery Page: the project's
  Ravelry project, edited almost 1:1. Its name is the project's. Posting
  creates it (craft, status, dates, progress, notes, its yarns, each linked to
  Ravelry's yarn or by name only, the picture and photos). Once posted, it
  shows what's on Ravelry now and changes only what was edited here: fields,
  yarns (added ones, and removed ones this app added), photos (removed, added,
  in a new order) and the picture, sent again only when the project changed.
  Photos come first, under the dialog's picture; the dialog itself has View on
  Ravelry and Unlink. It draws the picture and calls `apply` after its
  gallery page is published, which the Ravelry project links to.
-->
<script lang="ts" module>
  export type RavelryState = {
    changed: boolean;
    canSave: boolean;
    pictureNeeded: boolean;
  };
  export type RavelryApplied = {
    url: string;
    posted: boolean;
    summary: string[];
    processing: boolean;
  };
</script>

<script lang="ts">
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
  import { locations } from '#lib/state/location-state.svelte.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import { extraColorsFromProjectHref } from '#lib/utils/extra-colors-utils.js';
  import { FIELD_GROUP, FIELD_ICON } from '#lib/constants/class-constants.js';
  import {
    ArrowLeftIcon,
    CalendarCheckIcon,
    CalendarClockIcon,
    CalendarPlusIcon,
    ArrowRightIcon,
    ImageIcon,
    ImagePlusIcon,
    LoaderCircleIcon,
    Trash2Icon,
    XIcon,
  } from '@lucide/svelte';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';

  let {
    projectId,
    href,
    name,
    disabled = false,
    onstate,
    ongone,
  }: {
    projectId: string;
    /** The open project's link, once it's ready to draw */
    href: string;
    /** Its name: the project's, as on its gallery page (kept the same on Ravelry) */
    name: string;
    /** While the dialog saves */
    disabled?: boolean;
    /** As it changes: whether anything here would change on Ravelry, whether
     * it's ready to be saved, and whether `apply` needs the picture */
    onstate: (state: RavelryState) => void;
    /** Deleted on Ravelry: it's unlinked (and this part goes away) */
    ongone?: (message: string) => void;
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


  onDestroy(() => {
    destroyed = true;
    for (const item of added) if (item.url) URL.revokeObjectURL(item.url);
  });

  // ---- The form (its name is the project's)
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

  // Finished projects have a completed date; the rest, a finish-by date and progress
  const finished = $derived(
    /finish/i.test(statuses.find((s) => s.id === statusId)?.name ?? ''),
  );
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  function statusChanged() {
    if (finished && !completed) completed = today();
  }

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
  // Its name on Ravelry, which follows the project's
  let ravelryName = $state('');

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

  // Posting: the project's dates, its first location's start to its last's end
  const toDay = (value?: string | null) => value?.slice(0, 10) || '';
  const days = (key: 'from' | 'to') =>
    locations.all
      .map((l) => l[key])
      .filter(Boolean)
      .sort();

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
  // Posting: whether its yarns go to Ravelry at all
  let addYarnsOnPost = $state(true);

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

  // ---- What's on Ravelry (once posted)
  let detailsState = $state<'loading' | 'ready' | 'error'>(
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
      photos = [...result.project.photos];
      ravelryName = details.name;
      craftId = details.craftId;
      statusId = details.statusId;
      started = toDay(details.started);
      finishBy = toDay(details.finishBy);
      completed = toDay(details.completed);
      progress = details.progress;
      notes = details.notes;
      original = { ...fields(), name: ravelryName.trim() };
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
      // Kept last: the dialog's Ravelry part follows the links
      ravelryLinks.set(result.project);
      void findMatches();
    } catch (e) {
      if (destroyed) return;
      if (e instanceof RavelryRequestError && e.code === 'RAVELRY_GONE') {
        // The server unlinked it
        ongone?.(ravelryErrorMessage(e));
        ravelryLinks.remove(projectId);
        return;
      }
      detailsState = 'error';
      detailsError = ravelryErrorMessage(e);
    }
  }

  // Posting: the project's dates, once its locations are there (they can
  // still be loading when this shows), unless changed here first
  $effect(() => {
    if (updating) return;
    const from = toDay(days('from')[0]);
    const to = toDay(days('to').at(-1));
    untrack(() => {
      if (!started && from) started = from;
      if (!finishBy && to) finishBy = to;
    });
  });

  let optionsError = $state('');
  onMount(async () => {
    // What the picture is drawn from, to tell later whether it changed
    void ravelryPictureKey(
      href,
      [
        previews.activeId,
        previews.extraColorsHash,
        JSON.stringify(weather.rawData),
      ].join('|'),
    ).then((key) => (pictureKey = key));
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
  const pictureState = $derived<'checking' | 'current' | 'changed' | 'new'>(
    !updating
      ? 'new'
      : !pictureKey || detailsState === 'loading'
        ? 'checking'
        : pictureKey === project?.pictureKey && picturePhoto
          ? 'current'
          : 'changed',
  );
  const pictureNeeded = $derived(
    pictureState === 'new' || pictureState === 'changed',
  );

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

  function dropAdded(item: Added) {
    if (item.url) URL.revokeObjectURL(item.url);
    added = added.filter((a) => a.id !== item.id);
  }

  async function unadd(item: Added) {
    dropAdded(item);
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
      i === mainIndex && 'Main',
      photo.isPicture ? 'This picture' : `Photo ${i + 1}`,
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
  $effect(() => {
    onstate({
      changed:
        !updating ||
        projectChanged ||
        removed.size > 0 ||
        added.length > 0 ||
        orderChanged ||
        pictureState === 'changed',
      canSave:
        detailsState === 'ready' &&
        pictureState !== 'checking' &&
        name.trim().length > 0 &&
        (updating || !optionsError),
      pictureNeeded,
    });
  });

  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? '' : 's'}`;
  const yarnsDetail = $derived(
    `${plural(appYarns.length, 'colorway')} of ${plural(yarnChoices.length, 'yarn')}. Link ${yarnChoices.length === 1 ? 'it' : 'each yarn'} to its page on Ravelry, or add just the name.`,
  );

  /**
   * Saves what changed on Ravelry: the project (posting it the first time),
   * removed photos, the picture (when `pictureNeeded`), added photos, then the
   * order. Throws a RavelryRequestError when something fails; what was saved
   * before that stays saved, and a retry carries on from there.
   */
  export async function apply({
    picture,
    onStep,
  }: {
    picture: Blob | null;
    onStep: (text: string) => void;
  }): Promise<RavelryApplied> {
    note = '';
    rememberCraft(craftId);
    const posted = !updating;
    const summary: string[] = [];
    let latest: RavelryPhoto[] = project?.photos ?? [];
    let processing = false;
    let touched = false;
    try {
      if (!updating || projectChanged) {
        onStep(updating ? 'Saving on Ravelry…' : 'Posting to Ravelry…');
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
                yarns: (addYarnsOnPost ? appYarns : []).map((yarn) => ({
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
        // From here on this is an update of what was just saved
        updating = true;
        yarnsSent = true;
        original = fields();
        ravelryLinks.set(saved);
      }

      // Photos taken down
      const doomed = [...removed];
      for (const [i, photoId] of doomed.entries()) {
        onStep(`Removing photo ${i + 1} of ${doomed.length} on Ravelry…`);
        latest = await deleteRavelryPhoto(projectId, photoId);
        touched = true;
        removed.delete(photoId);
        photos = photos.filter((p) => p.photoId !== photoId);
      }
      if (doomed.length)
        summary.push(`Removed ${plural(doomed.length, 'photo')}`);

      // The picture, in the place of the last one
      if (picture && pictureNeeded) {
        onStep('Adding the picture on Ravelry…');
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
        if (fresh && project) project = { ...project, pictureKey };
        summary.push(
          oldId === undefined ? 'Added the picture' : 'Replaced the picture',
        );
      }

      // Photos added, at the end
      const queue = [...added];
      for (const [i, item] of queue.entries()) {
        onStep(
          queue.length > 1
            ? `Adding photo ${i + 1} of ${queue.length} on Ravelry…`
            : 'Adding the photo on Ravelry…',
        );
        const known = new Set(latest.map((p) => p.photoId));
        const result = await addRavelryPhoto(projectId, item.file);
        touched = true;
        processing ||= result.processing;
        latest = result.photos;
        photos = [...photos, ...latest.filter((p) => !known.has(p.photoId))];
        dropAdded(item);
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
        onStep('Changing the order of the photos on Ravelry…');
        latest = await reorderRavelryPhotos(projectId, wanted);
        touched = true;
        summary.push('Changed the order of the photos');
      }

      photos = latest;
      if (project) {
        project = { ...project, photos: latest };
        ravelryLinks.set(project);
      }
      return { url: project?.url ?? '', posted, summary, processing };
    } catch (e) {
      if (project && touched) {
        project = { ...project, photos: latest };
        ravelryLinks.set(project);
      }
      if (e instanceof RavelryRequestError && e.code === 'RAVELRY_GONE') {
        ongone?.(ravelryErrorMessage(e));
        ravelryLinks.remove(projectId);
      }
      throw Object.assign(e instanceof Error ? e : new Error(String(e)), {
        partly: touched,
      });
    }
  }

  // The picture to add, shown as a photo: when posting (first, the main
  // photo), or when its old one is gone from Ravelry (at the end)
  const newPicture = $derived(pictureNeeded && !picturePhoto);
</script>

{#snippet dateField(
  label: string,
  Icon: typeof CalendarPlusIcon,
  value: string,
  set: (value: string) => void,
)}
  <label class="label min-w-0">
    <span class="label-text">{label}</span>
    <span class="relative flex min-w-0 items-center">
      <Icon class={[FIELD_ICON, 'z-10']} aria-hidden="true" />
      <!-- The icon here is the one shown: the browser's own picker button is
      unseen but covers the field, so a click anywhere opens the picker.
      Safari on iPhone gives date fields a width of their own (wider than a
      half-width cell) and centers the date unless told not to -->
      <input
        class="input relative block w-full min-w-0 appearance-none pl-11 text-left [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:size-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-date-and-time-value]:text-left"
        type="date"
        {value}
        oninput={(e) => set(e.currentTarget.value)}
      />
    </span>
  </label>
{/snippet}

{#snippet yarnSelect(choice: YarnChoice)}
  <label class="label min-w-0">
    <span class="label-text">{choice.name}</span>
    {#if choice.searching}
      <span class="flex items-center gap-2 text-sm"
        ><LoaderCircleIcon class="icon-sm animate-spin" aria-hidden="true" />
        Looking for it on Ravelry…</span
      >
    {:else}
      <select class="select min-w-0" bind:value={choice.chosen}>
        <option value={0}>Name only (not linked)</option>
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

<div class="flex min-w-0 flex-col gap-4" bind:this={root}>
  {#if detailsState === 'loading'}
    <p class="flex items-center gap-2 text-sm">
      <LoaderCircleIcon class="icon-sm animate-spin" aria-hidden="true" />
      Getting the project from Ravelry…
    </p>
  {:else if detailsState === 'error'}
    <div class="flex flex-col items-start gap-2">
      <p class="text-error-700-300 text-sm" role="alert">{detailsError}</p>
      <button
        type="button"
        class="btn preset-tonal-surface"
        onclick={loadDetails}>Try Again</button
      >
    </div>
  {:else}
    <fieldset class="flex min-w-0 flex-col gap-6" {disabled}>
      <!-- Under its picture, in the dialog's top part: photos on Ravelry (the
      picture is the first when posting), and Add Photos at the end -->
      <fieldset class="flex min-w-0 flex-col gap-2">
        <legend class="label-text mb-1">Photos on Ravelry</legend>
        <ul
          class="grid grid-cols-3 items-start gap-2 sm:grid-cols-5"
          aria-label="Photos on Ravelry"
          aria-describedby="ravelry-photos-hint"
        >
          {#each photos as photo, i (photo.photoId)}
            {@const isRemoved = removed.has(photo.photoId)}
            {@const replaced = photo.isPicture && pictureState === 'changed'}
            <li class="flex min-w-0 flex-col gap-1">
              <div class="relative">
                <img
                  src={photo.squareUrl ??
                    photo.smallUrl ??
                    photo.mediumUrl ??
                    ''}
                  alt={photo.isPicture
                    ? `${name}: its picture from Temperature Blanket`
                    : `${name}: photo ${i + 1} of ${photos.length}`}
                  class={[
                    'bg-surface-100-900 aspect-square w-full object-cover',
                    (isRemoved || replaced) && 'opacity-40',
                  ]}
                  loading="lazy"
                />
                {#if !replaced}
                  <button
                    type="button"
                    class={[
                      'btn-icon btn-icon-sm absolute top-1 right-1 shadow',
                      isRemoved
                        ? 'preset-filled-error-500'
                        : 'preset-filled-surface-50-950',
                    ]}
                    aria-label={`Remove photo ${i + 1} from Ravelry`}
                    aria-pressed={isRemoved}
                    onclick={() => toggleRemoved(photo.photoId)}
                    ><Trash2Icon class="icon-sm" aria-hidden="true" /></button
                  >
                {/if}
              </div>
              <p class="truncate text-xs">
                {#if isRemoved}
                  <strong>Will be removed</strong>
                {:else if replaced}
                  To be replaced
                {:else}
                  {captionOf(photo, i)}
                {/if}
              </p>
              <div class="flex gap-1">
                <button
                  type="button"
                  class="btn-icon btn-icon-sm preset-tonal-surface"
                  aria-label={`Move photo ${i + 1} earlier`}
                  data-move="{photo.photoId}-earlier"
                  disabled={i === 0}
                  onclick={() => move(i, -1)}
                  ><ArrowLeftIcon class="icon-sm" aria-hidden="true" /></button
                >
                <button
                  type="button"
                  class="btn-icon btn-icon-sm preset-tonal-surface"
                  aria-label={`Move photo ${i + 1} later`}
                  data-move="{photo.photoId}-later"
                  disabled={i === photos.length - 1}
                  onclick={() => move(i, 1)}
                  ><ArrowRightIcon class="icon-sm" aria-hidden="true" /></button
                >
              </div>
            </li>
          {/each}
          {#if newPicture && updating && previews.active}
            <!-- Its old picture is gone from Ravelry: the new one goes at the end -->
            <li class="flex min-w-0 flex-col gap-1">
              <div
                class="bg-surface-100-900 pointer-events-none flex aspect-square w-full items-center justify-center overflow-hidden"
                aria-hidden="true"
              >
                <previews.active.previewComponent />
              </div>
              <p class="truncate text-xs">New · This picture</p>
            </li>
          {/if}
          {#each added as item (item.id)}
            <li class="flex min-w-0 flex-col gap-1">
              <div class="relative">
                {#if item.url}
                  <img
                    src={item.url}
                    alt={`New photo: ${item.file.name}`}
                    class="bg-surface-100-900 aspect-square w-full object-cover"
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
                  class="btn-icon btn-icon-sm preset-filled-surface-50-950 absolute top-1 right-1 shadow"
                  aria-label={`Don’t add ${item.file.name}`}
                  onclick={() => unadd(item)}
                  ><XIcon class="icon-sm" aria-hidden="true" /></button
                >
              </div>
              <p class="truncate text-xs" title={item.file.name}>
                New · {item.file.name}
              </p>
            </li>
          {/each}
          <li class="min-w-0">
            <label
              class="border-surface-300-700 hover:bg-surface-100-900 has-[:focus-visible]:outline-primary-500 flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed p-1 text-center text-xs transition-colors has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50 has-[:focus-visible]:outline-2"
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
          </li>
        </ul>
        <p id="ravelry-photos-hint" class="text-xs opacity-70">
          {updating
            ? 'The first is the main photo.'
            : 'The picture above is the main photo; these go after it.'} They show
          on its gallery page too.
        </p>
      </fieldset>

      <!-- What it is and where it's at -->
      <div class="flex flex-col gap-4">
        {#if optionsError}
          <p class="text-error-700-300 text-sm" role="alert">{optionsError}</p>
        {:else if crafts.length || statuses.length}
          <div class="grid grid-cols-2 gap-4">
            <label class="label min-w-0">
              <span class="label-text">Status</span>
              <select
                class="select min-w-0"
                bind:value={statusId}
                onchange={statusChanged}
              >
                {#if statusId === null}
                  <option value={null}>Not set</option>
                {/if}
                {#each statuses as status (status.id)}
                  <option value={status.id}>{status.name}</option>
                {/each}
              </select>
            </label>
            <label class="label min-w-0">
              <span class="label-text">Craft</span>
              <select class="select min-w-0" bind:value={craftId}>
                {#if craftId === null}
                  <option value={null}>Not set</option>
                {/if}
                {#each crafts as craft (craft.id)}
                  <option value={craft.id}>{craft.name}</option>
                {/each}
              </select>
            </label>
          </div>
        {/if}

        <div class="grid gap-4 min-[26rem]:grid-cols-2 sm:grid-cols-3">
          {@render dateField(
            'Started',
            CalendarPlusIcon,
            started,
            (v) => (started = v),
          )}
          {#if finished}
            {@render dateField(
              'Completed',
              CalendarCheckIcon,
              completed,
              (v) => (completed = v),
            )}
          {:else}
            {@render dateField(
              'Finish by',
              CalendarClockIcon,
              finishBy,
              (v) => (finishBy = v),
            )}
            <label class="label min-w-0">
              <span class="label-text"
                >Progress<span class="sr-only"> (percent)</span></span
              >
              <div class={[FIELD_GROUP, 'grid-cols-[1fr_auto]']}>
                <input
                  class="input"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  inputmode="numeric"
                  placeholder="0"
                  bind:value={progress}
                  onblur={() => (progress = progressOf(progress))}
                />
                <span class="label label-text" aria-hidden="true">%</span>
              </div>
            </label>
          {/if}
        </div>
      </div>

      <label class="label min-w-0">
        <span class="label-text">Notes{updating ? '' : ' (optional)'}</span>
        <textarea
          class="textarea"
          rows="3"
          bind:value={notes}
          maxlength="5000"
          aria-describedby="ravelry-notes-hint"></textarea>
        <span id="ravelry-notes-hint" class="text-xs leading-normal opacity-70">
          Followed by “Planned with Temperature Blanket” and a link to its
          gallery page.
        </span>
      </label>

      {#if !updating && !yarnsSent && yarnChoices.length}
        <fieldset class="flex flex-col gap-3">
          <legend class="sr-only">Yarns</legend>
          <label class="flex items-start gap-3">
            <input
              type="checkbox"
              class="checkbox mt-0.5 shrink-0"
              bind:checked={addYarnsOnPost}
              aria-describedby="ravelry-yarns-detail"
            />
            <span class="flex flex-1 flex-col">
              <span>Add its yarns</span>
              <span class="text-xs opacity-70" id="ravelry-yarns-detail"
                >{yarnsDetail}</span
              >
            </span>
          </label>
          {#if addYarnsOnPost}
            <!-- Under its checkbox's text, as part of it -->
            <div class="grid gap-4 pl-8 sm:grid-cols-2">
              {#each visibleChoices as choice (choice.name)}
                {@render yarnSelect(choice)}
              {/each}
            </div>
          {/if}
        </fieldset>
      {:else if updating && (yarnPlan.add.length || yarnPlan.remove.length) && !yarnsSent}
        <fieldset class="flex flex-col gap-3">
          <legend class="label-text mb-1">Yarns</legend>
          <p class="text-xs opacity-70">
            The yarns in this project differ from those on Ravelry. Yarns you
            added there yourself stay.
          </p>
          {#each yarnPlan.add as item (yarnLabel(item.yarn))}
            <label class="flex items-center gap-2">
              <input class="checkbox" type="checkbox" bind:checked={item.on} />
              Add {yarnLabel(item.yarn)}
            </label>
          {/each}
          {#each yarnPlan.remove as item (item.pack.packId)}
            <label class="flex items-center gap-2">
              <input class="checkbox" type="checkbox" bind:checked={item.on} />
              Remove {yarnLabel(item.pack)}
            </label>
          {/each}
          {#if visibleChoices.length}
            <div class="grid gap-4 sm:grid-cols-2">
              {#each visibleChoices as choice (choice.name)}
                {@render yarnSelect(choice)}
              {/each}
            </div>
          {/if}
        </fieldset>
      {/if}

      {#if updating}
        <p class="text-xs opacity-70">
          The pattern, needles, gauge and private notes on Ravelry aren’t
          changed here.
        </p>
      {/if}
    </fieldset>
  {/if}

  <!-- Photo changes, as they're made -->
  <p class="sr-only" role="status">{note}</p>
</div>
