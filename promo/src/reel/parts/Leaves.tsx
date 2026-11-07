import React from 'react';
import { AbsoluteFill } from 'remotion';
import { rand } from '../color';
import { RW, TONE } from '../theme';
import { seasonAt } from '../timing';

const N = 18;
const SPAN = RW + 240;
const LEAF_COLORS = [TONE.russet, TONE.honey, TONE.pumpkin, TONE.brick, TONE.olive];

/** A maple-ish leaf, about 1 unit across */
const LEAF =
  'M0 -1 L0.22 -0.55 L0.62 -0.7 L0.5 -0.28 L0.95 -0.1 L0.55 0.12 L0.68 0.5 L0.12 0.32 L0.05 0.95 L-0.05 0.95 L-0.12 0.32 L-0.68 0.5 L-0.55 0.12 L-0.95 -0.1 L-0.5 -0.28 L-0.62 -0.7 L-0.22 -0.55 Z';

/**
 * Foreground: leaves in fall, snow in winter, petals in spring, seed fluff in
 * summer (by where each one is in the world), moving a little faster than
 * the camera.
 */
export const Leaves: React.FC<{ f: number; camX: number; fall?: number }> = ({
  f,
  camX,
  fall = f,
}) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <svg width={RW} height={1920}>
      {Array.from({ length: N }, (_, i) => {
        const speed = 1.6 + rand(i, 1) * 1.8;
        const size = 18 + rand(i, 2) * 20;
        const sway = Math.sin(f / (22 + rand(i, 3) * 18) + i) * (30 + rand(i, 4) * 40);
        const raw = rand(i, 5) * SPAN + sway + f * 0.6 - camX * 1.15;
        const x = (((raw % SPAN) + SPAN) % SPAN) - 120;
        const y = ((rand(i, 6) * 2100 + fall * speed) % 2100) - 100;
        const s = seasonAt(x + camX);
        const spin = f * (1.5 + rand(i, 7) * 2) * (i % 2 ? 1 : -1) + i * 40;
        const flip = Math.cos(f / 15 + i);
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            {s.autumn > 0.01 && (
              <g
                opacity={s.autumn * 0.85}
                transform={`rotate(${spin}) scale(${size} ${size * (0.4 + 0.6 * Math.abs(flip))})`}
              >
                <path d={LEAF} fill="#5a3f2c" opacity={0.16} transform="translate(0.08 0.16)" />
                <path d={LEAF} fill={LEAF_COLORS[i % LEAF_COLORS.length]} />
                <path d="M0 -0.6 L0 0.85" stroke="#fff" strokeWidth={0.05} opacity={0.35} />
              </g>
            )}
            {s.winter > 0.01 && (
              <circle r={size * 0.28} fill="#ffffff" stroke="#b9c9d3" strokeWidth={1.5} opacity={s.winter * 0.9} />
            )}
            {s.spring > 0.01 && (
              <ellipse
                rx={size * 0.42}
                ry={size * 0.24 * (0.4 + 0.6 * Math.abs(flip))}
                transform={`rotate(${spin})`}
                fill={i % 3 ? '#f1bfc3' : '#f8dfe0'}
                opacity={s.spring * 0.85}
              />
            )}
            {s.summer > 0.01 && i % 3 === 0 && (
              <g opacity={s.summer * 0.55} stroke="#fffdf6" strokeWidth={1.6} transform={`rotate(${spin})`}>
                {[0, 60, 120].map((a) => (
                  <line key={a} x1={-size * 0.3} x2={size * 0.3} transform={`rotate(${a})`} />
                ))}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
