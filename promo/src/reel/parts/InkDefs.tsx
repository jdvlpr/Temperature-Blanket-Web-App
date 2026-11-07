import React from 'react';

/**
 * Shared filters, defined once: `ink` wobbles pen lines, `wash` turns flat
 * fills into watercolor (ragged edge, a touch of bleed), `grain` is paper.
 */
export const InkDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <defs>
      <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={3} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={4} />
      </filter>
      <filter id="wash" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={8} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={22} result="d" />
        <feGaussianBlur in="d" stdDeviation={1.4} />
      </filter>
      <filter id="washSoft" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={3} seed={11} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={60} result="d" />
        <feGaussianBlur in="d" stdDeviation={8} />
      </filter>
    </defs>
  </svg>
);

/** A watercolor shape: a soft fill plus a darker pigment edge */
export const Wash: React.FC<{
  d?: string;
  children?: React.ReactNode;
  color: string;
  opacity?: number;
  edge?: number;
  soft?: boolean;
}> = ({ d, children, color, opacity = 0.6, edge = 0.35, soft = false }) => (
  <g filter={soft ? 'url(#washSoft)' : 'url(#wash)'}>
    {d ? (
      <>
        <path d={d} fill={color} opacity={opacity} />
        {edge > 0 && (
          <path d={d} fill="none" stroke={color} strokeWidth={3} opacity={edge} />
        )}
      </>
    ) : (
      <g fill={color} opacity={opacity}>
        {children}
      </g>
    )}
  </g>
);
