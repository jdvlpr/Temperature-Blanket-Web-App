import React from 'react';
import { Easing, interpolate } from 'remotion';
import { clamp, lerp, pop } from '../../components/anim';
import { Blanket } from '../../components/Blanket';
import { HIGHS, PALETTE, ROWS } from '../palette';
import { FONT, INK, TONE } from '../theme';
import { DAYS, GROUND, LINE, TOTAL, bar, barAt, dayX, headDay, lilt } from '../timing';
import { YarnBall } from './YarnBall';
import { Cut } from './PaperKit';

const lo = Math.min(...HIGHS);
const hi = Math.max(...HIGHS);
/** The temperature line's height at day i (fractional ok) */
export const lineY = (i: number) => {
  const a = Math.max(0, Math.min(DAYS - 1, Math.floor(i)));
  const b = Math.min(DAYS - 1, a + 1);
  const h = lerp(HIGHS[a], HIGHS[b], Math.max(0, Math.min(1, i - a)));
  return LINE.bottom - 10 - ((h - lo) / (hi - lo)) * (LINE.bottom - LINE.top - 20);
};

const BOX_TOP = LINE.top - 20;
const BOX_H = GROUND.bottom - BOX_TOP;

/** The year knit so far: days drop from the line into columns, then settle into a strip */
export const GroundBlanket: React.FC<{ f: number }> = ({ f }) => {
  // Past the last day, keep counting so the final days settle too
  const head = headDay(f) + interpolate(f, [bar(33.25), bar(34.5)], [0, 30], clamp);
  const grow = (i: number) => interpolate(head - i, [0, 2.5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const settle = (i: number) => interpolate(head - i, [3, 26], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const top = (i: number) => lerp(lineY(i + 0.5), GROUND.top, settle(i)) - BOX_TOP;
  return (
    <svg
      style={{ position: 'absolute', left: GROUND.x0, top: BOX_TOP, overflow: 'visible' }}
      width={DAYS * GROUND.dayW}
      height={BOX_H}
    >
      {/* A soft shadow under the knitted strip */}
      <rect x={4} y={BOX_H + 4} width={Math.max(0, head) * GROUND.dayW} height={12} rx={6} fill="#5a3f2c" opacity={0.08} />
      <defs>
        <clipPath id="knit-so-far">
          {ROWS.map((_, i) => {
            const g = grow(i);
            if (g <= 0) return null;
            const h = (BOX_H - top(i)) * g;
            return <rect key={i} x={i * GROUND.dayW} y={BOX_H - h} width={GROUND.dayW + 0.6} height={h} />;
          })}
        </clipPath>
      </defs>
      <g clipPath="url(#knit-so-far)">
      <Blanket
        rows={ROWS}
        colors={PALETTE}
        width={DAYS * GROUND.dayW}
        height={BOX_H}
        orientation="columns"
        grow={grow}
        top={top}
        texture={0.75}
        stitchAspect={0.85}
        radius={8}
      />
      </g>
    </svg>
  );
};

/** The strand: the yarn laid along the temperature line just ahead of the knitting, fading behind */
export const Strand: React.FC<{ f: number }> = ({ f }) => {
  const head = headDay(f);
  const gone = interpolate(f, [bar(33.3), bar(34)], [1, 0], clamp);
  if (head <= 0 || gone <= 0) return null;
  const from = Math.max(0, head - 34);
  const pts: string[] = [];
  for (let i = from; i <= head; i += 0.5) pts.push(`${dayX(i + 0.5).toFixed(1)} ${lineY(i + 0.5).toFixed(1)}`);
  const d = `M ${pts.join(' L ')}`;
  const grad = `strand-${Math.round(from)}`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: gone }} width={1} height={1}>
      <defs>
        <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1={dayX(from)} x2={dayX(head)} y1={0} y2={0}>
          <stop offset="0" stopColor={TONE.russet} stopOpacity={0} />
          <stop offset="0.55" stopColor={TONE.russet} stopOpacity={0.9} />
          <stop offset="1" stopColor={TONE.russet} stopOpacity={1} />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#${grad})`} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={7} strokeDasharray="5 9" strokeLinecap="round" />
    </svg>
  );
};

const R0 = 58;
const R1 = 28;
/** Where the merged yarn ball starts, in the October panel */
export const BALL_START = { x: 860, y: GROUND.top - 20 };

/**
 * The story's hero: the year's yarn, wound into one variegated ball. It rolls
 * out of October, rides the line as each day is knit (getting smaller), and
 * comes to rest at the end of the blanket.
 */
export const HeroBall: React.FC<{ f: number }> = ({ f }) => {
  const b = barAt(f);
  const appear = pop(f, bar(7.82), 11, 160);
  if (b < 7.6) return null;
  const head = headDay(f);
  const r = lerp(R0, R1, head / DAYS);
  let x: number;
  let y: number;
  if (b < 9.5) {
    // Rolls from October onto the start of the line
    const t = interpolate(f, [bar(8.1), bar(9.5)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    const ex = dayX(0.5);
    const ey = lineY(0.5) - r;
    x = lerp(BALL_START.x, ex, t);
    y = lerp(BALL_START.y - r, ey, t) - Math.sin(t * Math.PI) * 90;
  } else if (b < 33.4) {
    x = dayX(head + 0.5);
    y = lineY(head + 0.5) - r - 3;
  } else {
    // Off the end of the line and down to rest beside the blanket
    const t = interpolate(f, [bar(33.4), bar(34.2)], [0, 1], { ...clamp, easing: Easing.bounce });
    x = lerp(dayX(DAYS), dayX(DAYS) + 90, Math.min(1, t * 1.4));
    y = lerp(lineY(DAYS - 1) - r, GROUND.bottom - r - 22, t); // resting in the grass
  }
  const hop = b >= 9.5 && b < 33.4 ? lilt(f) * 10 : 0;
  const spin = (x / r) * (180 / Math.PI);
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
      <g transform={`translate(${x} ${y - hop}) scale(${appear}) translate(${-x} ${-(y - hop)})`}>
        <YarnBall x={x} y={y - hop} r={r} colors={PALETTE} spin={spin} />
      </g>
    </svg>
  );
};

const DAYS_IN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TAG_MONTHS = 5; // Jan–May: the tags stay in the winter-to-spring scroll
/** The frame each month's tag pops: when the knitting reaches the month's end */
export const TAG_FRAMES: number[] = (() => {
  const out: number[] = [];
  let day = 0;
  let f = 0;
  for (let m = 0; m < TAG_MONTHS; m++) {
    day += DAYS_IN[m];
    while (f < TOTAL && headDay(f) < day) f++;
    out.push(f);
  }
  return out;
})();

/** "Check for Updates" tags: at each month the new days are added, a paper tag swings in */
export const MonthTags: React.FC<{ f: number }> = ({ f }) => {
  const tags: React.ReactNode[] = [];
  let day = 0;
  for (let m = 0; m < TAG_MONTHS; m++) {
    day += DAYS_IN[m];
    const x = dayX(day);
    const at = TAG_FRAMES[m];
    if (f < at) break;
    const s = pop(f, at, 10, 120);
    const swing = Math.sin((f - at) / 9) * 9 * Math.exp(-(f - at) / 40) + lilt(f) * 2;
    const y = 990;
    tags.push(
      <g key={m} transform={`translate(${x} ${y}) rotate(${swing}) scale(${s})`} opacity={Math.min(1, s * 1.5)}>
        <path d="M 0 -150 C 6 -110 -6 -70 0 -30" stroke="#b08a66" strokeWidth={2.5} fill="none" />
        <Cut depth={2}>
          <path d="M -60 -40 L 60 -40 L 86 -14 L 86 62 Q 86 70 78 70 L -78 70 Q -86 70 -86 62 L -86 -14 Z" fill={TONE.white} />
        </Cut>
        <circle cx={0} cy={-22} r={7} fill="#e9dcc6" />
        <circle cx={0} cy={-30} r={4} fill="#b08a66" />
        <text y={20} textAnchor="middle" fontFamily={FONT.body} fontWeight={600} fontSize={26} fill={INK}>
          +{DAYS_IN[m]} days
        </text>
        <text y={52} textAnchor="middle" fontFamily={FONT.display} fontStyle="italic" fontSize={24} fill={TONE.russet}>
          {MONTHS[m]}
        </text>
      </g>,
    );
  }
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
      {tags}
    </svg>
  );
};
