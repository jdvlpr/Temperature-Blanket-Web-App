import React, { useId } from 'react';
import { Blanket } from '../../components/Blanket';
import { LOGO_STRIPES } from '../../brand';
import { PALETTE, ROWS } from '../palette';
import { FONT, INK, TONE } from '../theme';

/** The app's mark (AppLogo / LogoMark): four stripes with a slot into a round cut-out */
export const LogoIcon: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <mask id={`${id}-hole`}>
          <path fill="white" fillRule="evenodd" d="M0 0H32V32H0Z M12 0H20V13.07A8 8 0 1 1 12 13.07Z" />
        </mask>
        <clipPath id={`${id}-round`}>
          <rect width="32" height="32" rx={3.2} />
        </clipPath>
      </defs>
      <g mask={`url(#${id}-hole)`} clipPath={`url(#${id}-round)`}>
        {LOGO_STRIPES.map((c, i) => (
          <rect key={i} x={0} y={i * 8} width={32} height={8.2} fill={c} />
        ))}
      </g>
    </svg>
  );
};

/** The app's top strip, small: its logo and a title */
export const AppBar: React.FC<{ w: number; title: string; size?: number }> = ({ w, title, size = 20 }) => (
  <g>
    <rect width={w} height={size * 2.6} fill="#f3ead9" />
    <LogoIcon x={size * 0.7} y={size * 0.55} size={size * 1.5} />
    <text x={size * 2.7} y={size * 1.62} fontFamily={FONT.display} fontWeight={600} fontSize={size} fill={INK}>
      {title}
    </text>
  </g>
);

/** The blanket knit so far, as the app previews it */
export const BlanketSoFar: React.FC<{
  head: number;
  w: number;
  h: number;
  orientation: 'rows' | 'columns';
}> = ({ head, w, h, orientation }) => (
  <Blanket
    rows={ROWS}
    colors={PALETTE}
    width={w}
    height={h}
    orientation={orientation}
    grow={(i) => (i < head ? 1 : 0)}
    texture={0}
    radius={4}
  />
);

/** A cloud with a check: saved and synced */
export const Synced: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, s)}>
    <path d="M -26 12 a 14 14 0 0 1 2 -27 a 19 19 0 0 1 36 -4 a 13 13 0 0 1 14 31 Z" fill={TONE.sage} />
    <path d="M -9 0 l 7 7 l 12 -13" fill="none" stroke={TONE.white} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
