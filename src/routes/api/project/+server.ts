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

import { SECRET_WORDPRESS_PROJECT_CREATION_AUTH_KEY } from '$env/static/private';
import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async function ({ fetch, request }) {
  let data = await request.json();

  try {
    // Note: On the Wordpress site, add the following line to wp-config.php:
    // define('PROJECT_CREATION_AUTH_KEY', 'create_your_own_auth_key');
    // And also set SECRET_WORDPRESS_PROJECT_CREATION_AUTH_KEY to the same 'create_your_own_auth_key' in your .env file
    const postRequest = await fetch(
      `${PUBLIC_WORDPRESS_BASE_URL}/wp-json/tbgalleryapi/v1/project`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Project-Creation-Auth-Key':
            SECRET_WORDPRESS_PROJECT_CREATION_AUTH_KEY,
        },
        body: JSON.stringify(data), // body data type must match "Content-Type" header
      },
    );
    const response = await postRequest.json();
    return json(response);
  } catch (error) {
    throw error;
  }
};
