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

// The gallery routes on the WordPress site (the plugin's tbgalleryapi/v1), called
// with the shared project-creation key. Owner routes send the app user ID in the
// Project-Owner-Id header, which only this server sets: /api/project builds its
// own headers, so a guest can't claim to be someone.

export type GalleryApiConfig = {
  /** e.g. https://wp.tbnkt.com */
  baseUrl: string;
  key: string;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
};

/** What the project route answers: `code` 200 with `id`, or 400/409/500 and a message. */
export type PublishResponse = {
  code?: number | string;
  message?: string;
  id?: number;
  link?: string;
  title?: string;
  data?: unknown;
};

export function galleryApi({ baseUrl, key, fetch }: GalleryApiConfig) {
  const post = (path: string, body: string, ownerId?: string) =>
    fetch(`${baseUrl}/wp-json/tbgalleryapi/v1${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Project-Creation-Auth-Key': key,
        ...(ownerId && { 'Project-Owner-Id': ownerId }),
      },
      body,
    });

  return {
    /** Creates a gallery page from the browser's payload, forwarded unchanged. */
    async publish(payload: string, ownerId: string): Promise<PublishResponse> {
      const response = await post('/project', payload, ownerId);
      return response.json();
    },

    /** Shares a palette ({ title, yarn_url }) as this owner; accounts only. */
    async publishPalette(
      payload: { title: string; yarn_url: string },
      ownerId: string,
    ): Promise<PublishResponse> {
      const response = await post('/palette', JSON.stringify(payload), ownerId);
      return response.json();
    },

    /**
     * Moves the owner's page (a project or a palette) to the trash. 'gone' when WordPress has no such page
     * for this owner (already removed by hand, say), so the app can forget it.
     */
    async trash(postId: number, ownerId: string): Promise<'ok' | 'gone'> {
      const response = await post(`/project/${postId}/trash`, '{}', ownerId);
      if (response.ok) return 'ok';
      if (response.status === 404) return 'gone';
      throw new Error(`Gallery trash failed: ${response.status}`);
    },

    /** Leaves all the owner's pages in the gallery without an owner. */
    async clearOwner(ownerId: string) {
      const response = await post('/owner/clear', '{}', ownerId);
      if (!response.ok)
        throw new Error(`Gallery clear owner failed: ${response.status}`);
    },
  };
}

export type GalleryApi = ReturnType<typeof galleryApi>;
