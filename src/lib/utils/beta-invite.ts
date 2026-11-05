// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// The beta invite banner is shown to a share of visitors: each browser picks a
// bucket (0–99) once and keeps it in Local Storage (`beta_invite`), and sees the
// banner while its bucket is under PUBLIC_BETA_INVITE_PERCENT (a build variable,
// `__BETA_INVITE_PERCENT__`) and it hasn't been closed. Raising the percentage
// keeps everyone who already sees it.

export type BetaInvite = { bucket: number; dismissed: boolean };

export const BETA_INVITE_KEY = 'beta_invite';

/** A percentage as a whole number from 0 to 100; anything else is 0 */
export function clampPercent(n: unknown): number {
  const value = Number(n);
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** A whole number from 0 to 99 */
export function pickBucket(random: () => number = Math.random): number {
  return Math.min(99, Math.max(0, Math.floor(random() * 100)));
}

/** Whether this browser should see the invite */
export function shouldShowBetaInvite({
  percent,
  bucket,
  dismissed,
}: {
  percent: number;
  bucket: number;
  dismissed: boolean;
}): boolean {
  if (dismissed) return false;
  if (!Number.isInteger(bucket) || bucket < 0 || bucket > 99) return false;
  return bucket < clampPercent(percent);
}
