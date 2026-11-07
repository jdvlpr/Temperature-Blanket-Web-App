import React from 'react';
import { AbsoluteFill } from 'remotion';
import { rand } from '../color';
import { RW } from '../theme';
import { Cut, cloud } from './PaperKit';

const SPAN = RW + 700;
/** Paper clouds drifting high up, far behind (a fifth of the camera's speed) */
export const Clouds: React.FC<{ f: number; camX: number }> = ({ f, camX }) => (
  <AbsoluteFill>
    <svg width={RW} height={1920}>
      {Array.from({ length: 4 }, (_, i) => {
        const raw = rand(i, 1) * SPAN - camX * 0.2 + f * 0.25;
        const x = (((raw % SPAN) + SPAN) % SPAN) - 350;
        const y = 420 + rand(i, 2) * 480;
        const w = 220 + rand(i, 3) * 160;
        return (
          <Cut key={i} depth={1}>
            <path d={cloud(x, y, w)} fill="#fffaf2" />
          </Cut>
        );
      })}
    </svg>
  </AbsoluteFill>
);
