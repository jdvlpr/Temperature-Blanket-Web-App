import React from 'react';

/**
 * Cut paper: each layer is a flat piece with a slightly irregular cut edge,
 * fiber grain, and a soft shadow onto what's behind it. `paper1..3` are the
 * depths (how far the piece sits off the one behind).
 */
export const PaperDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <defs>
      {[
        { id: 'paper1', dy: 3, blur: 3, a: 0.16 },
        { id: 'paper2', dy: 7, blur: 7, a: 0.18 },
        { id: 'paper3', dy: 14, blur: 14, a: 0.22 },
      ].map(({ id, dy, blur, a }) => (
        <filter key={id} id={id} x="-20%" y="-20%" width="140%" height="150%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={5} result="edge" />
          <feDisplacementMap in="SourceGraphic" in2="edge" scale={2.5} result="cut" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={2} result="fib" />
          <feColorMatrix in="fib" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.28  0 0 0 -1.2 0.5" result="fibA" />
          <feComposite in="fibA" in2="cut" operator="in" result="fibIn" />
          <feGaussianBlur in="cut" stdDeviation={blur} result="b" />
          <feOffset in="b" dy={dy} result="o" />
          <feFlood floodColor="#5a3f2c" floodOpacity={a} />
          <feComposite in2="o" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="cut" />
            <feMergeNode in="fibIn" />
          </feMerge>
        </filter>
      ))}
    </defs>
  </svg>
);

/** A piece of paper at depth 1–3 */
export const Cut: React.FC<{ depth?: 1 | 2 | 3; children: React.ReactNode; opacity?: number }> = ({
  depth = 2,
  children,
  opacity,
}) => (
  <g filter={`url(#paper${depth})`} opacity={opacity}>
    {children}
  </g>
);

/** A cloud-like cut edge: circles along a baseline, filled flat underneath */
export const puff = (x: number, y: number, w: number, h: number, n = 5, seed = 0) => {
  const r = w / (n * 1.6);
  let d = `M ${x} ${y}`;
  for (let i = 0; i < n; i++) {
    const cx = x + (i + 0.5) * (w / n);
    const ry = r * (0.9 + 0.5 * Math.abs(Math.sin(i * 2.1 + seed)));
    d += ` L ${cx - r} ${y} A ${r} ${ry * 1.3} 0 0 1 ${cx + r} ${y}`;
  }
  d += ` L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  return d;
};

/** A scalloped blob: a ring of bumps around (cx, cy) */
export const scallop = (cx: number, cy: number, rx: number, ry: number, bumps = 9, depth = 0.22, seed = 0) => {
  const pts: string[] = [];
  const N = bumps * 12;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const k = 1 + depth * Math.abs(Math.sin((a * bumps) / 2 + seed)) - depth * 0.5;
    pts.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`);
  }
  return `M ${pts.join(' L ')} Z`;
};

/** Rounded rectangle path */
export const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;

/** Running stitches along a path: little white dashes, like felt sewn on */
export const Stitches: React.FC<{ d: string; color?: string; width?: number }> = ({ d, color = '#fffaf2', width = 3 }) => (
  <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray="10 9" strokeLinecap="round" opacity={0.85} />
);

/** A cloud: overlapping rounds over a flat-ish base */
export const cloud = (x: number, y: number, w: number) => {
  const h = w * 0.32;
  const r1 = h * 0.62;
  const r2 = h * 0.85;
  const r3 = h * 0.55;
  return [
    `M ${x + h * 0.5} ${y + h}`,
    `A ${h * 0.5} ${h * 0.5} 0 0 1 ${x + h * 0.4} ${y + h * 0.2}`,
    `A ${r1} ${r1} 0 0 1 ${x + w * 0.38} ${y - h * 0.05}`,
    `A ${r2} ${r2} 0 0 1 ${x + w * 0.74} ${y + h * 0.05}`,
    `A ${r3} ${r3} 0 0 1 ${x + w - h * 0.35} ${y + h * 0.45}`,
    `A ${h * 0.28} ${h * 0.28} 0 0 1 ${x + w - h * 0.45} ${y + h}`,
    'Z',
  ].join(' ');
};
