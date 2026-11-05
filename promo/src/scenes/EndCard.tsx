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
import { COLOR, FONT } from '../brand';
import { Backdrop } from '../components/Backdrop';
import { Blanket } from '../components/Blanket';
import { LogoMark } from '../components/LogoMark';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const rows = hero.days.map((d) => d.color);
const colors = hero.palette.map((c) => c.hex);
const URL_TEXT = 'next.temperature-blanket.com';

const MARK = 200;
const MARK_X = 960 - MARK / 2;
const MARK_Y = 150;

export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The year's blanket squeezes down into the logo's four stripes
  const squeeze = interpolate(f, [10, 44], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const toMark = interpolate(f, [40, 54], [0, 1], clamp);
  const markPop = spring({
    frame: f - 44,
    fps,
    config: { damping: 11, stiffness: 160 },
  });
  const BW = interpolate(squeeze, [0, 1], [1680, MARK]);
  const BH = interpolate(squeeze, [0, 1], [360, MARK]);
  const BX = 960 - BW / 2;
  const BY = interpolate(squeeze, [0, 1], [360, MARK_Y]);

  const title = spring({
    frame: f - 52,
    fps,
    config: { damping: 18, stiffness: 110 },
  });
  const pill = spring({
    frame: f - 62,
    fps,
    config: { damping: 13, stiffness: 150 },
  });
  const urlBox = spring({
    frame: f - 74,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const typed = Math.floor(
    interpolate(f, [80, 108], [0, URL_TEXT.length], clamp),
  );
  const caret = Math.floor(f / 8) % 2 === 0 && typed < URL_TEXT.length + 1;
  const tag = interpolate(f, [112, 126], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const horizon = interpolate(f, [40, 90], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <Backdrop glow="rgba(242,164,58,0.18)" glowAt="50% 30%" />
      {/* The year as a glowing horizon */}
      <div
        style={{
          position: 'absolute',
          left: -100,
          bottom: -160,
          opacity: 0.55 * horizon,
          filter: 'blur(50px) saturate(1.2)',
        }}
      >
        <Blanket
          rows={rows}
          colors={colors}
          width={2120}
          height={420}
          orientation="columns"
          texture={0}
          radius={0}
        />
      </div>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(12,19,34,0) 55%, rgba(12,19,34,0.35) 100%)',
        }}
      />

      {toMark < 1 && (
        <div
          style={{
            position: 'absolute',
            left: BX,
            top: BY,
            opacity: 1 - toMark,
            filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.5))',
          }}
        >
          <Blanket
            rows={rows}
            colors={colors}
            width={BW}
            height={BH}
            orientation="columns"
            radius={interpolate(squeeze, [0, 1], [10, 6])}
          />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          left: MARK_X,
          top: MARK_Y,
          opacity: toMark,
          transform: `scale(${0.85 + markPop * 0.15})`,
        }}
      >
        <LogoMark size={MARK} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 400,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 112,
            color: COLOR.cream,
            letterSpacing: '-0.02em',
            opacity: title,
            transform: `translateY(${(1 - title) * 40}px)`,
          }}
        >
          Temperature Blanket
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 18,
            padding: '10px 26px',
            borderRadius: 99,
            background: COLOR.amber,
            color: COLOR.ink,
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: pill,
            transform: `scale(${0.6 + pill * 0.4})`,
          }}
        >
          Version 7 · Beta
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 690,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            padding: '24px 40px',
            borderRadius: 26,
            background: 'rgba(247,241,230,0.08)',
            border: '1.5px solid rgba(247,241,230,0.22)',
            backdropFilter: 'blur(10px)',
            opacity: urlBox,
            transform: `translateY(${(1 - urlBox) * 30}px)`,
            boxShadow: '0 30px 70px rgba(0,0,0,0.4)',
          }}
        >
          <span
            style={{
              fontFamily: FONT.body,
              fontSize: 38,
              color: COLOR.creamDim,
              fontWeight: 500,
            }}
          >
            Try it at
          </span>
          <span
            style={{
              fontFamily: FONT.body,
              fontSize: 66,
              color: COLOR.cream,
              fontWeight: 700,
              minWidth: 1000,
            }}
          >
            {URL_TEXT.slice(0, typed)}
            <span style={{ opacity: caret ? 1 : 0, color: COLOR.amber }}>
              |
            </span>
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 870,
          textAlign: 'center',
          fontFamily: FONT.display,
          fontStyle: 'italic',
          fontSize: 44,
          color: COLOR.amberSoft,
          opacity: tag,
          transform: `translateY(${(1 - tag) * 16}px)`,
        }}
      >
        and share your feedback.
      </div>
    </AbsoluteFill>
  );
};
