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
import { SECRET_WORDPRESS_PROJECT_CREATION_AUTH_KEY } from '$app/env/private';

import { PUBLIC_WORDPRESS_BASE_URL } from '$app/env/public';
import { getPlatform } from '#lib/server/cloudflare.js';
import { TURNSTILE_HEADER, verifyTurnstile } from '#lib/server/turnstile.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Answers as WordPress does (its code and message, with status 200), so the
// dialog shows the message like any other
const TURNSTILE_ANSWERS = {
  rejected: {
    code: 403,
    message: "We couldn't check that you're not a robot. Please try again.",
  },
  unavailable: {
    code: 503,
    message:
      "The check that you're not a robot isn't working right now. Please try again later.",
  },
};

// Anonymous submissions: each needs a Turnstile token (accounts publish
// through /api/account/gallery instead)
export const POST: RequestHandler = async function ({
  fetch,
  request,
  getClientAddress,
}) {
  const turnstile = await verifyTurnstile({
    token: request.headers.get(TURNSTILE_HEADER),
    secret: getPlatform()?.env?.TURNSTILE_SECRET_KEY,
    remoteIp: request.headers.get('CF-Connecting-IP') ?? getClientAddress(),
  });
  if (turnstile !== 'ok') return json(TURNSTILE_ANSWERS[turnstile]);

  const data = await request.json();

  // Note: On the Wordpress site, add the following line to wp-config.php:
  // define('PROJECT_CREATION_AUTH_KEY', 'create_your_own_auth_key');
  // And also set SECRET_WORDPRESS_PROJECT_CREATION_AUTH_KEY to the same 'create_your_own_auth_key' in your .env file
  const postRequest = await fetch(
    `${PUBLIC_WORDPRESS_BASE_URL}/wp-json/tbgalleryapi/v1/project`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Project-Creation-Auth-Key': SECRET_WORDPRESS_PROJECT_CREATION_AUTH_KEY,
      },
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    },
  );

  const response = await postRequest.json();
  return json(response);
};
