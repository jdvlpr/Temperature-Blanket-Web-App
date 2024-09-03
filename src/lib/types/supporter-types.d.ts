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

export interface BronzeSupporter {
  name: string;
  date: string;
}

export interface SilverSupporter extends BronzeSupporter {
  href: string;
  linkText: string;
}

export interface GoldSupporter extends SilverSupporter {
  imageSrc: string;
}

export interface Supporters {
  bronze?: BronzeSupporter[];
  silver?: SilverSupporter[];
  gold?: GoldSupporter[];
}
