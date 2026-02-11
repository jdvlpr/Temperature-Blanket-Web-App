// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
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

import fetch from 'node-fetch';
import { describe, expect, test } from 'vitest';
import routes from './.svelte-kit/cloudflare/_routes.json';
import fs from 'node:fs';

// Constants for base URL
const PORT = 5180;
const HOST = 'localhost';

// Determine protocol based on environment or same logic as vite.config.ts
const certPath = process.env.PRIVATE_TAILSCALE_CRT_PATH;
const keyPath = process.env.PRIVATE_TAILSCALE_KEY_PATH;
const useHttps =
  certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath);
const PROTOCOL = useHttps ? 'https' : 'http';
const BASE_URL = process.env.TEST_BASE_URL || `${PROTOCOL}://${HOST}:${PORT}`;

describe('Yarn Colorways API', () => {
  test('Endpoint /colorways', async () => {
    const response = await fetch(`${BASE_URL}/api/yarn-colorways/v1/colorways`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data.data[0]).toHaveProperty('hex');
    expect(data.data[0]).toHaveProperty('name');
    expect(data.data[0]).toHaveProperty('brandId');
    expect(data.data[0]).toHaveProperty('yarnId');
    expect(data.data[0]).toHaveProperty('yarnName');
    expect(data.data[0]).toHaveProperty('yarnWeightId');
  });

  test('Endpoint /match/green', async () => {
    const response = await fetch(
      `${BASE_URL}/api/yarn-colorways/v1/match/green`,
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data.data[0]).toHaveProperty('hex');
    expect(data.data[0]).toHaveProperty('name');
    expect(data.data[0]).toHaveProperty('brandId');
    expect(data.data[0]).toHaveProperty('yarnId');
    expect(data.data[0]).toHaveProperty('yarnName');
    expect(data.data[0]).toHaveProperty('yarnWeightId');
  });

  test('Endpoint /brands', async () => {
    const response = await fetch(`${BASE_URL}/api/yarn-colorways/v1/brands`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data.data[0]).toHaveProperty('brandId');
    expect(data.data[0]).toHaveProperty('brandName');
    expect(data.data[0]).toHaveProperty('yarns');
  });

  test('Endpoint /yarns', async () => {
    const response = await fetch(`${BASE_URL}/api/yarn-colorways/v1/yarns`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data.data[0]).toHaveProperty('yarnId');
    expect(data.data[0]).toHaveProperty('yarnName');
    expect(data.data[0]).toHaveProperty('colorways');
  });

  test('Endpoint /weights', async () => {
    const response = await fetch(`${BASE_URL}/api/yarn-colorways/v1/weights`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data.data[0]).toHaveProperty('id');
    expect(data.data[0]).toHaveProperty('name');
    expect(data.data[0]).toHaveProperty('yarns');
  });

  // Once I made a mistake and included "api/*" in the excluded routes list in svelte.config.js,
  // which prevented the Yarn Colorways API from working.
  // This checks to make sure "api/*" is not in that list.
  test('"api/*" is not in the excluded routes list', () => {
    expect(routes.exclude).not.toContain('/api/*');
  });
});
