import React, { useId } from 'react';

export type BlanketProps = {
  /** Each day's color index (-1: none) */
  rows: number[];
  colors: string[];
  width: number;
  height: number;
  /** columns: days run left to right (a blanket on its side); rows: top to bottom */
  orientation?: 'columns' | 'rows';
  /** 0..1 per day: how far that day's stripe has grown in */
  grow?: (i: number) => number;
  /** For columns: where each day's stripe starts (its top), before it settles */
  top?: (i: number) => number;
  /** Recolor with another palette, sweeping in by day (0..1 per day) */
  recolor?: { colors: string[]; rows: number[]; t: (i: number) => number };
  /** 0..1: how much knitted texture shows */
  texture?: number;
  /** Stitch height relative to stitch width */
  stitchAspect?: number;
  radius?: number;
  wobble?: number;
};

const mix = (a: string, b: string, t: number) => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const c = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};

/**
 * A knitted temperature blanket: one stripe per day, colored by the app's
 * ranges, with a stockinette texture (a V per stitch) masked over it.
 */
export const Blanket: React.FC<BlanketProps> = ({
  rows,
  colors,
  width,
  height,
  orientation = 'rows',
  grow,
  top,
  recolor,
  texture = 1,
  stitchAspect = 0.8,
  radius = 6,
  wobble = 0,
}) => {
  const id = useId().replace(/:/g, '');
  const n = rows.length;
  const along = orientation === 'columns' ? width : height;
  const size = along / n; // one stripe
  // Stitches: one stitch per stripe across its width (columns), or several
  // per row across the blanket (rows)
  const sw = orientation === 'columns' ? size : size / stitchAspect;
  const sh = orientation === 'columns' ? size * stitchAspect : size;

  const colorOf = (i: number) => {
    const base = colors[rows[i]] ?? '#888888';
    if (!recolor) return base;
    return mix(base, recolor.colors[recolor.rows[i]] ?? base, recolor.t(i));
  };

  const legs = (fill: string) => (
    <>
      <ellipse
        cx={sw * 0.29}
        cy={sh * 0.5}
        rx={sw * 0.24}
        ry={sh * 0.6}
        transform={`rotate(-32 ${sw * 0.29} ${sh * 0.5})`}
        fill={fill}
      />
      <ellipse
        cx={sw * 0.71}
        cy={sh * 0.5}
        rx={sw * 0.24}
        ry={sh * 0.6}
        transform={`rotate(32 ${sw * 0.71} ${sh * 0.5})`}
        fill={fill}
      />
    </>
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect width={width} height={height} rx={radius} />
        </clipPath>
        {/* Gaps between stitches: everything but the legs */}
        <pattern
          id={`${id}-gaps`}
          width={sw}
          height={sh}
          patternUnits="userSpaceOnUse"
        >
          <rect width={sw} height={sh} fill="white" />
          {legs('black')}
        </pattern>
        <mask
          id={`${id}-mask`}
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={width}
          height={height}
        >
          <rect width={width} height={height} fill={`url(#${id}-gaps)`} />
        </mask>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <pattern
          id={`${id}-hi`}
          width={sw}
          height={sh}
          patternUnits="userSpaceOnUse"
        >
          {legs(`url(#${id}-shine)`)}
        </pattern>
        <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="black" stopOpacity="0.22" />
        </linearGradient>
        {wobble > 0 && (
          <filter
            id={`${id}-wobble`}
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.004 0.006"
              numOctaves={2}
              seed={7}
            />
            <feDisplacementMap in="SourceGraphic" scale={wobble} />
          </filter>
        )}
      </defs>
      <g
        clipPath={`url(#${id}-clip)`}
        filter={wobble > 0 ? `url(#${id}-wobble)` : undefined}
      >
        {rows.map((_, i) => {
          const g = grow ? grow(i) : 1;
          if (g <= 0) return null;
          if (orientation === 'columns') {
            const t = top ? top(i) : 0;
            const h = (height - t) * g;
            return (
              <rect
                key={i}
                x={i * size}
                y={height - h}
                width={size + 0.6}
                height={h}
                fill={colorOf(i)}
              />
            );
          }
          return (
            <rect
              key={i}
              x={0}
              y={i * size}
              width={width * g}
              height={size + 0.6}
              fill={colorOf(i)}
            />
          );
        })}
        {texture > 0 && (
          <g opacity={texture}>
            <rect
              width={width}
              height={height}
              fill="black"
              opacity={0.42}
              mask={`url(#${id}-mask)`}
            />
            <rect
              width={width}
              height={height}
              fill={`url(#${id}-hi)`}
              opacity={0.5}
            />
          </g>
        )}
        <rect
          width={width}
          height={height}
          fill={`url(#${id}-light)`}
          opacity={texture}
        />
      </g>
    </svg>
  );
};
