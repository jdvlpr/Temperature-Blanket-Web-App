import React from 'react';
import { AbsoluteFill, Easing, Sequence, useCurrentFrame } from 'remotion';
import hero from '../data/hero.json';
import { COLOR } from '../brand';
import { Backdrop } from '../components/Backdrop';
import { Blanket } from '../components/Blanket';
import { DeviceFrame } from '../components/DeviceFrame';
import { FootageSlot } from '../components/FootageSlot';
import { KineticCaption } from '../components/KineticCaption';
import { AppChrome, Button, Field, LiftCard, UI } from '../components/MockUI';
import { lerp, tween } from '../components/anim';
import { Cue, steadyCue } from '../timing';

const SW = 1100;
const SH = 688;
const rows = hero.days.map((d) => d.color);
const colors = hero.palette.map((c) => c.hex);
const highs = hero.days.map((d) => d.tmax ?? 0);
const LOCATION = 'Minneapolis, Minnesota';

// The four steps, by beat: Location, Weather, Colors, Preview
const AT = [0, 3, 5, 6.5];

/** Beat 1: the Plan it montage, on a laptop (real UI footage later: plan-*.mp4) */
export const PlanIt: React.FC<{ cue?: Cue }> = ({ cue = steadyCue }) => {
  const f = useCurrentFrame();
  const step = Math.max(0, AT.filter((b) => f >= cue(b) - 3).length - 1);
  const stepIn = tween(
    f,
    cue(AT[step]) - 3,
    cue(AT[step]) + 5,
    Easing.out(Easing.cubic),
  );

  // The camera pulls back from the screen into the room
  const pull = tween(f, 0, cue(1.5), Easing.inOut(Easing.cubic));
  const lift = (a: number, b: number) =>
    Math.min(
      tween(f, cue(a), cue(a) + 10, Easing.out(Easing.back(1.6))),
      1 - tween(f, cue(b) - 6, cue(b), Easing.in(Easing.cubic)),
    );

  const typed = Math.floor(
    lerp(
      0,
      LOCATION.length,
      tween(f, cue(0.3), cue(1.8), (t) => t),
    ),
  );
  const press =
    1 - 0.08 * Math.sin(Math.PI * tween(f, cue(2.4), cue(2.4) + 6, (t) => t));

  // Weather chart
  const lo = Math.min(...highs);
  const hi = Math.max(...highs);
  const CW = 980;
  const CH = 380;
  const pts = highs
    .map(
      (v, i) =>
        `${((i / (highs.length - 1)) * CW).toFixed(1)},${(CH - ((v - lo) / (hi - lo)) * CH).toFixed(1)}`,
    )
    .join(' ');
  const draw = tween(f, cue(3), cue(4.6));

  const screens = [
    // Location
    <AppChrome step={0} key="loc">
      <div style={{ width: 560, margin: '70px auto 0', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'inherit',
            fontSize: 30,
            fontWeight: 700,
            marginBottom: 26,
          }}
        >
          Where is your blanket from?
        </div>
        <div
          style={{
            textAlign: 'left',
            background: UI.card,
            borderRadius: 18,
            padding: 26,
            border: `1px solid ${UI.line}`,
          }}
        >
          <Field
            label="Location"
            value={LOCATION.slice(0, typed)}
            caret={f < cue(2)}
          />
          <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
            <Field label="From" value="Jan 1, 2025" />
            <Field label="To" value="Dec 31, 2025" />
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button primary press={press}>
              Get Weather Data
            </Button>
          </div>
        </div>
      </div>
    </AppChrome>,
    // Weather
    <AppChrome step={1} key="wx">
      <div style={{ padding: '34px 60px' }}>
        <div style={{ fontSize: 26, fontWeight: 700 }}>
          Minneapolis 2025 · daily highs
        </div>
        <svg
          width={CW}
          height={CH + 40}
          style={{ marginTop: 30, overflow: 'visible' }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={g}
              x1={0}
              x2={CW}
              y1={g * CH}
              y2={g * CH}
              stroke={UI.line}
            />
          ))}
          <polyline
            points={pts}
            fill="none"
            stroke={UI.primary}
            strokeWidth={3}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - draw}
          />
        </svg>
      </div>
    </AppChrome>,
    // Colors
    <AppChrome step={2} key="col">
      <div
        style={{
          padding: '26px 60px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px 30px',
        }}
      >
        {hero.palette.map((c, i) => {
          const t = tween(
            f,
            cue(5) + i * 1.5,
            cue(5) + i * 1.5 + 8,
            Easing.out(Easing.cubic),
          );
          const r = hero.ranges[i];
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                height: 50,
                opacity: t,
                transform: `translateY(${(1 - t) * 14}px)`,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 99,
                  background: c.hex,
                }}
              />
              <div style={{ fontSize: 19, fontWeight: 600, flex: 1 }}>
                {c.name}
              </div>
              <div style={{ fontSize: 17, color: UI.dim }}>
                {r.to}–{r.from}°F
              </div>
            </div>
          );
        })}
      </div>
    </AppChrome>,
    // Preview
    <AppChrome step={3} key="pre">
      <div style={{ padding: '40px 50px' }}>
        <Blanket
          rows={rows}
          colors={colors}
          width={1000}
          height={520}
          orientation="columns"
          grow={(i) =>
            tween(
              f,
              cue(6.5) + (i / rows.length) * 14,
              cue(6.5) + 6 + (i / rows.length) * 14,
            )
          }
        />
      </div>
    </AppChrome>,
  ];
  const clips = [
    'plan-location.mp4',
    'plan-weather.mp4',
    'plan-colors.mp4',
    'plan-preview.mp4',
  ];

  return (
    <AbsoluteFill>
      <Backdrop glow="rgba(242,164,58,0.14)" glowAt="70% 40%" />
      <div style={{ position: 'absolute', left: 110, top: 300 }}>
        <KineticCaption
          start={cue(0)}
          size={78}
          underline={false}
          lines={[{ text: 'Pick a place.' }]}
        />
        <div style={{ height: 14 }} />
        <KineticCaption
          start={cue(3)}
          size={78}
          underline={false}
          lines={[{ text: 'Get its weather.' }]}
        />
        <div style={{ height: 14 }} />
        <KineticCaption
          start={cue(5)}
          size={78}
          lines={[
            { text: 'Choose colors.', italic: true, color: COLOR.amberSoft },
          ]}
        />
      </div>

      <AbsoluteFill style={{ perspective: 2000 }}>
        <DeviceFrame
          kind="laptop"
          w={SW}
          h={SH}
          style={{
            left: 720,
            top: 170,
            transformOrigin: '50% 50%',
            transform: `translate(${lerp(-200, 0, pull)}px, ${lerp(-60, 0, pull)}px) scale(${lerp(1.2, 0.92, pull)}) rotateY(${lerp(0, -16, pull)}deg) rotateX(${lerp(0, 5, pull)}deg)`,
          }}
          lift={
            <>
              <LiftCard
                t={lift(1, 3)}
                style={{ left: 285, top: 180, width: 530 }}
              >
                <Field
                  label="Location"
                  value={LOCATION.slice(0, typed)}
                  caret={f < cue(2)}
                />
              </LiftCard>
              <LiftCard
                t={lift(3.6, 5)}
                style={{ left: 640, top: 40, display: 'flex', gap: 12 }}
              >
                {['365 days', 'High 93°F', 'Low −9°F'].map((s) => (
                  <div
                    key={s}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 99,
                      background: UI.bg,
                      fontSize: 19,
                      fontWeight: 600,
                      color: UI.text,
                    }}
                  >
                    {s}
                  </div>
                ))}
              </LiftCard>
              <LiftCard
                t={lift(5.6, 6.5)}
                style={{ left: 300, top: 560, display: 'flex', gap: 8 }}
              >
                {colors.map((c) => (
                  <div
                    key={c}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 99,
                      background: c,
                    }}
                  />
                ))}
              </LiftCard>
            </>
          }
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: stepIn,
              transform: `translateY(${(1 - stepIn) * 16}px)`,
            }}
          >
            {/* Each step's clip starts when the step does */}
            <Sequence
              key={step}
              from={step === 0 ? 0 : cue(AT[step]) - 3}
              layout="none"
            >
              <FootageSlot name={clips[step]}>{screens[step]}</FootageSlot>
            </Sequence>
          </div>
        </DeviceFrame>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
