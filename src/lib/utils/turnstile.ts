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

// Cloudflare Turnstile in the browser: guests' gallery submissions carry a
// token, which /api/project checks (#lib/server/turnstile.ts).

/** The header a guest's gallery submission sends its Turnstile token in */
export const TURNSTILE_HEADER = 'CF-Turnstile-Response';

/** The parts of Turnstile's script used here */
export type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: Record<string, unknown>,
  ) => string | undefined;
  execute: (container: HTMLElement) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=';
const ONLOAD = 'onTurnstileLoad';

let loading: Promise<TurnstileApi> | undefined;

/** Loads Turnstile's script, once (again after a failure). */
export function loadTurnstile(): Promise<TurnstileApi> {
  const existing = (window as { turnstile?: TurnstileApi }).turnstile;
  if (existing) return Promise.resolve(existing);
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => {
      script.remove();
      loading = undefined;
      reject(new Error('Turnstile could not load'));
    };
    (window as unknown as Record<string, unknown>)[ONLOAD] = () => {
      const turnstile = (window as { turnstile?: TurnstileApi }).turnstile;
      if (turnstile) resolve(turnstile);
      else fail();
    };
    script.src = SCRIPT_URL + ONLOAD;
    script.async = true;
    script.onerror = fail;
    document.head.append(script);
  });
  return loading;
}
