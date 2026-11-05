import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import hero from '../data/hero.json';
import photo from '../data/photo.json';
import { COLOR, FONT } from '../brand';
import { Backdrop } from '../components/Backdrop';
import { Blanket } from '../components/Blanket';
import { Eyebrow, KineticCaption } from '../components/KineticCaption';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const PHOTO = { x: 120, y: 372, w: 750, h: 500 };
const CHIPS = { x: 950, y: 214, w: 420, h: 74, gap: 12 };
const BL = { x: 1460, y: 200, w: 360, h: 700 };
const N = hero.days.length;
const pal = photo.palette;

const markerAt = (k: number) => ({
  x: PHOTO.x + pal[k].x * PHOTO.w,
  y: PHOTO.y + pal[k].y * PHOTO.h,
});
const chipAt = (k: number) => ({
  x: CHIPS.x + 40,
  y: CHIPS.y + k * (CHIPS.h + CHIPS.gap) + CHIPS.h / 2,
});
const FLY = (k: number) => 34 + k * 6;

export const PhotoPalette: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({
    frame: f,
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const wave = (i: number) =>
    interpolate(f, [78 + (i / N) * 46, 90 + (i / N) * 46], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
  const blanketIn = spring({
    frame: f - 8,
    fps,
    config: { damping: 18, stiffness: 80 },
  });

  return (
    <AbsoluteFill>
      <Backdrop glow="rgba(80,191,181,0.16)" glowAt="25% 30%" />

      <div style={{ position: 'absolute', left: PHOTO.x, top: 96 }}>
        <Eyebrow start={4} color="#7fd4cb">
          Improved color picker
        </Eyebrow>
        <div style={{ height: 18 }} />
        <KineticCaption
          start={10}
          size={84}
          lines={[
            { text: 'Your photo.' },
            { text: 'Your yarn colors.', italic: true, color: '#9fe0d8' },
          ]}
        />
      </div>

      {/* The photo, with the app's markers where each color was found */}
      <div
        style={{
          position: 'absolute',
          left: PHOTO.x,
          top: PHOTO.y,
          width: PHOTO.w,
          height: PHOTO.h,
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow:
            '0 40px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)',
          opacity: card,
          transform: `translateY(${(1 - card) * 60}px) scale(${0.94 + card * 0.06})`,
        }}
      >
        <Img
          src={staticFile('sea-and-forest.jpg')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      {pal.map((c, k) => {
        const m = markerAt(k);
        const pop = spring({
          frame: f - (16 + k * 5),
          fps,
          config: { damping: 10, stiffness: 180 },
        });
        const pulse = interpolate(f, [FLY(k), FLY(k) + 16], [0, 1], clamp);
        return (
          <React.Fragment key={k}>
            <div
              style={{
                position: 'absolute',
                left: m.x - 34,
                top: m.y - 34,
                width: 68,
                height: 68,
                borderRadius: 99,
                border: `3px solid ${COLOR.cream}`,
                opacity: (1 - pulse) * (pulse > 0 ? 0.8 : 0),
                transform: `scale(${1 + pulse * 0.9})`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: m.x - 22,
                top: m.y - 22,
                width: 44,
                height: 44,
                borderRadius: 99,
                background: c.hex,
                border: `4px solid ${COLOR.cream}`,
                boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
                transform: `scale(${pop})`,
              }}
            />
          </React.Fragment>
        );
      })}

      {/* The gauge: yarn chips that the swatches land in */}
      {pal.map((c, k) => {
        const slot = chipAt(k);
        const land = interpolate(f, [FLY(k) + 18, FLY(k) + 26], [0, 1], clamp);
        const chipIn = spring({
          frame: f - (6 + k * 2),
          fps,
          config: { damping: 20, stiffness: 120 },
        });
        const nameChars = Math.floor(
          interpolate(f, [FLY(k) + 20, FLY(k) + 34], [0, c.name.length], clamp),
        );
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: CHIPS.x,
              top: slot.y - CHIPS.h / 2,
              width: CHIPS.w,
              height: CHIPS.h,
              borderRadius: 18,
              background: `rgba(255,255,255,${0.05 + land * 0.04})`,
              border: '1px solid rgba(255,255,255,0.10)',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              paddingLeft: 18,
              opacity: chipIn,
              transform: `translateX(${(1 - chipIn) * 40}px)`,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 99,
                border: '2px dashed rgba(255,255,255,0.25)',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontFamily: FONT.body,
                color: COLOR.cream,
                fontSize: 25,
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {c.name.slice(0, nameChars)}
              {nameChars > 0 && (
                <span
                  style={{
                    color: COLOR.creamDim,
                    fontSize: 18,
                    marginLeft: 10,
                    fontWeight: 400,
                  }}
                >
                  {nameChars === c.name.length ? 'Special DK' : ''}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Swatches flying from the photo into the gauge */}
      {pal.map((c, k) => {
        const t = interpolate(f, [FLY(k), FLY(k) + 22], [0, 1], {
          ...clamp,
          easing: Easing.inOut(Easing.cubic),
        });
        if (t <= 0) return null;
        const a = markerAt(k);
        const b = chipAt(k);
        const lift = 220 + k * 10;
        const cx = (a.x + b.x) / 2;
        const cy = Math.min(a.y, b.y) - lift;
        const x = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * cx + t ** 2 * b.x;
        const y = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * cy + t ** 2 * b.y;
        const s = 1 + Math.sin(t * Math.PI) * 0.5;
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: x - 22,
              top: y - 22,
              width: 44,
              height: 44,
              borderRadius: 99,
              background: c.hex,
              border: `3px solid ${COLOR.cream}`,
              boxShadow: `0 ${10 + s * 10}px ${20 + s * 20}px rgba(0,0,0,0.5)`,
              transform: `scale(${s})`,
            }}
          />
        );
      })}

      {/* The blanket takes the new colors in a wave, from the top */}
      <div
        style={{
          position: 'absolute',
          left: BL.x,
          top: BL.y,
          perspective: 1400,
          opacity: blanketIn,
        }}
      >
        <div
          style={{
            transform: `translateX(${(1 - blanketIn) * 80}px) rotateY(-14deg) rotateZ(2deg)`,
            filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.55))',
          }}
        >
          <Blanket
            rows={hero.days.map((d) => d.color)}
            colors={hero.palette.map((c) => c.hex)}
            recolor={{
              colors: pal.map((c) => c.hex),
              rows: photo.rows,
              t: wave,
            }}
            width={BL.w}
            height={BL.h}
            orientation="rows"
            stitchAspect={0.75}
            radius={12}
            wobble={10}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
