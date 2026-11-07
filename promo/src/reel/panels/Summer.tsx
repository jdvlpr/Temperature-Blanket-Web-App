import React from 'react';
import { Easing, interpolate } from 'remotion';
import { clamp, lerp, pop } from '../../components/anim';
import { TONE } from '../theme';
import { LAPTOP_SCREEN, Laptop, PHONE_SCREEN, Phone } from '../parts/Devices';
import { Cut, rrect, scallop } from '../parts/PaperKit';
import { AppBar, BlanketSoFar, Synced } from '../parts/Screens';
import { PANEL, bar, headDay, lilt } from '../timing';

/** Summer: the same project on a phone and on a laptop at home, kept in step */
export const Summer: React.FC<{ f: number }> = ({ f }) => {
  const head = headDay(f);
  const phoneIn = interpolate(f, [bar(20.4), bar(21.4)], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.1)) });
  const laptopIn = pop(f, bar(21.2), 13, 120);
  const thread = interpolate(f, [bar(22), bar(22.8)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const sync1 = pop(f, bar(22.8), 10, 180);
  const sync2 = pop(f, bar(24.8), 10, 180);
  const travel = ((f - bar(22.8)) / bar(2) + 10) % 1;
  const P = { x: 290, y: 820 };
  const L = { x: 760, y: 1040 };
  const arc = `M ${P.x + 90} ${P.y - 300} C ${P.x + 200} ${P.y - 520} ${L.x - 120} ${L.y - 650} ${L.x} ${L.y - 270}`;
  const sun = pop(f, bar(20.6), 16, 80);
  const synced = Math.max(sync1, sync2) * (1 + 0.2 * (1 - sync2));
  return (
    <svg style={{ position: 'absolute', left: PANEL.summer, top: 0, overflow: 'visible' }} width={1080} height={1920}>
      {/* A paper sun */}
      <g transform={`translate(820 560) scale(${sun}) rotate(${f * 0.15})`}>
        <Cut depth={1}>
          <path d={scallop(0, 0, 150, 150, 14, 0.18)} fill="#f6dc93" />
        </Cut>
        <Cut depth={2}>
          <circle r={100} fill="#f2c45c" />
        </Cut>
      </g>
      {/* The table, a laptop and a little plant */}
      <g opacity={Math.min(1, laptopIn * 2)}>
        <Cut depth={2}>
          <path d={`M ${L.x - 200} ${L.y + 36} L ${L.x - 214} ${L.y + 300} L ${L.x - 192} ${L.y + 300} L ${L.x - 170} ${L.y + 36} Z M ${L.x + 200} ${L.y + 36} L ${L.x + 214} ${L.y + 300} L ${L.x + 192} ${L.y + 300} L ${L.x + 170} ${L.y + 36} Z`} fill="#a87a52" />
          <path d={rrect(L.x - 270, L.y + 26, 540, 26, 10)} fill="#c49468" />
        </Cut>
      </g>
      <g transform={`translate(${L.x} ${L.y + 26}) scale(${laptopIn}) translate(${-L.x} ${-(L.y + 26)})`}>
        <Laptop
          x={L.x}
          y={L.y}
          scale={0.66}
          screen={
            <g>
              <AppBar w={LAPTOP_SCREEN.w} title="My Town 2025" size={22} />
              <g transform="translate(30 92)">
                <BlanketSoFar head={head} w={LAPTOP_SCREEN.w - 60} h={190} orientation="columns" />
              </g>
              <Synced x={LAPTOP_SCREEN.w - 46} y={30} s={synced} />
            </g>
          }
        />
        <g transform={`translate(${L.x + 222} ${L.y + 26})`}>
          <Cut depth={2}>
            <path d="M -18 -70 C -40 -100 -30 -130 -6 -120 C -2 -100 -8 -84 -4 -70 Z" fill="#8fae7c" />
            <path d="M 18 -70 C 44 -96 40 -128 12 -122 C 6 -102 10 -86 6 -70 Z" fill="#7a9c68" />
            <path d="M -30 -72 L 30 -72 L 22 0 L -22 0 Z" fill="#d9774a" />
          </Cut>
        </g>
      </g>
      <mask id="sync-reveal" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
        <path d={arc} fill="none" stroke="#fff" strokeWidth={30} pathLength={1} strokeDasharray={`${thread} 2`} />
      </mask>
      <path d={arc} fill="none" stroke={TONE.russet} strokeWidth={6} strokeDasharray="2 16" strokeLinecap="round" opacity={0.85} mask="url(#sync-reveal)" />
      {thread >= 1 && <TravelDot d={arc} t={travel} />}
      <Phone
        x={P.x}
        y={lerp(1850, P.y, phoneIn) - lilt(f) * 5 + Math.sin(f / 16) * 4}
        rotate={lerp(14, -6, phoneIn)}
        scale={0.82}
        screen={
          <g>
            <AppBar w={PHONE_SCREEN.w} title="My Town 2025" size={18} />
            <g transform="translate(36 80)">
              <BlanketSoFar head={head} w={PHONE_SCREEN.w - 72} h={440} orientation="rows" />
            </g>
            <Synced x={PHONE_SCREEN.w - 36} y={24} s={synced} />
          </g>
        }
      />
    </svg>
  );
};

/** A dot travelling along a cubic path */
const TravelDot: React.FC<{ d: string; t: number }> = ({ d, t }) => {
  const n = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const [x0, y0, x1, y1, x2, y2, x3, y3] = n;
  const u = 1 - t;
  const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
  const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
  return (
    <Cut depth={2}>
      <circle cx={x} cy={y} r={12} fill={TONE.honey} />
    </Cut>
  );
};
