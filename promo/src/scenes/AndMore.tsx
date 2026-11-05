import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import hero from '../data/hero.json';
import { COLOR, FONT } from '../brand';
import { Backdrop } from '../components/Backdrop';
import { Blanket } from '../components/Blanket';
import { FootageSlot } from '../components/FootageSlot';
import { KineticCaption } from '../components/KineticCaption';
import { UI } from '../components/MockUI';
import { pop } from '../components/anim';
import { Cue, steadyCue } from '../timing';

const rows = hero.days.map((d) => d.color);
const colors = hero.palette.map((c) => c.hex);
const TW = 700;
const TH = 330;

const tiles: { label: string; clip: string; draw: React.ReactNode }[] = [
  {
    label: 'Simpler navigation',
    clip: 'more-sidebar.mp4',
    draw: (
      <div style={{ display: 'flex', height: '100%' }}>
        <div
          style={{
            width: 230,
            background: '#fff',
            borderRight: `1px solid ${UI.line}`,
            padding: 22,
          }}
        >
          {['Create', 'My Library', 'Gallery', 'Yarn', 'Guides & Help'].map(
            (s, i) => (
              <div
                key={s}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 20,
                  fontWeight: 600,
                  marginBottom: 6,
                  background: i === 1 ? '#fbe6c8' : 'transparent',
                }}
              >
                {s}
              </div>
            ),
          )}
        </div>
        <div
          style={{
            flex: 1,
            padding: 24,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
          }}
        >
          {[0, 1, 2, 3].map((k) => (
            <div key={k} style={{ borderRadius: 10, overflow: 'hidden' }}>
              <Blanket
                rows={rows.slice(k * 40)}
                colors={k % 2 ? [...colors].reverse() : colors}
                width={200}
                height={110}
                orientation="rows"
                texture={0}
                radius={0}
              />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: 'Easier range editing',
    clip: 'more-ranges.mp4',
    draw: (
      <div style={{ padding: '26px 34px' }}>
        {hero.palette.slice(0, 6).map((c, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 99,
                background: c.hex,
              }}
            />
            <div
              style={{
                flex: 1,
                height: 14,
                borderRadius: 9,
                background: UI.line,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: `${10 + i * 12}%`,
                  width: '22%',
                  top: 0,
                  bottom: 0,
                  borderRadius: 9,
                  background: c.hex,
                }}
              />
            </div>
            <div style={{ width: 96, fontSize: 18, color: UI.dim }}>
              {hero.ranges[i].to}–{hero.ranges[i].from}°F
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: 'Track your progress',
    clip: 'more-progress.mp4',
    draw: (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 30,
          padding: '26px 34px',
        }}
      >
        <Blanket
          rows={rows}
          colors={colors}
          width={400}
          height={260}
          orientation="columns"
          radius={6}
        />
        {/* The days not made yet, veiled */}
        <div
          style={{
            position: 'absolute',
            left: 34 + (400 * 214) / 365,
            top: 26,
            width: 400 - (400 * 214) / 365,
            height: 260,
            background: 'rgba(247,244,238,0.72)',
            borderRadius: '0 6px 6px 0',
          }}
        />
        <div>
          <div
            style={{ fontFamily: FONT.display, fontSize: 64, fontWeight: 600 }}
          >
            59%
          </div>
          <div style={{ fontSize: 20, color: UI.dim }}>Day 214 of 365</div>
        </div>
      </div>
    ),
  },
  {
    label: 'Edit weather data',
    clip: 'more-edit-weather.mp4',
    draw: (
      <div style={{ padding: '22px 30px', fontSize: 18 }}>
        {['Date', 'Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6'].map(
          (d, r) => (
            <div
              key={d}
              style={{
                display: 'flex',
                borderBottom: `1px solid ${UI.line}`,
                height: 40,
                alignItems: 'center',
                fontWeight: r === 0 ? 700 : 400,
              }}
            >
              <div style={{ width: 120 }}>{d}</div>
              <div
                style={{
                  width: 140,
                  padding: '4px 10px',
                  borderRadius: 6,
                  outline: r === 3 ? `3px solid ${UI.primary}` : 'none',
                }}
              >
                {r === 0 ? 'High' : `${Math.round(hero.days[r - 1].tmax)}°F`}
              </div>
              <div style={{ width: 140 }}>
                {r === 0 ? 'Low' : `${Math.round(hero.days[r - 1].tmin)}°F`}
              </div>
            </div>
          ),
        )}
      </div>
    ),
  },
];

/** Beat 8: a tile on every eighth note, then held for the bar (real moments later: more-*.mp4) */
export const AndMore: React.FC<{ cue?: Cue }> = ({ cue = steadyCue }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <div
        style={{
          position: 'absolute',
          left: (1920 - (TW * 2 + 40)) / 2,
          top: 70,
          display: 'grid',
          gridTemplateColumns: `${TW}px ${TW}px`,
          gap: 40,
        }}
      >
        {tiles.map((t, k) => {
          const s = pop(f, cue(k * 0.5) - 2, 13, 190);
          return (
            <div
              key={k}
              style={{
                position: 'relative',
                width: TW,
                height: TH,
                borderRadius: 20,
                overflow: 'hidden',
                background: UI.bg,
                fontFamily: FONT.body,
                color: UI.text,
                boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
                opacity: Math.min(1, s * 2),
                transform: `scale(${1.25 - 0.25 * s}) rotate(${(1 - s) * (k % 2 ? 4 : -4)}deg)`,
              }}
            >
              <FootageSlot name={t.clip}>{t.draw}</FootageSlot>
              <div
                style={{
                  position: 'absolute',
                  left: 16,
                  bottom: 16,
                  padding: '8px 18px',
                  borderRadius: 99,
                  background: COLOR.ink,
                  color: COLOR.cream,
                  fontWeight: 600,
                  fontSize: 22,
                }}
              >
                {t.label}
              </div>
            </div>
          );
        })}
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
          start={cue(0)}
          size={88}
          align="center"
          stagger={2}
          lines={[
            {
              text: '…and so much more.',
              italic: true,
              color: COLOR.amberSoft,
            },
          ]}
        />
      </div>
    </AbsoluteFill>
  );
};
