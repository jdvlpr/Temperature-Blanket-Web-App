import React from 'react';
import { AbsoluteFill, Easing, useCurrentFrame } from 'remotion';
import { getLength, getPointAtLength } from '@remotion/paths';
import hero from '../data/hero.json';
import { COLOR, FONT } from '../brand';
import { Backdrop } from '../components/Backdrop';
import { Blanket } from '../components/Blanket';
import { FootageSlot } from '../components/FootageSlot';
import { KineticCaption } from '../components/KineticCaption';
import { RavelryLumpy } from '../components/MockUI';
import { lerp, pop, tween } from '../components/anim';
import { Cue, steadyCue } from '../timing';

const rows = hero.days.map((d) => d.color);
const colors = hero.palette.map((c) => c.hex);
const CARD = { x: 150, y: 420, w: 300, h: 420 };
const WIN = { x: 860, y: 150, w: 940, h: 780 };
// A loose strand of yarn from the card into the window
const YARN = 'M 450 600 C 600 380, 640 880, 780 700 S 900 420, 1080 470';
const LEN = getLength(YARN);

/**
 * Beat 6: Post to Ravelry. The window is a slot for the real flow, recorded
 * with the owner (ravelry.mp4). No Ravelry UI is mocked up here.
 */
export const Ravelry: React.FC<{ cue?: Cue }> = ({ cue = steadyCue }) => {
  const f = useCurrentFrame();
  const cardIn = pop(f, 0, 16, 120);
  const draw = tween(f, cue(0.5), cue(1.8));
  const ride = tween(f, cue(1.8), cue(3.2), Easing.inOut(Easing.cubic));
  const winIn = tween(f, cue(0.3), cue(1.3), Easing.out(Easing.cubic));
  const posted = pop(f, cue(3.4), 14, 140);
  const p = getPointAtLength(YARN, ride * LEN) ?? { x: 0, y: 0 };
  const s = lerp(1, 0.35, ride);

  return (
    <AbsoluteFill>
      <Backdrop glow="rgba(242,164,58,0.12)" glowAt="30% 70%" />
      <div style={{ position: 'absolute', left: 120, top: 110 }}>
        <KineticCaption
          start={cue(0)}
          size={80}
          lines={[
            { text: 'Post to Ravelry' },
            { text: 'in one step.', italic: true, color: COLOR.amberSoft },
          ]}
        />
      </div>

      {/* The window the real footage plays in (slides in; the mark is never faded) */}
      <div
        style={{
          position: 'absolute',
          left: WIN.x,
          top: WIN.y,
          width: WIN.w,
          height: WIN.h,
          borderRadius: 20,
          overflow: 'hidden',
          background: '#1a2238',
          boxShadow:
            '0 60px 120px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.08)',
          transform: `translateX(${(1 - winIn) * 1100}px) perspective(1800px) rotateY(-10deg)`,
        }}
      >
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 16px',
            background: '#10172a',
          }}
        >
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div
              key={c}
              style={{ width: 13, height: 13, borderRadius: 99, background: c }}
            />
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 44,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <FootageSlot name="ravelry.mp4">
            <div
              style={{
                position: 'absolute',
                inset: 30,
                borderRadius: 14,
                border: '3px dashed rgba(247,241,230,0.25)',
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                fontFamily: FONT.body,
                color: COLOR.creamDim,
                fontSize: 30,
                lineHeight: 1.4,
              }}
            >
              <div>
                Real footage, recorded with you:
                <br />
                Publish · Also post to Ravelry · View on Ravelry
              </div>
            </div>
          </FootageSlot>
        </div>
      </div>

      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', inset: 0 }}
      >
        <path
          d={YARN}
          fill="none"
          stroke={COLOR.amber}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${LEN * draw} ${LEN}`}
        />
        <path
          d={YARN}
          fill="none"
          stroke={COLOR.amberSoft}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="6 10"
          opacity={draw}
        />
      </svg>

      {/* The project card, riding the yarn into Ravelry */}
      <div
        style={{
          position: 'absolute',
          left: ride > 0 ? p.x - (CARD.w / 2) * s : CARD.x,
          top: ride > 0 ? p.y - (CARD.h / 2) * s : CARD.y,
          width: CARD.w,
          height: CARD.h,
          transformOrigin: '0 0',
          transform: `scale(${s}) rotate(${Math.sin(ride * Math.PI) * -8}deg)`,
          opacity: cardIn * (1 - tween(f, cue(3.1), cue(3.4))),
          borderRadius: 18,
          overflow: 'hidden',
          background: '#1d2846',
          boxShadow: '0 30px 70px rgba(0,0,0,0.55)',
        }}
      >
        <Blanket
          rows={rows}
          colors={colors}
          width={CARD.w}
          height={CARD.h - 80}
          orientation="rows"
          radius={0}
          stitchAspect={0.7}
        />
        <div
          style={{
            padding: '14px 18px',
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 26,
            color: COLOR.cream,
          }}
        >
          Minneapolis 2025
        </div>
      </div>

      {/* "On Ravelry", as My Library's card says it, with the mark unchanged and clear space around it */}
      <div
        style={{
          position: 'absolute',
          left: WIN.x + 60,
          top: WIN.y + WIN.h + 40,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '14px 28px',
          borderRadius: 99,
          background: 'rgba(247,241,230,0.08)',
          border: '1.5px solid rgba(247,241,230,0.2)',
          transform: `translateY(${(1 - posted) * 140}px)`,
        }}
      >
        <RavelryLumpy size={40} white />
        <span
          style={{
            fontFamily: FONT.body,
            fontWeight: 600,
            fontSize: 30,
            color: COLOR.cream,
          }}
        >
          On Ravelry · 4 photos
        </span>
      </div>
    </AbsoluteFill>
  );
};
