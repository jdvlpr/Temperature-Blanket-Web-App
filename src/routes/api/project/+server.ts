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

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Anonymous gallery submissions used to come through here. Publishing needs an
// account now (/api/account/gallery), so every gallery page has an owner who
// can update or unpublish it. Older open tabs get a message they can show.
export const POST: RequestHandler = () =>
  json(
    {
      code: 'SIGN_IN_TO_PUBLISH',
      message: 'Sign in to publish to the gallery.',
    },
    { status: 410 },
  );
