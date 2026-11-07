import React from 'react';
import { Easing, interpolate } from 'remotion';
import { clamp, lerp, pop, tween } from '../../components/anim';
import { rand } from '../color';
import { PALETTE, PICKS } from '../palette';
import { BALL_START } from '../parts/Year';
import { PHONE_SCREEN, Phone } from '../parts/Devices';
import { AppBar } from '../parts/Screens';
import { FONT } from '../theme';
import { Cut, puff, scallop } from '../parts/PaperKit';
import { YarnBall } from '../parts/YarnBall';
import { GROUND, bar, lilt } from '../timing';

/** The "photo": the maple's square, which scripts render to maple.png for the palette */
export const PHOTO = { x: 140, y: 380, size: 800 };
const T = { x: 540, y: 720 }; // the crown's center

// The scene's own paper (the photo the palette is picked from)
const BACK = ['#a8402c', '#c4572f', '#b5482a'];
const MID = ['#df7c3a', '#e8692a', '#d9772f'];
const FRONT = ['#eba649', '#f3c56b', '#f0b453'];

const cluster = (n: number, rx: number, ry: number, size: number, seed: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = rand(i, seed) * Math.PI * 2;
    const d = Math.sqrt(rand(i, seed + 1));
    return {
      x: T.x + Math.cos(a) * d * rx,
      y: T.y + Math.sin(a) * d * ry,
      r: size * (0.75 + rand(i, seed + 2) * 0.5),
      k: i,
    };
  });
const BACK_C = cluster(9, 270, 200, 130, 10);
const MID_C = cluster(9, 240, 180, 105, 20);
const FRONT_C = cluster(8, 210, 150, 72, 30);

/** A hill band across the scene, rounding down to the ground past the photo (x > 980) */
const hill = (y0: number, amp: number, freq: number, phase: number) => {
  let d = `M -60 ${GROUND.top + 40}`;
  for (let x = -60; x <= 1100; x += 20) {
    const fall = x > 960 ? Math.pow((x - 960) / 140, 2) * (GROUND.top + 40 - y0) : 0;
    d += ` L ${x} ${Math.min(GROUND.top + 40, y0 + Math.sin(x / freq + phase) * amp + fall).toFixed(1)}`;
  }
  return d + ` Z`;
};


/** The maple scene alone (also rendered on its own as the photo) */
export const Maple: React.FC<{ f: number; still?: boolean }> = ({ f, still = false }) => {
  const scene = still ? 1 : tween(f, 0, bar(0.8));
  const sway = still ? 0 : Math.sin(f / 40) * 0.8;
  const grow = (i: number, layer: number) =>
    still ? 1 : pop(f, bar(0.1 + layer * 0.35) + i * 2.2, 12, 140);
  return (
    <g>
      <g opacity={scene}>
        <Cut depth={1}>
          <circle cx={T.x} cy={T.y + 40} r={380} fill="#d6e6f0" />
        </Cut>
        <Cut depth={1}>
          <path d={hill(1010, 40, 170, 0.5)} fill="#b9b4e0" />
        </Cut>
        <Cut depth={2}>
          <path d={hill(1100, 34, 120, 2)} fill="#9a90cc" />
        </Cut>
        <Cut depth={2}>
          <path d={hill(1190, 26, 90, 4)} fill="#7b6aa8" />
        </Cut>
      </g>
      <g transform={`rotate(${sway} ${T.x} ${GROUND.top})`}>
        <Cut depth={2}>
          <path
            opacity={scene}
            fill="#8d5b3b"
            d={`M ${T.x - 30} ${GROUND.top + 6} C ${T.x - 22} 1150 ${T.x - 26} 1000 ${T.x - 14} 880 C ${T.x - 60} 840 ${T.x - 130} 820 ${T.x - 190} 770 L ${T.x - 176} 756 C ${T.x - 120} 790 ${T.x - 60} 808 ${T.x - 12} 840 C ${T.x - 10} 790 ${T.x - 14} 740 ${T.x - 8} 690 L ${T.x + 10} 690 C ${T.x + 12} 750 ${T.x + 10} 800 ${T.x + 12} 830 C ${T.x + 70} 790 ${T.x + 130} 770 ${T.x + 190} 720 L ${T.x + 202} 736 C ${T.x + 140} 790 ${T.x + 70} 820 ${T.x + 16} 880 C ${T.x + 22} 1000 ${T.x + 20} 1150 ${T.x + 34} ${GROUND.top + 6} Z`}
          />
        </Cut>
        <Cut depth={2}>
          {BACK_C.map((c) => (
            <path key={c.k} d={scallop(c.x, c.y, c.r * grow(c.k, 0), c.r * 0.9 * grow(c.k, 0), 8, 0.16, c.k)} fill={BACK[c.k % 3]} />
          ))}
        </Cut>
        <Cut depth={2}>
          {MID_C.map((c) => (
            <path key={c.k} d={scallop(c.x - 10, c.y - 14, c.r * grow(c.k, 1), c.r * 0.88 * grow(c.k, 1), 7, 0.18, c.k + 3)} fill={MID[c.k % 3]} />
          ))}
        </Cut>
        <Cut depth={3}>
          {FRONT_C.map((c) => (
            <path key={c.k} d={scallop(c.x - 18, c.y - 28, c.r * grow(c.k, 2), c.r * 0.85 * grow(c.k, 2), 6, 0.2, c.k + 7)} fill={FRONT[c.k % 3]} />
          ))}
        </Cut>
      </g>
    </g>
  );
};

const N = PALETTE.length;
const ballX = (k: number) => 150 + k * 82;
/** Each color is picked on its own beat, from bar 3 */
export const PICK_BARS = PALETTE.map((_, k) => 3 + k / 3);
/** Frames a picked color takes to travel from its dot on the photo to its swatch */
const TO_SWATCH = 10;
/** The swatches hop out of the phone, round into yarn balls and drop (story bars; timing.ts slows this stretch) */
export const FLY_BAR = 6.45;
const flyAt = (k: number) => bar(FLY_BAR + k * 0.07);
const FLY_FRAMES = 24;
/** The hop's share of the flight: the square lifts and rounds into a ball */
const HOP = 0.32;
/** Each ball winds into the hero ball after it has landed, the first ones first */
const mergeAt = (k: number): [number, number] => [bar(7.5 + k * 0.03), bar(7.72 + k * 0.02)];

// The app screen (Get Colors › From an Image), in the phone's app area
const SHOT = { x: 16, y: 58, size: 240 };
const SW = 42;
const swatch = (k: number) => ({ x: 15 + (k % 5) * 50, y: 342 + Math.floor(k / 5) * 52 });
const ink = '#4a3a30';

const PickScreen: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <AppBar w={PHONE_SCREEN.w} title="From an Image" size={18} />
    <svg x={SHOT.x} y={SHOT.y} width={SHOT.size} height={SHOT.size} viewBox={`${PHOTO.x} ${PHOTO.y} ${PHOTO.size} ${PHOTO.size}`}>
      <rect x={PHOTO.x} y={PHOTO.y} width={PHOTO.size} height={PHOTO.size} fill="#f2e1c6" />
      <Maple f={0} still />
    </svg>
    {PALETTE.map((c, k) => {
      const s = pop(f, bar(PICK_BARS[k]), 10, 170);
      if (s <= 0.01) return null;
      const x = SHOT.x + PICKS[k].x * SHOT.size;
      const y = SHOT.y + PICKS[k].y * SHOT.size;
      const ring = interpolate(f, [bar(PICK_BARS[k]), bar(PICK_BARS[k]) + 14], [0, 1], clamp);
      return (
        <g key={k} transform={`translate(${x} ${y})`}>
          <circle r={9 + ring * 16} fill="none" stroke="#fff" strokeWidth={3} opacity={1 - ring} />
          <g transform={`scale(${s})`}>
            <circle r={10} fill="#fff" />
            <circle r={7} fill={c} />
          </g>
        </g>
      );
    })}
    <text x={16} y={326} fontFamily={FONT.body} fontWeight={600} fontSize={14} fill={ink} opacity={0.75}>
      Stylecraft Special DK
    </text>
    {PALETTE.map((c, k) => {
      // The picked color travels from its dot to its swatch
      const t0 = bar(PICK_BARS[k]) + 3;
      const t = interpolate(f, [t0, t0 + TO_SWATCH], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      if (t <= 0 || t >= 1) return null;
      const from = { x: SHOT.x + PICKS[k].x * SHOT.size, y: SHOT.y + PICKS[k].y * SHOT.size };
      const sw = swatch(k);
      const x = lerp(from.x, sw.x + SW / 2, t);
      const y = lerp(from.y, sw.y + SW / 2, t) - Math.sin(t * Math.PI) * 40;
      return (
        <g key={k} transform={`translate(${x} ${y})`}>
          <circle r={lerp(10, 14, t)} fill="#fff" />
          <circle r={lerp(7, 11, t)} fill={c} />
        </g>
      );
    })}
    {PALETTE.map((c, k) => {
      const { x, y } = swatch(k);
      const s = pop(f, bar(PICK_BARS[k]) + 3 + TO_SWATCH - 2, 11, 180);
      const gone = f >= flyAt(k);
      return (
        <g key={k}>
          <rect x={x} y={y} width={SW} height={SW} rx={10} fill="none" stroke="#d9cbb5" strokeWidth={2} strokeDasharray="5 5" />
          {!gone && s > 0.01 && (
            <g transform={`translate(${x + SW / 2} ${y + SW / 2}) scale(${s})`}>
              <rect x={-SW / 2} y={-SW / 2} width={SW} height={SW} rx={10} fill={c} />
            </g>
          )}
        </g>
      );
    })}
  </g>
);

// The phone floats up as a camera, takes the photo on bar 2, becomes the
// app's From an Image screen, and drifts away once the colors are out
const phoneAt = (f: number) => {
  const rise = interpolate(f, [bar(0.9), bar(1.7)], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.1)) });
  const settle = interpolate(f, [bar(2.1), bar(2.9)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const away = interpolate(f, [bar(6.9), bar(7.6)], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const bob = Math.sin(f / 14) * 4 * (1 - settle * 0.6);
  return {
    px: 540,
    py: lerp(lerp(2000, 820, rise), 1010, settle) + away * 1100 + bob,
    ps: lerp(1, 1.34, settle),
    rot: lerp(lerp(-10, -3, rise), 0, settle) + away * 8,
  };
};
/** A point in the app area at frame f, in the scene (the phone is upright by then) */
const fromApp = (f: number, ax: number, ay: number) => {
  const { px, py, ps } = phoneAt(f);
  return { x: px + ps * (ax - PHONE_SCREEN.w / 2), y: py + ps * (ay - 291 + 38), ps };
};

export const October: React.FC<{ f: number }> = ({ f }) => {
  const { px, py, ps, rot } = phoneAt(f);
  const app = interpolate(f, [bar(2.15), bar(2.45)], [0, 1], clamp);
  const flash = interpolate(f - bar(2), [0, 2, 12], [0, 1, 0], clamp);
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1080} height={1920}>
      <Maple f={f} />
      <Cut depth={2}>
        {/* Scalloped along the top; its right end rounds down out of the way of the next scene */}
        <path d={`${puff(-60, GROUND.top - 6, 1040, 150, 8, 1).split(' L 980 ')[0]} C 1060 ${GROUND.top - 6} 1110 ${GROUND.top + 40} 1130 ${GROUND.top + 150} L -60 ${GROUND.top + 150} Z`} fill="#e7b96a" />
      </Cut>

      {py < 1990 && (
        <g>
          {app < 1 && (
            <g opacity={1 - app}>
              <Phone
                x={px}
                y={py}
                scale={ps}
                rotate={rot}
                seeThrough
                screenFill="rgba(255,255,255,0.07)"
                screen={
                  <g>
                    {[
                      [26, 26, 1, 1],
                      [246, 26, -1, 1],
                      [26, 556, 1, -1],
                      [246, 556, -1, -1],
                    ].map(([x, y, sx, sy], i) => (
                      <path key={i} d={`M ${x} ${y + 38 * sy} L ${x} ${y} L ${x + 38 * sx} ${y}`} stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.9} />
                    ))}
                    <circle cx={136} cy={516} r={30} fill="none" stroke="#fff" strokeWidth={5} />
                    <circle cx={136} cy={516} r={22} fill="#fff" opacity={0.92} />
                    <rect width={272} height={582} fill="#fff" opacity={flash} />
                  </g>
                }
              />
            </g>
          )}
          {app > 0 && (
            <g opacity={app}>
              <Phone x={px} y={py} scale={ps} rotate={rot} screen={<PickScreen f={f} />} />
            </g>
          )}
        </g>
      )}

      {/* Each swatch hops out of the phone, rounds into a ball of that yarn and drops; then they wind into one */}
      {PALETTE.map((c, k) => {
        const t0 = flyAt(k);
        if (f < t0) return null;
        const sw = swatch(k);
        // Where it left the phone (the phone may drift away meanwhile)
        const from = fromApp(t0, sw.x + SW / 2, sw.y + SW / 2);
        const [mA, mB] = mergeAt(k);
        const merge = interpolate(f, [mA, mB], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
        if (merge >= 1) return null;
        const t = interpolate(f, [t0, t0 + FLY_FRAMES], [0, 1], clamp);
        // Hop: lift and round into a ball. Drop: fall in an arc to its spot on the ground
        const hop = Easing.out(Easing.cubic)(Math.min(1, t / HOP));
        const drop = Easing.in(Easing.quad)(Math.max(0, (t - HOP) / (1 - HOP)));
        const h0 = (SW / 2) * from.ps;
        const lift = { x: from.x + (ballX(k) - from.x) * 0.12, y: from.y - 90 };
        const gx = ballX(k);
        const gy = GROUND.top - 26 + 2;
        const fx = drop > 0 ? lerp(lift.x, gx, drop) : lerp(from.x, lift.x, hop);
        const fy = drop > 0 ? lerp(lift.y, gy, drop) : lerp(from.y, lift.y, hop);
        const r = drop > 0 ? lerp(h0 * 1.05, 26, drop) : lerp(h0, h0 * 1.05, hop);
        // A squash on landing
        const landed = t0 + FLY_FRAMES;
        const squash = interpolate(f, [landed, landed + 3, landed + 12], [0, 1, 0], clamp) * 0.18;
        const bx = lerp(fx, BALL_START.x, merge);
        const by = lerp(fy, BALL_START.y - 40, merge) - (t >= 1 && merge <= 0 ? lilt(f) * 8 : 0) - Math.sin(merge * Math.PI) * 60;
        const ball = interpolate(t, [HOP * 0.5, HOP * 1.2], [0, 1], clamp);
        const sx = (1 - merge * 0.6) * (1 + squash);
        const sy = (1 - merge * 0.6) * (1 - squash);
        return (
          <g key={k} transform={`translate(${bx} ${by + r * squash}) scale(${sx} ${sy}) translate(${-bx} ${-by})`}>
            {ball < 1 && (
              <rect x={bx - r} y={by - r} width={r * 2} height={r * 2} rx={lerp(10 * from.ps, r, hop)} fill={c} opacity={1 - ball} />
            )}
            {ball > 0 && (
              <g opacity={ball}>
                <YarnBall x={bx} y={by} r={r} colors={[c]} spin={k * 40 + t * 300} />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
