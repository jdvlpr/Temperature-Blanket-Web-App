import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import hero from '../data/hero.json';
import wall from '../data/wall.json';
import { COLOR, FONT } from '../brand';
import { Backdrop } from '../components/Backdrop';
import { Blanket } from '../components/Blanket';
import { Eyebrow, KineticCaption } from '../components/KineticCaption';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const CARD_W = 250;
const CARD_H = 330;
const COLS = 9;
const ROWS = 4;
const GAP = 34;

// Real 2025 weather for each city, in schemes the app offers; never real users' pages
const cards = Array.from({ length: COLS * ROWS }, (_, k) => {
  const c = wall[(k * 5) % wall.length];
  const flip = Math.floor(k / wall.length) % 2 === 1;
  return { ...c, colors: flip ? [...c.colors].reverse() : c.colors };
});

const Star: React.FC<{ size: number; fill: number }> = ({ size, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.1l-5.7 3.2 1.2-6.4-4.7-4.4 6.4-.8z"
      fill={fill > 0 ? COLOR.amber : 'none'}
      fillOpacity={fill}
      stroke={fill > 0.5 ? COLOR.amber : COLOR.cream}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </svg>
);

const Card: React.FC<{ c: (typeof cards)[number] }> = ({ c }) => (
  <div
    style={{
      width: CARD_W,
      height: CARD_H,
      borderRadius: 18,
      background: '#1a2440',
      boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    <Blanket
      rows={c.rows}
      colors={c.colors}
      width={CARD_W}
      height={CARD_H - 70}
      orientation="rows"
      radius={0}
      stitchAspect={0.7}
      texture={0.8}
    />
    <div
      style={{
        height: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        fontFamily: FONT.body,
      }}
    >
      <div>
        <div style={{ color: COLOR.cream, fontSize: 21, fontWeight: 600 }}>
          {c.short}
        </div>
        <div style={{ color: COLOR.creamDim, fontSize: 15 }}>2025</div>
      </div>
      <Star size={24} fill={0} />
    </div>
  </div>
);

export const GalleryWall: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drift = interpolate(f, [0, 150], [0, -520]);
  const wallIn = interpolate(f, [0, 20], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // Your page lifts off the wall, is starred, and is updated in place
  const lift = spring({
    frame: f - 18,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const CLICK = 64;
  const cur = interpolate(f, [36, CLICK - 4], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const press = interpolate(
    f,
    [CLICK - 4, CLICK, CLICK + 6],
    [1, 0.82, 1],
    clamp,
  );
  const starred = spring({
    frame: f - CLICK,
    fps,
    config: { damping: 9, stiffness: 200 },
  });
  const burst = interpolate(f, [CLICK, CLICK + 22], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const note = interpolate(f, [CLICK + 6, CLICK + 20], [0, 1], clamp);
  const pill = spring({
    frame: f - (CLICK + 22),
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const HERO = { x: 1150, y: 170, w: 470, h: 640 };
  const star = { x: HERO.x + HERO.w - 58, y: HERO.y + HERO.h - 60 };

  return (
    <AbsoluteFill>
      <Backdrop glow="rgba(242,164,58,0.12)" glowAt="70% 40%" />

      {/* The wall, tilted back and drifting */}
      <AbsoluteFill style={{ perspective: 1600, opacity: wallIn }}>
        <div
          style={{
            position: 'absolute',
            left: 260,
            top: -140,
            transformOrigin: '50% 50%',
            transform: `rotateX(32deg) rotateZ(-12deg) translateX(${drift}px)`,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, ${CARD_W}px)`,
              gap: GAP,
            }}
          >
            {cards.map((c, k) => (
              <div
                key={k}
                style={{
                  transform: `translateY(${(k % COLS) % 2 ? 60 : 0}px)`,
                }}
              >
                <Card c={c} />
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
      {/* Keep the caption's side quiet */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg, rgba(12,19,34,0.96) 0%, rgba(12,19,34,0.86) 34%, rgba(12,19,34,0.25) 62%, rgba(12,19,34,0.45) 100%)',
        }}
      />

      <div style={{ position: 'absolute', left: 120, top: 300 }}>
        <Eyebrow start={6}>Gallery pages & Stars</Eyebrow>
        <div style={{ height: 18 }} />
        <KineticCaption
          start={12}
          size={96}
          lines={[
            { text: 'Share it.' },
            {
              text: 'Update it anytime.',
              italic: true,
              color: COLOR.amberSoft,
            },
          ]}
        />
        <div style={{ height: 44 }} />
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 38,
            color: COLOR.creamDim,
            maxWidth: 760,
            lineHeight: 1.4,
          }}
        >
          <div style={{ opacity: note }}>Star the ones you love.</div>
          <div style={{ opacity: pill }}>Update your page in place.</div>
        </div>
      </div>

      {/* The project's page, lifted off the wall */}
      <div
        style={{
          position: 'absolute',
          left: HERO.x,
          top: HERO.y,
          width: HERO.w,
          height: HERO.h,
          perspective: 1400,
        }}
      >
        <div
          style={{
            width: HERO.w,
            height: HERO.h,
            borderRadius: 26,
            overflow: 'hidden',
            background: '#1d2846',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `0 ${50 * lift}px ${110 * lift}px rgba(0,0,0,${0.6 * lift})`,
            opacity: lift,
            transform: `translateZ(${(1 - lift) * -600}px) rotateY(${(1 - lift) * -30}deg) rotateZ(${(1 - lift) * -12}deg)`,
          }}
        >
          <Blanket
            rows={hero.days.map((d) => d.color)}
            colors={hero.palette.map((c) => c.hex)}
            width={HERO.w}
            height={HERO.h - 120}
            orientation="rows"
            radius={0}
            stitchAspect={0.7}
            wobble={6}
          />
          <div
            style={{
              height: 120,
              padding: '0 30px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: FONT.display,
                  color: COLOR.cream,
                  fontSize: 36,
                  fontWeight: 600,
                }}
              >
                Minneapolis 2025
              </div>
              <div
                style={{
                  fontFamily: FONT.body,
                  color: COLOR.creamDim,
                  fontSize: 21,
                  marginTop: 4,
                }}
              >
                Stylecraft Special DK · 10 colors
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The star, its burst, and the cursor */}
      <div
        style={{
          position: 'absolute',
          left: star.x - 30,
          top: star.y - 30,
          width: 60,
          height: 60,
          borderRadius: 99,
          background: `rgba(255,255,255,${0.08 + starred * 0.06})`,
          display: 'grid',
          placeItems: 'center',
          opacity: lift,
          transform: `scale(${press * (1 + Math.sin(starred * Math.PI) * 0.25)})`,
        }}
      >
        <Star size={34} fill={starred} />
      </div>
      {burst > 0 &&
        burst < 1 &&
        Array.from({ length: 16 }, (_, k) => {
          const a = (k / 16) * Math.PI * 2;
          const r = 30 + burst * (80 + (k % 3) * 26);
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: star.x + Math.cos(a) * r - 7,
                top: star.y + Math.sin(a) * r - 7,
                width: 14,
                height: 14,
                borderRadius: 99,
                background: k % 2 ? COLOR.amber : COLOR.cream,
                opacity: 1 - burst,
                transform: `scale(${1 - burst * 0.6})`,
              }}
            />
          );
        })}
      <svg
        width={40}
        height={48}
        viewBox="0 0 20 24"
        style={{
          position: 'absolute',
          left: interpolate(cur, [0, 1], [1700, star.x - 4]),
          top: interpolate(cur, [0, 1], [1000, star.y - 2]),
          opacity: interpolate(f, [34, 40, 100, 110], [0, 1, 1, 0], clamp),
          transform: `scale(${press})`,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
        }}
      >
        <path
          d="M2 1 L2 19 L7 14.5 L10.5 22 L13.5 20.6 L10 13.2 L16.5 13 Z"
          fill="white"
          stroke="#111"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
      </svg>

      {/* Same page, same link */}
      <div
        style={{
          position: 'absolute',
          left: HERO.x + 30,
          top: HERO.y - 36,
          padding: '12px 24px',
          borderRadius: 99,
          background: COLOR.cream,
          color: COLOR.ink,
          fontFamily: FONT.body,
          fontWeight: 600,
          fontSize: 27,
          boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
          opacity: pill,
          transform: `translateY(${(1 - pill) * 20}px) scale(${0.9 + pill * 0.1})`,
        }}
      >
        ✓ Gallery page updated · same link
      </div>
    </AbsoluteFill>
  );
};
