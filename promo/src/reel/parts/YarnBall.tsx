import React, { useId } from 'react';
import { mix } from '../color';
import { Cut } from './PaperKit';

/**
 * A ball of yarn in cut paper: a base color wound over with strips (lighter
 * and darker shades of it, or other colors for a variegated ball), turning
 * with `spin`.
 */
export const YarnBall: React.FC<{
  x: number;
  y: number;
  r: number;
  colors: string[];
  spin?: number;
  tail?: boolean;
}> = ({ x, y, r, colors, spin = 0 }) => {
  const id = useId().replace(/:/g, '');
  const base = colors[0];
  const multi = colors.length > 1;
  const wrapColor = (i: number) =>
    multi ? colors[(i + 1) % colors.length] : i % 2 ? mix(base, '#ffffff', 0.28) : mix(base, '#3a2414', 0.18);
  const wraps = [0, 30, 62, 98, 134, 172, 214, 256, 300];
  return (
    <Cut depth={2}>
      <g transform={`translate(${x} ${y})`}>
        <defs>
          <clipPath id={`${id}-c`}>
            <circle r={r} />
          </clipPath>
        </defs>
        <circle r={r} fill={base} />
        <g clipPath={`url(#${id}-c)`}>
          <g transform={`rotate(${spin})`}>
            {wraps.map((a, i) => (
              <ellipse
                key={a}
                rx={r * 1.04}
                ry={r * (0.28 + (i % 3) * 0.16)}
                transform={`rotate(${a})`}
                fill="none"
                stroke={wrapColor(i)}
                strokeWidth={Math.max(2, r * (multi ? 0.17 : 0.1))}
              />
            ))}
          </g>
          {/* Soft light from the top left, shade to the bottom right */}
          <circle cx={-r * 0.45} cy={-r * 0.5} r={r * 0.7} fill="#fff" opacity={0.16} />
          <circle cx={r * 0.55} cy={r * 0.6} r={r * 0.85} fill="#3a2414" opacity={0.1} />
        </g>
      </g>
    </Cut>
  );
};
