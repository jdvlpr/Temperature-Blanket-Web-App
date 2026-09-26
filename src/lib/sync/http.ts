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

// The /api/sync routes, from the browser. Projects are gzipped here, so the
// server only ever stores and returns them.

import { SyncHttpError, type SyncServer } from './engine';
import {
  SYNC_API,
  SYNC_HEADERS,
  SYNC_SCHEMA_VERSION,
  type ChangesResponse,
  type ProjectMeta,
  type SyncErrorCode,
} from './protocol';

async function gzip(text: string): Promise<ArrayBuffer> {
  const stream = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

async function gunzip(body: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(
    body.pipeThrough(
      new DecompressionStream('gzip') as TransformStream<
        Uint8Array,
        Uint8Array
      >,
    ),
  ).text();
}

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function errorFrom(response: Response): Promise<SyncHttpError> {
  const body = await response.json().catch(() => null);
  return new SyncHttpError(
    response.status,
    body?.code as SyncErrorCode | undefined,
    body?.message ?? response.statusText,
  );
}

export function createHttpSyncServer(
  // Not stored as a bare `fetch`: calling it off an object throws "Illegal invocation"
  fetchFn: typeof fetch = (input, init) => fetch(input, init),
): SyncServer {
  async function request(path: string, init?: RequestInit) {
    try {
      return await fetchFn(`${SYNC_API}${path}`, {
        ...init,
        credentials: 'same-origin',
      });
    } catch {
      throw new SyncHttpError(0, undefined, 'Network error');
    }
  }

  const projectPath = (id: string) => `/projects/${encodeURIComponent(id)}`;

  return {
    async changes(since) {
      const response = await request(`/changes?since=${since}&limit=100`);
      if (!response.ok) throw await errorFrom(response);
      return (await response.json()) as ChangesResponse;
    },

    async download(id) {
      const response = await request(projectPath(id));
      if (response.status === 404) return null;
      if (!response.ok || !response.body) throw await errorFrom(response);
      return {
        rev: Number(response.headers.get(SYNC_HEADERS.rev)),
        json: await gunzip(response.body),
      };
    },

    async upload(id, upload) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/gzip',
        [SYNC_HEADERS.clientUpdatedAt]: String(upload.clientUpdatedAt),
        [SYNC_HEADERS.schemaVersion]: String(SYNC_SCHEMA_VERSION),
        [SYNC_HEADERS.title]: encodeURIComponent(upload.title),
        [SYNC_HEADERS.contentHash]: upload.contentHash,
      };
      if (upload.baseRev !== null)
        headers[SYNC_HEADERS.baseRev] = String(upload.baseRev);

      const response = await request(projectPath(id), {
        method: 'PUT',
        headers,
        body: await gzip(upload.json),
      });
      if (response.status === 409)
        return {
          ok: false,
          current: ((await response.json()).current ??
            null) as ProjectMeta | null,
        };
      if (!response.ok) throw await errorFrom(response);
      return { ok: true, meta: (await response.json()).meta as ProjectMeta };
    },

    async remove(id, baseRev) {
      const response = await request(`${projectPath(id)}?baseRev=${baseRev}`, {
        method: 'DELETE',
      });
      if (response.status === 409)
        return {
          ok: false,
          current: (await response.json()).current as ProjectMeta,
        };
      if (response.status === 404 || response.ok) return { ok: true };
      throw await errorFrom(response);
    },
  };
}
