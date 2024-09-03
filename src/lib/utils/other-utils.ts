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

export const exists = (variable) => {
  return (
    !!variable &&
    variable !== '' &&
    variable.length !== 0 &&
    typeof variable !== 'undefined' &&
    JSON.stringify(variable) !== '{}'
  );
};

/**
 * compare two versions, return true if local is up to date,
 * false otherwise if both versions are in the form of major[.minor][.patch]
 * then the comparison parses and compares as such otherwise the versions
 * are treated as strings and normal string compare is done
 *
 * @param   {String | Number}  local   [local description]
 * @param   {String | Number}  remote  [remote description]
 *
 * @return  {Boolean}          [return description]
 */
export const upToDate = (local, remote) => {
  const VPAT = /^\d+(\.\d+){0,2}$/;
  if (!local || !remote || local.length === 0 || remote.length === 0) {
    return false;
  }
  if (local === remote) {
    return true;
  }
  if (VPAT.test(local) && VPAT.test(remote)) {
    let lparts = local.split('.');
    while (lparts.length < 3) {
      lparts.push('0');
    }
    let rparts = remote.split('.');
    while (rparts.length < 3) {
      rparts.push('0');
    }
    // Account for legacy versioning system before 2.0.0, where version 1.740 would be higher than version 1.9 even though this is not how it was supposed to be
    const beforeMajorVersionTwo = parseInt(rparts[0], 10) <= 1;
    for (let i = 0; i < 3; i++) {
      let lString = lparts[i];
      let rString = rparts[i];
      // If the remote MAJOR version is less than 2, add zeros if the length of the strings don't match
      // If the remote version is greater than 2 then no need to add zeros; follow semver
      if (beforeMajorVersionTwo) {
        while (lString.length < rString.length) {
          lString = lString + '0';
        }
        while (lString.length > rString.length) {
          rString = rString + '0';
        }
      }

      const l = parseInt(lString, 10);
      const r = parseInt(rString, 10);
      if (l === r) {
        continue;
      }
      return l > r;
    }
    return true;
  } else {
    return local >= remote;
  }
};

export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
