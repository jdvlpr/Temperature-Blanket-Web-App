import React from 'react';
import { AbsoluteFill } from 'remotion';
import { mixMany, rand } from '../color';
import { RW } from '../theme';
import { Season, seasonAt } from '../timing';
import { Cut, scallop } from './PaperKit';

const NEAR = 0.45; // parallax: share of the camera's movement
const FAR = 0.28;
const SPACING = 140;

const hillY = (bx: number) => 1225 + Math.sin(bx / 260) * 30 + Math.sin(bx / 97 + 1.3) * 12;
const farY = (bx: number) => 1150 + Math.sin(bx / 330 + 2) * 46 + Math.sin(bx / 140) * 14;

const by = (s: Season, c: Record<keyof Season, string>) =>
  mixMany((Object.keys(c) as (keyof Season)[]).map((k) => [c[k], s[k]]));

const band = (y: (bx: number) => number, off: number) => {
  let d = `M -40 1520`;
  for (let x = -40; x <= RW + 40; x += 16) d += ` L ${x} ${y(x + off).toFixed(1)}`;
  return d + ` L ${RW + 40} 1520 Z`;
};

/** Layered paper hills and trees, their colors turning with the seasons */
export const Hills: React.FC<{ camX: number }> = ({ camX }) => {
  const s = seasonAt(camX + RW / 2);
  const near = by(s, { autumn: '#ebc68a', winter: '#eef0ee', spring: '#d5e2b3', summer: '#c6d597' });
  const far = by(s, { autumn: '#f0d9ae', winter: '#e3e9eb', spring: '#e6ecd0', summer: '#dde5bd' });
  const off = camX * NEAR;
  const first = Math.floor((off - 80) / SPACING);
  const trees: React.ReactNode[] = [];
  for (let k = first; k * SPACING < off + RW + 80; k++) {
    const bx = k * SPACING + rand(k, 1) * 50;
    const x = bx - off;
    const ts = seasonAt(bx / NEAR);
    const y = hillY(bx) + 8;
    const pine = ((k % 3) + 3) % 3 === 2;
    const h = 40 + rand(k, 2) * 30;
    const r = 34 + rand(k, 3) * 14;
    if (pine) {
      const c = by(ts, { autumn: '#7f9a78', winter: '#8ea69c', spring: '#8fae7c', summer: '#6f9360' });
      const snow = ts.winter;
      const tri = (w: number, y0: number, hh: number) =>
        `M ${x - w} ${y0} Q ${x} ${y0 + 8} ${x + w} ${y0} L ${x + 4} ${y0 - hh} Q ${x} ${y0 - hh - 6} ${x - 4} ${y0 - hh} Z`;
      trees.push(
        <Cut key={k} depth={1}>
          <rect x={x - 5} y={y - 26} width={10} height={30} rx={4} fill="#9c6f4b" />
          <path d={tri(r * 0.95, y - 20, r * 1.3)} fill={c} />
          <path d={tri(r * 0.75, y - 20 - r * 0.7, r * 1.15)} fill={c} />
          {snow > 0.05 && <path d={tri(r * 0.42, y - 20 - r * 1.25, r * 0.7)} fill="#ffffff" opacity={snow} />}
        </Cut>,
      );
    } else {
      const back = by(ts, { autumn: ['#c9622f', '#b5532c', '#d9962f'][((k % 3) + 3) % 3], winter: '#d7dfe2', spring: ['#dea0a8', '#a9c486'][((k % 2) + 2) % 2], summer: '#86a35e' });
      const front = by(ts, { autumn: ['#e48a3c', '#d9772f', '#eebd60'][((k % 3) + 3) % 3], winter: '#f6f6f2', spring: ['#f3c3c6', '#cfe0a8'][((k % 2) + 2) % 2], summer: '#a8c079' });
      const cy = y - h - r * 0.6;
      trees.push(
        <Cut key={k} depth={1}>
          <path d={`M ${x - 5} ${y} L ${x - 3} ${cy + r * 0.4} L ${x + 3} ${cy + r * 0.4} L ${x + 5} ${y} Z`} fill="#9c6f4b" />
          <path d={scallop(x + 4, cy + 4, r, r * 0.92, 7, 0.18, k)} fill={back} />
          <path d={scallop(x - 3, cy - 3, r * 0.82, r * 0.76, 6, 0.2, k + 1)} fill={front} />
        </Cut>,
      );
    }
  }
  return (
    <AbsoluteFill>
      <svg width={RW} height={1920}>
        <Cut depth={1}>
          <path d={band(farY, camX * FAR)} fill={far} />
        </Cut>
        <Cut depth={2}>
          <path d={band(hillY, off)} fill={near} />
        </Cut>
        {trees}
      </svg>
    </AbsoluteFill>
  );
};
