// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

// Ravelry's REST API, called with a user's OAuth access token. Only the parts
// the app uses; field names are Ravelry's (ravelry-api-documentation.md).

const API = 'https://api.ravelry.com';

/** A failed call. `reconnect` when Ravelry no longer accepts the token (401). */
export class RavelryApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
  get reconnect() {
    return this.status === 401;
  }
}

export type RavelryUser = {
  id: number;
  username: string;
  photo_url?: string | null;
  small_photo_url?: string | null;
};

export type RavelryPhoto = {
  id: number;
  sort_order?: number | null;
  aspect_ratio?: number | null;
  square_url?: string | null;
  small_url?: string | null;
  small2_url?: string | null;
  medium_url?: string | null;
  medium2_url?: string | null;
};

export type RavelryNamed = { id: number; name: string; permalink?: string };

export type RavelryPackPost = {
  yarn_id?: number | null;
  stash_id?: number | null;
  personal_name?: string | null;
  colorway?: string | null;
  skeins?: string | null;
  personal_yarn_weight_id?: number | null;
};

export type RavelryProjectPost = {
  name?: string;
  craft_id?: number | null;
  project_status_id?: number | null;
  started?: string | null;
  completed?: string | null;
  finish_by?: string | null;
  progress?: number | null;
  notes?: string | null;
  tag_names?: string[];
  packs?: RavelryPackPost[];
};

export type RavelryProject = {
  id: number;
  name: string;
  permalink: string;
  notes?: string | null;
  progress?: number | null;
  started?: string | null;
  completed?: string | null;
  status_name?: string | null;
  project_status_id?: number | null;
  craft_id?: number | null;
  photos?: RavelryPhoto[];
  packs?: { id: number; yarn_id?: number | null; colorway?: string | null }[];
  user?: { username: string };
};

export type RavelryYarn = {
  id: number;
  name: string;
  permalink: string;
  yarn_company_name?: string | null;
  discontinued?: boolean;
  yarn_weight?: { id: number; name: string } | null;
  first_photo?: RavelryPhoto | null;
};

export type RavelryStash = {
  id: number;
  name?: string | null;
  colorway_name?: string | null;
  color_family_name?: string | null;
  permalink: string;
  first_photo?: RavelryPhoto | null;
  yarn?: {
    id: number;
    name: string;
    yarn_company_name?: string | null;
    yarn_weight?: { name: string } | null;
  } | null;
  personal_yarn_weight?: { name: string } | null;
};

export type PhotoStatus = {
  complete: boolean;
  failed: boolean;
  progress: number;
  photo?: RavelryPhoto;
};

type Fetch = typeof fetch;

/** The API for one user's token. */
export function ravelryApi(accessToken: string, fetchFn: Fetch = fetch) {
  async function call<T>(
    path: string,
    init: { method?: string; json?: unknown; form?: FormData } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };
    let body: BodyInit | undefined;
    if (init.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(init.json);
    } else if (init.form) body = init.form;
    const response = await fetchFn(`${API}${path}`, {
      method: init.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
    });
    if (!response.ok)
      throw new RavelryApiError(
        response.status,
        `Ravelry ${init.method ?? 'GET'} ${path.split('?')[0]}: ${response.status}`,
      );
    return (await response.json()) as T;
  }

  const user = (username: string) => encodeURIComponent(username);

  return {
    currentUser: async () =>
      (await call<{ user: RavelryUser }>('/current_user.json')).user,

    crafts: async () =>
      (
        await call<{ crafts: RavelryNamed[] }>('/projects/crafts.json', {
          method: 'POST',
        })
      ).crafts,

    projectStatuses: async () =>
      (
        await call<{ project_statuses: RavelryNamed[] }>(
          '/projects/project_statuses.json',
          { method: 'POST' },
        )
      ).project_statuses,

    // Packs (yarns) only go in when a project is created
    createProject: async (username: string, data: RavelryProjectPost) =>
      (
        await call<{ project: RavelryProject }>(
          `/projects/${user(username)}/create.json`,
          { json: { data } },
        )
      ).project,

    updateProject: async (
      username: string,
      id: number,
      data: Omit<RavelryProjectPost, 'packs'>,
    ) =>
      (
        await call<{ project: RavelryProject }>(
          `/projects/${user(username)}/${id}.json`,
          { json: { data } },
        )
      ).project,

    showProject: async (username: string, id: number) =>
      (
        await call<{ project: RavelryProject }>(
          `/projects/${user(username)}/${id}.json`,
        )
      ).project,

    /** A one-use token for upload/image, which needs no other credentials. */
    uploadToken: async () =>
      (
        await call<{ upload_token: string }>('/upload/request_token.json', {
          method: 'POST',
        })
      ).upload_token,

    /** Uploads one image (PNG, JPEG or HEIC, up to 50 MB); its image_id. */
    uploadImage: async (uploadToken: string, file: Blob, filename: string) => {
      const form = new FormData();
      form.set('upload_token', uploadToken);
      form.set('file0', file, filename);
      const { uploads } = await call<{
        uploads:
          | Record<string, { image_id: number }>
          | Record<string, { image_id: number }>[];
      }>('/upload/image.json', { form });
      return imageIdOf(uploads);
    },

    /** Starts adding a photo to a project; poll photoStatus with the token. */
    createProjectPhoto: async (
      username: string,
      projectId: number,
      source: { image_id: number } | { source_url: string },
    ) =>
      (
        await call<{ status_token: string }>(
          `/projects/${user(username)}/${projectId}/create_photo.json`,
          { json: source },
        )
      ).status_token,

    photoStatus: (statusToken: string) =>
      call<PhotoStatus>(
        `/photos/status.json?status_token=${encodeURIComponent(statusToken)}`,
      ),

    deletePhoto: (photoId: number) =>
      call<{ photo: RavelryPhoto }>(`/photos/${photoId}.json`, {
        method: 'DELETE',
      }),

    stash: async (username: string, page = 1) =>
      call<{
        stash: RavelryStash[];
        paginator?: { page: number; page_count: number };
      }>(
        `/people/${user(username)}/stash/list.json?page=${page}&page_size=100&sort=alpha`,
      ),

    yarnSearch: async (query: string, pageSize = 5) =>
      (
        await call<{ yarns: RavelryYarn[] }>(
          `/yarns/search.json?query=${encodeURIComponent(query)}&page_size=${pageSize}&sort=best`,
        )
      ).yarns,
  };
}

export type RavelryApi = ReturnType<typeof ravelryApi>;

/** The image_id of upload/image's first file, in either shape the docs show. */
export function imageIdOf(
  uploads:
    | Record<string, { image_id: number }>
    | Record<string, { image_id: number }>[],
): number {
  const entries = Array.isArray(uploads)
    ? uploads.flatMap((u) => Object.values(u))
    : Object.values(uploads);
  const id = entries[0]?.image_id;
  if (typeof id !== 'number')
    throw new RavelryApiError(502, 'Ravelry returned no image_id');
  return id;
}
