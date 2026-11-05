import React from 'react';
import { AbsoluteFill, Easing, useCurrentFrame } from 'remotion';
import hero from '../data/hero.json';
import { COLOR, FONT } from '../brand';
import { Backdrop } from '../components/Backdrop';
import { Blanket } from '../components/Blanket';
import { KineticCaption } from '../components/KineticCaption';
import { LogoMark } from '../components/LogoMark';
import { pop, tween } from '../components/anim';
import { Cue, steadyCue } from '../timing';

const rows = hero.days.map((d) => d.color);
const colors = hero.palette.map((c) => c.hex);
const PW = 330;
const PH = 427; // US Letter

const Line: React.FC<{ w: number | string; h?: number; c?: string }> = ({
  w,
  h = 7,
  c = '#d9d3c7',
}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 4,
      background: c,
      marginTop: 9,
    }}
  />
);

const pages: React.ReactNode[] = [
  // Cover
  <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <LogoMark size={22} />
      <div style={{ fontSize: 11, color: '#6b7183' }}>
        temperature-blanket.com
      </div>
    </div>
    <div
      style={{
        fontFamily: FONT.display,
        fontWeight: 600,
        fontSize: 30,
        marginTop: 14,
      }}
    >
      Minneapolis 2025
    </div>
    <div style={{ fontSize: 13, color: '#6b7183' }}>
      Daily highs · Stylecraft Special DK
    </div>
    <div style={{ marginTop: 14 }}>
      <Blanket
        rows={rows}
        colors={colors}
        width={PW - 52}
        height={250}
        orientation="rows"
        stitchAspect={0.6}
        texture={0.6}
        radius={4}
      />
    </div>
  </>,
  // Color key
  <>
    <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 24 }}>
      Color key
    </div>
    {hero.palette.map((c, i) => (
      <div
        key={i}
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 9 }}
      >
        <div
          style={{ width: 22, height: 22, borderRadius: 99, background: c.hex }}
        />
        <div style={{ fontSize: 14, flex: 1 }}>{c.name}</div>
        <div style={{ fontSize: 13, color: '#6b7183' }}>
          {hero.ranges[i].to}–{hero.ranges[i].from}°
        </div>
      </div>
    ))}
  </>,
  // Row by row
  <>
    <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 24 }}>
      Row by row
    </div>
    {hero.days.slice(0, 13).map((d, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: 7,
          fontSize: 13,
        }}
      >
        <div style={{ width: 30, color: '#6b7183' }}>{i + 1}</div>
        <div style={{ width: 54 }}>Jan {i + 1}</div>
        <div style={{ width: 40 }}>{Math.round(d.tmax)}°</div>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 99,
            background: colors[d.color],
          }}
        />
        <div style={{ color: '#6b7183' }}>
          {hero.palette[d.color].name.split(' ')[0]}
        </div>
      </div>
    ))}
  </>,
  // Notes
  <>
    <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 24 }}>
      Notes
    </div>
    {Array.from({ length: 14 }, (_, i) => (
      <Line key={i} w={`${70 + ((i * 37) % 30)}%`} />
    ))}
  </>,
];

/** Beat 7: the PDF. Pages fan out of the blanket like a hand of cards, then fold back. */
export const Pdf: React.FC<{ cue?: Cue }> = ({ cue = steadyCue }) => {
  const f = useCurrentFrame();
  const fan = Math.min(
    pop(f, cue(0.5), 13, 120),
    1 - tween(f, cue(4.4), cue(5.4), Easing.inOut(Easing.cubic)),
  );
  const blanketIn = pop(f, 0, 16, 120);
  const n = pages.length;

  return (
    <AbsoluteFill>
      <Backdrop glow="rgba(242,164,58,0.16)" glowAt="50% 40%" />
      <div style={{ position: 'absolute', left: 960 - PW / 2, top: 170 }}>
        {pages.map((pg, k) => {
          const a = (k - (n - 1) / 2) * 17 * fan;
          const dx = (k - (n - 1) / 2) * 190 * fan;
          const dy = -Math.abs(k - (n - 1) / 2) * -30 * fan - 30 * fan;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: PW,
                height: PH,
                padding: 26,
                boxSizing: 'border-box',
                background: '#fdfbf6',
                borderRadius: 8,
                fontFamily: FONT.body,
                color: '#1d2333',
                overflow: 'hidden',
                boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
                transformOrigin: '50% 120%',
                // Folded, they sit inside the blanket (drawn over them)
                transform: `translate(${dx}px, ${dy + (1 - fan) * 300}px) scale(${0.55 + 0.45 * fan}) rotate(${a}deg)`,
                opacity: Math.min(1, fan * 4),
              }}
            >
              {pg}
            </div>
          );
        })}
      </div>
      {/* The blanket the pages come from */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 150,
          top: 520,
          opacity: blanketIn,
          transform: `translateY(${(1 - blanketIn) * 60}px) scale(${1 - fan * 0.08})`,
          filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.6))',
        }}
      >
        <Blanket
          rows={rows}
          colors={colors}
          width={300}
          height={300}
          orientation="rows"
          stitchAspect={0.7}
          radius={10}
          wobble={6}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 860,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <KineticCaption
          start={cue(0.5)}
          size={84}
          align="center"
          lines={[
            {
              text: 'A redesigned PDF printout.',
              italic: true,
              color: COLOR.amberSoft,
            },
          ]}
        />
      </div>
    </AbsoluteFill>
  );
};
