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

export interface Brand {
  name: string;
  /** snake_case version of the name */
  id: string;
  yarns: Yarn[];
}

// Yarn Weights from Ravelry Standard Yarn Weights
// See https://www.ravelry.com/help/yarn/weights?highlight=11
export type YarnWeight =
  | { name: 'Thread'; id: 't' }
  | { name: 'Cobweb'; id: 'c' }
  | { name: 'Lace'; id: 'l' }
  | { name: 'Light Fingering'; id: 'lf' }
  | { name: 'Fingering'; id: 'f' }
  | { name: 'Sport'; id: 's' }
  | { name: 'DK'; id: 'd' }
  | { name: 'Worsted'; id: 'w' }
  | { name: 'Aran'; id: 'a' }
  | { name: 'Bulky'; id: 'b' }
  | { name: 'Super Bulky'; id: 'sb' }
  | { name: 'Jumbo'; id: 'j' };

export interface Yarn {
  colorways: Colorway[];
  name: string;
  /** snake_case version of the name */
  id: Lowercase<string>;
  /** 
  Using https://www.ravelry.com/help/yarn/weights for the list of yarn weights.
  
  Thread = t
  
  Cobweb = c
  
  Lace = l
  
  Light Fingering = lf
   
  Fingering = f
  
  Sport = s
  
  DK = d
  
  Worsted = w
  
  Aran = a
  
  Bulky = b
  
  Super Bulky = sb
  
  Jumbo = j
  
  */
  weightId: YarnWeight['id'];
}

export interface Colorway {
  source: {
    /** Short name for the URL, for example: yarnwebsite.com */
    name: string;
    href: string;
    /** YYYY-MM-DD date when the colorways were accessed */
    accessed: string;
    /** If the href is no longer available or no longer points to the colorways
     * then this is a YYYY-MM-DD date when the href stopped working
     */
    unavailable?: string;
  };
  colors: Color[];
}

export interface AffiliateYarn {
  brand_id: string;
  yarn_id: string;
  colors: Color[];
}

export interface Color {
  name?: string;
  /** lowercase HTML hex code */
  hex?: Lowercase<string>;
  brandId?: string;
  brandName?: string;
  yarnId?: string;
  yarnName?: string;
  yarnWeightId?: YarnWeight['id'];
  dateAccessed?: string;
  href?: string;
  variant_href?: string;
  affiliate_variant_href?: string | null;
  //* Id used for draggable sorting */
  id?: number;
  locked?: boolean;
}
