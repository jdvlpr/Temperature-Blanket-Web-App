import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COLOR } from '../brand';

/** Deep ink with a warm glow and a little film grain */
export const Backdrop: React.FC<{ glow?: string; glowAt?: string }> = ({
  glow = 'rgba(242,164,58,0.16)',
  glowAt = '30% 20%',
}) => (
  <AbsoluteFill style={{ background: COLOR.ink }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 800px at ${glowAt}, ${glow}, transparent 70%), radial-gradient(900px 700px at 85% 90%, rgba(59,123,163,0.22), transparent 70%)`,
      }}
    />
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)',
      }}
    />
    <svg
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.07,
        mixBlendMode: 'overlay',
      }}
    >
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  </AbsoluteFill>
);
