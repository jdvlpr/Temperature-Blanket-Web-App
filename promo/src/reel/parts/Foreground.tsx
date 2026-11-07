import React from 'react';
import { AbsoluteFill } from 'remotion';
import { mixMany, rand } from '../color';
import { RW } from '../theme';
import { Season, seasonAt } from '../timing';
import { Cut } from './PaperKit';

const P = 1.25; // nearer than the world: moves a little faster than the camera
const SPACING = 110;

const by = (s: Season, c: Record<keyof Season, string>) =>
  mixMany((Object.keys(c) as (keyof Season)[]).map((k) => [c[k], s[k]]));

const edge = (y0: number, off: number, amp: number, freq: number, phase: number) => {
  let d = `M -40 1960`;
  for (let x = -40; x <= RW + 40; x += 12) {
    const bx = x + off;
    // Small rounded bumps, like torn or cut grass
    const bump = Math.abs(Math.sin(bx / 22 + phase)) * 9;
    d += ` L ${x} ${(y0 + Math.sin(bx / freq + phase) * amp - bump).toFixed(1)}`;
  }
  return d + ` L ${RW + 40} 1960 Z`;
};

const LEAF =
  'M0 -1 L0.22 -0.55 L0.62 -0.7 L0.5 -0.28 L0.95 -0.1 L0.55 0.12 L0.68 0.5 L0.12 0.32 L0.05 0.95 L-0.05 0.95 L-0.12 0.32 L-0.68 0.5 L-0.55 0.12 L-0.95 -0.1 L-0.5 -0.28 L-0.62 -0.7 L-0.22 -0.55 Z';

/** The ground nearest us, filling the bottom of the frame: grass, snow, flowers or fallen leaves by season */
export const Foreground: React.FC<{ camX: number }> = ({ camX }) => {
  const off = camX * P;
  const s = seasonAt(camX + RW / 2);
  const top = by(s, { autumn: '#e0ad5c', winter: '#f3f4f1', spring: '#b3cc8c', summer: '#9dbb72' });
  const low = by(s, { autumn: '#cf9748', winter: '#dfe7ea', spring: '#9cba76', summer: '#86a660' });
  const first = Math.floor((off - 60) / SPACING);
  const bits: React.ReactNode[] = [];
  for (let k = first; k * SPACING < off + RW + 60; k++) {
    const bx = k * SPACING + rand(k, 9) * 60;
    const x = bx - off;
    const y = 1530 + rand(k, 8) * 160;
    const ws = seasonAt(bx / P);
    const kind = (Object.keys(ws) as (keyof Season)[]).reduce((a, b) => (ws[a] >= ws[b] ? a : b));
    const r = rand(k, 7);
    if (kind === 'autumn') {
      const c = ['#c4572f', '#df7c3a', '#eba649', '#a8402c'][k & 3];
      bits.push(
        <path key={k} d={LEAF} fill={c} transform={`translate(${x} ${y}) rotate(${r * 360}) scale(${16 + r * 10} ${9 + r * 6})`} />,
      );
    } else if (kind === 'winter') {
      bits.push(<ellipse key={k} cx={x} cy={y} rx={34 + r * 30} ry={12 + r * 8} fill="#ffffff" />);
    } else if (kind === 'spring') {
      bits.push(
        <g key={k} transform={`translate(${x} ${y})`}>
          <path d="M 0 0 C -2 -14 2 -24 0 -34" stroke="#7c9c5e" strokeWidth={4} fill="none" strokeLinecap="round" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 8} cy={-38 + Math.sin((a * Math.PI) / 180) * 8} r={7} fill={k % 2 ? '#f3c3c6' : '#fffaf2'} />
          ))}
          <circle cy={-38} r={5} fill="#f2c45c" />
        </g>,
      );
    } else {
      bits.push(
        <g key={k} transform={`translate(${x} ${y})`} fill="#7c9c5e">
          <path d="M -14 0 Q -16 -24 -22 -36 Q -8 -22 -4 0 Z" />
          <path d="M -4 0 Q -2 -30 2 -46 Q 6 -28 6 0 Z" />
          <path d="M 4 0 Q 12 -22 22 -32 Q 16 -16 14 0 Z" />
        </g>,
      );
    }
  }
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={RW} height={1920}>
        <Cut depth={3}>
          <path d={edge(1478, off, 10, 180, 0.4)} fill={top} />
        </Cut>
        <Cut depth={3}>
          <path d={edge(1700, off * 1.15, 14, 140, 2.1)} fill={low} />
        </Cut>
        <Cut depth={1}>{bits}</Cut>
      </svg>
    </AbsoluteFill>
  );
};
