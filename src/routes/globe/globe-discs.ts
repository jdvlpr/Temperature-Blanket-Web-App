/** Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. */

/**
 * Flat region markers: a disc lying on the globe's surface.
 *
 * These replace three-globe's points layer, whose cylinders can never be
 * flat — it clamps every point to at least 0.1 world units tall
 * (three-globe.mjs, "avoid non-invertible matrix") whatever `pointAltitude`
 * says. The globe's radius is 100, and at the zoom floor the camera sits only
 * 0.5 units above the surface, so that floor alone read as a tall peg.
 *
 * Imported dynamically from Globe.svelte, like globe.gl itself, so three.js
 * stays out of the server bundle and the route's initial chunk.
 */

import {
  CircleGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  type Object3D,
} from 'three';

/** Unit disc, facing +Z; scaled per marker. Shared by every marker. */
const geometry = new CircleGeometry(1, 32);

/** One material per colour, shared by every marker of that colour. */
const materials = new Map<string, MeshBasicMaterial>();

function materialFor(color: string): MeshBasicMaterial {
  let material = materials.get(color);
  if (!material) {
    material = new MeshBasicMaterial({
      color,
      side: DoubleSide,
      // The disc lies exactly on the surface, so without a depth bias it
      // would flicker in and out of the imagery tiles (z-fighting). A bias
      // pulls it forward in depth only — it still sits flat, with no height.
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    materials.set(color, material);
  }
  return material;
}

export function createDisc(color: string): Object3D {
  return new Mesh(geometry, materialFor(color));
}

const DISC_NORMAL = new Vector3(0, 0, 1);
const outward = new Vector3();

/**
 * Lays a disc flat on the surface at `position` (globe-local coordinates, as
 * `getCoords` returns them), with the given radius in world units.
 */
export function placeDisc(
  disc: Object3D,
  position: { x: number; y: number; z: number },
  radius: number,
) {
  disc.position.set(position.x, position.y, position.z);
  // Turn the disc's face to point straight out from the globe's centre, so it
  // is tangent to the sphere at that spot.
  outward.set(position.x, position.y, position.z).normalize();
  disc.quaternion.setFromUnitVectors(DISC_NORMAL, outward);
  const r = radius > 0 ? radius : 1e-6;
  disc.scale.set(r, r, 1);
}
