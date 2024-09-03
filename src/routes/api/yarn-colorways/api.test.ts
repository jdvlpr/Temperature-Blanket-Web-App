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

describe('Yarn Colorways API', () => {
  test('Endpoint /colorways', async () => {
    const response = await fetch(
      'http://localhost:5180/api/yarn-colorways/v1/colorways',
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data.data[0]).toHaveProperty('hex');
    expect(data.data[0]).toHaveProperty('name');
    expect(data.data[0]).toHaveProperty('brandId');
    expect(data.data[0]).toHaveProperty('yarnId');
  });

  test('Endpoint /match/green', async () => {
    const response = await fetch(
      'http://localhost:5180/api/yarn-colorways/v1/match/green',
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data.data[0]).toHaveProperty('hex');
    expect(data.data[0]).toHaveProperty('name');
    expect(data.data[0]).toHaveProperty('brandId');
    expect(data.data[0]).toHaveProperty('yarnId');
  });

  test('Endpoint /brands', async () => {
    const response = await fetch(
      'http://localhost:5180/api/yarn-colorways/v1/brands',
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data.data[0]).toHaveProperty('brandId');
    expect(data.data[0]).toHaveProperty('brandName');
  });

  test('Endpoint /yarns', async () => {
    const response = await fetch(
      'http://localhost:5180/api/yarn-colorways/v1/yarns',
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data.data[0]).toHaveProperty('yarnId');
    expect(data.data[0]).toHaveProperty('yarnName');
  });

  // Once I made a mistake and included "api/*" in the excluded routes list in svelte.config.js,
  // which prevented the Yarn Colorways API from working.
  // This checks to make sure "api/*" is not in that list.
  test('"api/*" is not in the excluded routes list', () => {
    expect(routes.exclude).not.toContain('/api/*');
  });
});
