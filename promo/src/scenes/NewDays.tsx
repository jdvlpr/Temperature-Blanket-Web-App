import React from 'react';
import { AbsoluteFill, Easing, Sequence, useCurrentFrame } from 'remotion';
import hero from '../data/hero.json';
import { COLOR, FONT } from '../brand';
import { Backdrop } from '../components/Backdrop';
import { Blanket } from '../components/Blanket';
import { FootageSlot } from '../components/FootageSlot';
import { Eyebrow, KineticCaption } from '../components/KineticCaption';
import { Button, UI } from '../components/MockUI';
import { lerp, pop, tween } from '../components/anim';
import { Cue, steadyCue } from '../timing';

const rows = hero.days.map((d) => d.color);
const colors = hero.palette.map((c) => c.hex);
const N = rows.length;
// Saved through Oct 31; November's 30 days are waiting
const SAVED = hero.days.findIndex((d) => d.date === '2025-11-01');
const NEW = 30;
const BL = { x: 1270, y: 70, w: 500, h: 940 };

/** Beat 3: the weather kept up to date (real dialog later: update-weather.mp4) */
export const NewDays: React.FC<{ cue?: Cue }> = ({ cue = steadyCue }) => {
  const f = useCurrentFrame();
  const dlgIn = pop(f, cue(0.5), 16, 120);
  const SAVE = cue(2);
  const press =
    1 - 0.1 * Math.sin(Math.PI * tween(f, SAVE - 3, SAVE + 3, (t) => t));
  const dlgOut = tween(f, SAVE + 3, SAVE + 16, Easing.in(Easing.cubic));
  // The new rows knit on, one after another, with a little bounce
  const knit = (i: number) => {
    if (i < SAVED) return 1;
    if (i >= SAVED + NEW) return 0;
    const k = i - SAVED;
    const a = SAVE + 4 + k * ((cue(5) - SAVE - 10) / NEW);
    return tween(f, a, a + 8, Easing.out(Easing.back(2)));
  };
  const added = Math.min(
    NEW,
    Math.max(
      0,
      Array.from({ length: NEW }, (_, k) => knit(SAVED + k)).filter(
        (g) => g > 0.5,
      ).length,
    ),
  );
  const toast = pop(f, cue(5), 15, 130);
  const calIn = pop(f, cue(0), 16, 120);

  return (
    <AbsoluteFill>
      <Backdrop glow="rgba(59,123,163,0.22)" glowAt="75% 30%" />
      <div style={{ position: 'absolute', left: 120, top: 150 }}>
        <Eyebrow start={cue(0) - 4}>Check for Updates</Eyebrow>
        <div style={{ height: 18 }} />
        <KineticCaption
          start={cue(0)}
          size={88}
          lines={[
            { text: 'Add new days' },
            {
              text: 'as your year goes on.',
              italic: true,
              color: COLOR.amberSoft,
            },
          ]}
        />
      </div>

      {/* The calendar ticks through November as the days come in */}
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 560,
          width: 250,
          borderRadius: 26,
          overflow: 'hidden',
          background: COLOR.cream,
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          fontFamily: FONT.body,
          textAlign: 'center',
          opacity: calIn,
          transform: `translateY(${(1 - calIn) * 40}px) rotate(-4deg)`,
        }}
      >
        <div
          style={{
            background: '#c82d23',
            color: '#fff',
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: '0.14em',
            padding: '10px 0',
          }}
        >
          {added > 0 ? 'NOV' : 'OCT'}
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: 130,
            color: COLOR.ink,
            lineHeight: 1.25,
          }}
        >
          {added > 0 ? added : 31}
        </div>
      </div>

      {/* The blanket: the saved days, then the new rows knitting on */}
      <div
        style={{
          position: 'absolute',
          left: BL.x,
          top: BL.y,
          perspective: 1600,
        }}
      >
        <div
          style={{
            transform: 'rotateY(-12deg) rotateZ(1.5deg)',
            filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.55))',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: (SAVED / N) * BL.h,
              width: BL.w,
              height: BL.h - (SAVED / N) * BL.h,
              borderRadius: '0 0 12px 12px',
              border: '3px dashed rgba(247,241,230,0.25)',
              borderTop: 'none',
            }}
          />
          <Blanket
            rows={rows}
            colors={colors}
            width={BL.w}
            height={BL.h}
            orientation="rows"
            grow={knit}
            stitchAspect={0.75}
            radius={12}
            wobble={8}
          />
        </div>
      </div>

      {/* Update Weather Data, sliding in at an angle */}
      <div
        style={{ position: 'absolute', left: 540, top: 380, perspective: 1600 }}
      >
        <div
          style={{
            width: 640,
            height: 400,
            borderRadius: 22,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 50px 100px rgba(0,0,0,0.55)',
            opacity: dlgIn * (1 - dlgOut),
            transform: `translateX(${(1 - dlgIn) * 300}px) translateZ(${-dlgOut * 300}px) rotateY(${lerp(-28, -14, dlgIn)}deg) rotateZ(-3deg)`,
          }}
        >
          <Sequence from={cue(0.5)} layout="none">
            <FootageSlot name="update-weather.mp4">
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: UI.card,
                  fontFamily: FONT.body,
                  color: UI.text,
                  padding: '30px 34px',
                }}
              >
                <div style={{ fontSize: 30, fontWeight: 700 }}>
                  Update Weather Data
                </div>
                <div
                  style={{
                    marginTop: 26,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 18,
                    borderRadius: 14,
                    background: UI.bg,
                  }}
                >
                  <div
                    style={{
                      width: 54,
                      height: 30,
                      borderRadius: 99,
                      background: UI.primary,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        right: 3,
                        top: 3,
                        width: 24,
                        height: 24,
                        borderRadius: 99,
                        background: '#fff',
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>
                      Add {NEW} new days
                    </div>
                    <div style={{ fontSize: 17, color: UI.dim }}>
                      Nov 1 – Nov 30, 2025
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 16, fontSize: 17, color: UI.dim }}>
                  Open-Meteo refined 8 past days. None change color. Review
                  changes
                </div>
                <div
                  style={{
                    position: 'absolute',
                    right: 34,
                    bottom: 30,
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <Button>Cancel</Button>
                  <Button primary press={press}>
                    Add {NEW} Days
                  </Button>
                </div>
              </div>
            </FootageSlot>
          </Sequence>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 440,
          top: 640,
          padding: '14px 28px',
          borderRadius: 99,
          background: COLOR.cream,
          color: COLOR.ink,
          fontFamily: FONT.body,
          fontWeight: 600,
          fontSize: 30,
          boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
          opacity: toast,
          transform: `translateY(${(1 - toast) * 20}px)`,
        }}
      >
        ✓ Added {NEW} days
      </div>
    </AbsoluteFill>
  );
};
