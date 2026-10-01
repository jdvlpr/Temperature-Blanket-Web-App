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

import { warmth, type Oklab } from './color-space';

const dist = (a: Oklab, b: Oklab) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const pathLength = (labs: Oklab[], order: number[]) => {
  let total = 0;
  for (let i = 1; i < order.length; i++)
    total += dist(labs[order[i - 1]], labs[order[i]]);
  return total;
};

/**
 * An order for colors that flows smoothly from one to the next (the shortest
 * path through all of them), oriented so the warm end comes first when
 * `warmFirst` is true and last otherwise. A gauge's first color is its
 * highest range when its direction is high-to-low, so warm-first suits most
 * temperature gauges. Returns indices into `labs`.
 */
export function orderAsGradient(
  labs: Oklab[],
  { warmFirst }: { warmFirst: boolean },
): number[] {
  const n = labs.length;
  if (n < 3) return orient(labs, [...Array(n).keys()], warmFirst);

  // Nearest neighbor from every starting color, keep the shortest
  let best: number[] = [];
  let bestLength = Infinity;
  for (let start = 0; start < n; start++) {
    const order = [start];
    const used = new Set(order);
    while (order.length < n) {
      const last = labs[order[order.length - 1]];
      let next = -1;
      let nextDistance = Infinity;
      for (let i = 0; i < n; i++) {
        if (used.has(i)) continue;
        const d = dist(last, labs[i]);
        if (d < nextDistance) {
          nextDistance = d;
          next = i;
        }
      }
      order.push(next);
      used.add(next);
    }
    const length = pathLength(labs, order);
    if (length < bestLength) {
      bestLength = length;
      best = order;
    }
  }

  // 2-opt: reverse any stretch of the path that makes it shorter
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        const length = pathLength(labs, candidate);
        if (length < bestLength - 1e-9) {
          best = candidate;
          bestLength = length;
          improved = true;
        }
      }
    }
  }

  return orient(labs, best, warmFirst);
}

function orient(labs: Oklab[], order: number[], warmFirst: boolean) {
  if (order.length < 2) return order;
  const firstIsWarmer =
    warmth(labs[order[0]]) >= warmth(labs[order[order.length - 1]]);
  return firstIsWarmer === warmFirst ? order : [...order].reverse();
}

/** Where to insert a color into an ordered palette to keep it smoothest */
export function bestInsertionIndex(labs: Oklab[], lab: Oklab): number {
  if (!labs.length) return 0;
  let best = labs.length;
  let bestCost = dist(labs[labs.length - 1], lab);
  if (dist(lab, labs[0]) < bestCost) {
    best = 0;
    bestCost = dist(lab, labs[0]);
  }
  for (let i = 1; i < labs.length; i++) {
    const cost =
      dist(labs[i - 1], lab) + dist(lab, labs[i]) - dist(labs[i - 1], labs[i]);
    if (cost < bestCost) {
      bestCost = cost;
      best = i;
    }
  }
  return best;
}
