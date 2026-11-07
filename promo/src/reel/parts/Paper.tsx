import React from 'react';
import { AbsoluteFill } from 'remotion';
import { RH, RW } from '../theme';

/** Paper grain and a warm vignette, over everything (static) */
export const Paper: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <svg width={RW} height={RH}>
      <defs>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} />
          <feColorMatrix
            values="0 0 0 0 0.29  0 0 0 0 0.23  0 0 0 0 0.19  0 0 0 0.09 0"
          />
        </filter>
        <filter id="fibers">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.08" numOctaves={3} seed={9} />
          <feColorMatrix
            values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0.06 0"
          />
        </filter>
        <radialGradient id="vignette" cx="0.5" cy="0.48" r="0.75">
          <stop offset="0.6" stopColor="#7a5a3c" stopOpacity={0} />
          <stop offset="1" stopColor="#7a5a3c" stopOpacity={0.16} />
        </radialGradient>
      </defs>
      <rect width={RW} height={RH} filter="url(#fibers)" />
      <rect width={RW} height={RH} filter="url(#grain)" />
      <rect width={RW} height={RH} fill="url(#vignette)" />
    </svg>
  </AbsoluteFill>
);
