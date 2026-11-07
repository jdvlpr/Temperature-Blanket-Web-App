import React from 'react';
import { AbsoluteFill } from 'remotion';
import { mixMany } from '../color';
import { Season } from '../timing';

const TOP = { autumn: '#f2e1c6', winter: '#e2e8eb', spring: '#f4e2dc', summer: '#f0e6c0' };
const BOTTOM = { autumn: '#f8efe0', winter: '#f4f3ef', spring: '#f8f0e7', summer: '#f8f2df' };

const pick = (c: Record<keyof Season, string>, s: Season) =>
  mixMany((Object.keys(c) as (keyof Season)[]).map((k) => [c[k], s[k]]));

/** The sky, its tint following the season in view */
export const Sky: React.FC<{ season: Season }> = ({ season }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, ${pick(TOP, season)} 0%, ${pick(BOTTOM, season)} 62%)`,
    }}
  />
);
