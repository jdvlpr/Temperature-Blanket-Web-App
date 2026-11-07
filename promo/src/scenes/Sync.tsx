import React from 'react';
import { AbsoluteFill, Easing, useCurrentFrame } from 'remotion';
import { getLength, getPointAtLength } from '@remotion/paths';
import hero from '../data/hero.json';
import photo from '../data/photo.json';
import { COLOR, FONT } from '../brand';
import { Backdrop } from '../components/Backdrop';
import { Blanket } from '../components/Blanket';
import { DeviceFrame } from '../components/DeviceFrame';
import { KineticCaption } from '../components/KineticCaption';
import { AppChrome } from '../components/MockUI';
import { pop, tween } from '../components/anim';
import { Cue, steadyCue } from '../timing';

const rows = hero.days.map((d) => d.color);
const colors = hero.palette.map((c) => c.hex);
const N = rows.length;
const recolorTo = { colors: photo.palette.map((c) => c.hex), rows: photo.rows };
// From the laptop's screen to the phone's, dipping under the caption-free middle
const THREAD = 'M 1010 560 C 1180 900, 1300 880, 1440 560';
const LEN = getLength(THREAD);

/** Beat 4: accounts & sync. An edit on the laptop arrives on the phone. */
export const Sync: React.FC<{ cue?: Cue }> = ({ cue = steadyCue }) => {
  const f = useCurrentFrame();
  const inL = pop(f, 0, 18, 110);
  const inP = pop(f, 4, 18, 110);
  const thread = tween(f, cue(0.5), cue(1.5));
  const waveL = (i: number) =>
    tween(f, cue(1.5) + (i / N) * 16, cue(1.5) + 8 + (i / N) * 16);
  const travel = tween(f, cue(2.4), cue(3.4), Easing.inOut(Easing.quad));
  const waveP = (i: number) =>
    tween(f, cue(3.4) + (i / N) * 14, cue(3.4) + 8 + (i / N) * 14);
  const synced = pop(f, cue(4.4), 13, 150);
  const dot = getPointAtLength(THREAD, travel * LEN) ?? { x: 0, y: 0 };

  return (
    <AbsoluteFill>
      <Backdrop glow="rgba(242,164,58,0.14)" glowAt="50% 80%" />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 70,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <KineticCaption
          start={cue(0)}
          size={84}
          align="center"
          lines={[{ text: 'Your projects, on every device.', italic: false }]}
        />
      </div>

      <AbsoluteFill style={{ perspective: 2200 }}>
        <DeviceFrame
          kind="laptop"
          w={860}
          h={540}
          style={{
            left: 150,
            top: 300,
            opacity: inL,
            transform: `translateX(${(1 - inL) * -200}px) rotateY(14deg) rotateX(4deg)`,
          }}
        >
          <AppChrome>
            <div style={{ padding: 30 }}>
              <Blanket
                rows={rows}
                colors={colors}
                recolor={{ ...recolorTo, t: waveL }}
                width={800}
                height={420}
                orientation="columns"
              />
            </div>
          </AppChrome>
        </DeviceFrame>
        <DeviceFrame
          kind="phone"
          w={330}
          h={700}
          style={{
            left: 1440,
            top: 220,
            opacity: inP,
            transform: `translateX(${(1 - inP) * 200}px) rotateY(-16deg) rotateZ(2deg)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              top: 44,
              background: '#fff',
            }}
          >
            <AppChrome title="My Library">
              <div style={{ padding: 22 }}>
                <Blanket
                  rows={rows}
                  colors={colors}
                  recolor={{ ...recolorTo, t: waveP }}
                  width={286}
                  height={480}
                  orientation="rows"
                  stitchAspect={0.7}
                />
                <div
                  style={{
                    fontFamily: FONT.display,
                    fontWeight: 600,
                    fontSize: 22,
                    marginTop: 12,
                  }}
                >
                  My Town 2025
                </div>
              </div>
            </AppChrome>
          </div>
        </DeviceFrame>
      </AbsoluteFill>

      {/* The thread between them, and the change travelling along it */}
      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <filter id="sync-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        {[
          { w: 16, o: 0.5, glow: true },
          { w: 5, o: 1, glow: false },
        ].map((s, k) => (
          <path
            key={k}
            d={THREAD}
            fill="none"
            stroke={COLOR.amber}
            strokeWidth={s.w}
            strokeLinecap="round"
            opacity={s.o}
            filter={s.glow ? 'url(#sync-glow)' : undefined}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - thread}
          />
        ))}
        {travel > 0 && travel < 1 && (
          <>
            <circle
              cx={dot.x}
              cy={dot.y}
              r={30}
              fill={COLOR.amberSoft}
              opacity={0.5}
              filter="url(#sync-glow)"
            />
            <circle cx={dot.x} cy={dot.y} r={13} fill={COLOR.cream} />
          </>
        )}
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 1475,
          top: 960,
          padding: '12px 26px',
          borderRadius: 99,
          background: COLOR.cream,
          color: COLOR.ink,
          fontFamily: FONT.body,
          fontWeight: 600,
          fontSize: 28,
          boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
          opacity: synced,
          transform: `scale(${0.8 + synced * 0.2})`,
        }}
      >
        ✓ Synced
      </div>
    </AbsoluteFill>
  );
};
