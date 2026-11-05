import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import hero from '../data/hero.json';
import { COLOR } from '../brand';
import { Backdrop } from '../components/Backdrop';
import { Blanket } from '../components/Blanket';
import { Eyebrow, KineticCaption } from '../components/KineticCaption';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// The blanket's box before it tilts
const BX = 160;
const BY = 360;
const BW = 1600;
const BH = 560;
const N = hero.days.length;
const colors = hero.palette.map((c) => c.hex);
const rows = hero.days.map((d) => d.color);
const highs = hero.days.map((d) => d.tmax ?? 0);
const lo = Math.min(...highs);
const hi = Math.max(...highs);
// Line y inside the box: the coldest high near the bottom, the hottest near the top
const lineY = (i: number) =>
  BH * 0.9 - ((highs[i] - lo) / (hi - lo)) * BH * 0.78;
const xAt = (i: number) => (i + 0.5) * (BW / N);
const pathD = highs
  .map((_, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)} ${lineY(i).toFixed(1)}`)
  .join(' ');

export const Hook: React.FC = () => {
  const f = useCurrentFrame();

  const draw = interpolate(f, [6, 52], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const lineFade = interpolate(f, [84, 102], [1, 0], clamp);
  // Each day drops from the line into a column, left to right
  const grow = (i: number) =>
    interpolate(f, [30 + (i / N) * 34, 44 + (i / N) * 34], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.back(1.4)),
    });
  // Then the tops settle level: the chart becomes a blanket
  const settle = (i: number) =>
    interpolate(f, [78 + (i / N) * 14, 100 + (i / N) * 14], [1, 0], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
  const top = (i: number) => lineY(i) * settle(i);
  const texture = interpolate(f, [96, 124], [0, 1], clamp);
  const tilt = interpolate(f, [96, 140], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: 'absolute', left: BX, top: 92 }}>
        <Eyebrow start={4}>Minneapolis · 2025 · a stripe a day</Eyebrow>
        <div style={{ height: 22 }} />
        <KineticCaption
          start={98}
          size={104}
          lines={[
            { text: 'A year of weather.' },
            { text: 'Knit together.', italic: true, color: COLOR.amberSoft },
          ]}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: BX,
          top: BY,
          width: BW,
          height: BH,
          perspective: 1800,
        }}
      >
        <div
          style={{
            width: BW,
            height: BH,
            transformOrigin: '60% 70%',
            transform: `translate(${tilt * 150}px, ${tilt * 70}px) rotateX(${tilt * 22}deg) rotateY(${tilt * -12}deg) rotateZ(${tilt * -4}deg) scale(${1 - tilt * 0.12})`,
            filter: `drop-shadow(0 ${40 * tilt}px ${60 * tilt}px rgba(0,0,0,${0.55 * tilt}))`,
          }}
        >
          <Blanket
            rows={rows}
            colors={colors}
            width={BW}
            height={BH}
            orientation="columns"
            grow={grow}
            top={top}
            texture={texture}
            radius={10 * tilt}
            wobble={tilt * 18}
          />
          <svg
            width={BW}
            height={BH}
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'visible',
              opacity: lineFade,
            }}
          >
            <defs>
              <linearGradient
                id="hook-line"
                gradientUnits="userSpaceOnUse"
                x1={0}
                x2={BW}
                y1={0}
                y2={0}
              >
                {rows.map((c, i) =>
                  i % 3 === 0 ? (
                    <stop key={i} offset={i / N} stopColor={colors[c]} />
                  ) : null,
                )}
              </linearGradient>
            </defs>
            <path
              d={pathD}
              fill="none"
              stroke="url(#hook-line)"
              strokeWidth={5}
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - draw}
            />
            {draw > 0 &&
              draw < 1 &&
              (() => {
                const i = Math.min(N - 1, Math.floor(draw * N));
                return (
                  <circle
                    cx={xAt(i)}
                    cy={lineY(i)}
                    r={11}
                    fill={colors[rows[i]]}
                    stroke={COLOR.cream}
                    strokeWidth={4}
                  />
                );
              })()}
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
