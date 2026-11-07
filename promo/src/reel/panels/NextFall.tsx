import React from 'react';
import { Easing, interpolate } from 'remotion';
import { clamp, lerp, pop } from '../../components/anim';
import { Blanket } from '../../components/Blanket';
import { PALETTE, ROWS } from '../palette';
import { FONT, INK, TONE } from '../theme';
import { PHONE_SCREEN, Phone } from '../parts/Devices';
import { Cut, rrect, scallop } from '../parts/PaperKit';
import { AppBar } from '../parts/Screens';
import { PANEL, bar, lilt } from '../timing';

const SAGE = '#9db08a';
const SAGE_D = '#86997a';
const SAGE_L = '#b3c3a0';

/** Fall again: the finished blanket over an armchair, a mug of something warm, and its gallery page */
export const NextFall: React.FC<{ f: number }> = ({ f }) => {
  const room = pop(f, bar(26.4), 14, 110);
  const chair = pop(f, bar(26.7), 14, 110);
  const drape = interpolate(f, [bar(27.2), bar(28.2)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const mugIn = interpolate(f, [bar(28.3), bar(28.9)], [0, 1], { ...clamp, easing: Easing.bounce });
  const phoneIn = interpolate(f, [bar(29.5), bar(30.3)], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.2)) });
  const updated = pop(f, bar(30.6), 10, 170);
  const views = Math.round(interpolate(f, [bar(30), bar(32.5)], [1186, 1248], clamp));
  const C = { x: 370, y: 1250 }; // the seat's front
  const steam = (k: number) => {
    const t = (f / 40 + k * 0.33) % 1;
    return { y: -t * 110, o: Math.sin(t * Math.PI) * 0.8 };
  };
  return (
    <svg style={{ position: 'absolute', left: PANEL.nextFall, top: 0, overflow: 'visible' }} width={1080} height={1920}>
      {/* A window onto the next fall */}
      <g transform={`translate(300 740) scale(${room}) translate(-300 -740)`} opacity={Math.min(1, room * 2)}>
        <Cut depth={2}>
          <path d={`${rrect(110, 530, 380, 420, 18)} ${rrect(134, 554, 332, 372, 8)}`} fillRule="evenodd" fill="#efe3cf" />
        </Cut>
        <rect x={134} y={554} width={332} height={372} fill="#d6e6f0" />
        <Cut depth={1}>
          <path d={scallop(240, 720, 90, 80, 8, 0.18, 2)} fill="#df7c3a" />
          <path d={scallop(370, 780, 80, 72, 7, 0.2, 5)} fill="#eba649" />
          <path d={`M 236 926 L 240 780 L 252 780 L 256 926 Z`} fill="#8d5b3b" />
        </Cut>
        <Cut depth={2}>
          <rect x={292} y={554} width={16} height={372} fill="#efe3cf" />
          <rect x={134} y={732} width={332} height={16} fill="#efe3cf" />
          <path d={rrect(92, 944, 416, 22, 8)} fill="#e2d2b8" />
        </Cut>
      </g>

      {/* The armchair, with the finished blanket over it */}
      <g transform={`translate(${C.x} ${C.y}) scale(${chair}) translate(${-C.x} ${-C.y})`}>
        <Cut depth={2}>
          <path d={`M ${C.x - 205} ${C.y - 60} L ${C.x - 195} ${C.y - 420} Q ${C.x - 190} ${C.y - 470} ${C.x - 140} ${C.y - 476} Q ${C.x} ${C.y - 500} ${C.x + 140} ${C.y - 476} Q ${C.x + 190} ${C.y - 470} ${C.x + 195} ${C.y - 420} L ${C.x + 205} ${C.y - 60} Z`} fill={SAGE_D} />
        </Cut>
        <g transform={`translate(${C.x - 160} ${C.y - 466}) rotate(${-2 + (1 - drape) * -10})`}>
          <g transform={`scale(1 ${Math.max(0.001, drape)})`}>
            <Cut depth={2}>
              <Blanket rows={ROWS} colors={PALETTE} width={320} height={470} orientation="rows" texture={0.6} stitchAspect={0.7} radius={10} />
            </Cut>
            {/* The fold where it hangs over the chair's back */}
            <g opacity={drape}>
              <Cut depth={2}>
                <g transform="translate(-6 -14)">
                  <Blanket rows={ROWS.slice(0, 40)} colors={PALETTE} width={332} height={46} orientation="rows" texture={0.6} stitchAspect={0.7} radius={14} />
                </g>
              </Cut>
              <rect x={-6} y={22} width={332} height={10} fill="#3a2414" opacity={0.12} />
            </g>
          </g>
        </g>
        <Cut depth={3}>
          <path d={rrect(C.x - 245, C.y - 140, 490, 140, 36)} fill={SAGE_L} />
        </Cut>
        <Cut depth={3}>
          <path d={`M ${C.x - 290} ${C.y + 10} L ${C.x - 290} ${C.y - 230} Q ${C.x - 290} ${C.y - 290} ${C.x - 240} ${C.y - 290} Q ${C.x - 200} ${C.y - 290} ${C.x - 200} ${C.y - 240} L ${C.x - 200} ${C.y + 10} Z`} fill={SAGE} />
          <path d={`M ${C.x + 290} ${C.y + 10} L ${C.x + 290} ${C.y - 230} Q ${C.x + 290} ${C.y - 290} ${C.x + 240} ${C.y - 290} Q ${C.x + 200} ${C.y - 290} ${C.x + 200} ${C.y - 240} L ${C.x + 200} ${C.y + 10} Z`} fill={SAGE} />
          <path d={rrect(C.x - 300, C.y - 10, 600, 40, 14)} fill={SAGE_D} />
          <path d={`M ${C.x - 260} ${C.y + 30} L ${C.x - 270} ${C.y + 100} L ${C.x - 248} ${C.y + 100} L ${C.x - 236} ${C.y + 30} Z M ${C.x + 260} ${C.y + 30} L ${C.x + 270} ${C.y + 100} L ${C.x + 248} ${C.y + 100} L ${C.x + 236} ${C.y + 30} Z`} fill="#8d5b3b" />
        </Cut>
      </g>

      {/* A side table, and a mug dropped onto it */}
      <g opacity={Math.min(1, room * 2)}>
        <Cut depth={2}>
          <path d="M 782 1180 L 774 1330 L 794 1330 L 806 1180 Z" fill="#a87a52" />
          <path d={rrect(700, 1166, 190, 24, 12)} fill="#c49468" />
          <path d={rrect(744, 1322, 100, 14, 7)} fill="#a87a52" />
        </Cut>
      </g>
      {f >= bar(28.3) && (
        <g transform={`translate(795 ${lerp(860, 1104, mugIn)})`}>
          {[0, 1, 2].map((k) => {
            const s = steam(k);
            return <path key={k} d={`M ${-16 + k * 16} ${-16 + s.y} q 10 -14 0 -28 q -10 -14 0 -28`} fill="none" stroke="#fffaf2" strokeWidth={6} opacity={s.o} strokeLinecap="round" />;
          })}
          <Cut depth={2}>
            <path d="M 34 6 q 32 0 28 24 q -4 20 -32 14 l 0 -10 q 20 2 22 -6 q 2 -12 -18 -12 Z" fill="#e9dcc6" />
            <path d="M -38 -8 L 38 -8 L 33 54 Q 31 62 23 62 L -23 62 Q -31 62 -33 54 Z" fill="#f4ebdc" />
            <rect x={-37} y={10} width={73} height={14} fill={TONE.russet} />
          </Cut>
        </g>
      )}

      {/* Its gallery page, updated */}
      {phoneIn > 0 && (
        <Phone
          x={770}
          y={lerp(1980, 760, phoneIn) - lilt(f) * 4 + Math.sin(f / 16) * 4}
          rotate={6}
          scale={0.8}
          screen={
            <g>
              <AppBar w={PHONE_SCREEN.w} title="Gallery" size={18} />
              <g transform="translate(18 66)">
                <Blanket rows={ROWS} colors={PALETTE} width={PHONE_SCREEN.w - 36} height={250} orientation="columns" texture={0} radius={8} />
              </g>
              <text x={18} y={362} fontFamily={FONT.display} fontWeight={600} fontSize={28} fill={INK}>
                My Town 2025
              </text>
              <text x={18} y={396} fontFamily={FONT.body} fontSize={17} fill={INK} opacity={0.7}>
                By you · {views.toLocaleString('en-US')} views
              </text>
              <g transform={`translate(18 420) scale(${updated})`} opacity={Math.min(1, updated)}>
                <rect width={136} height={40} rx={20} fill={TONE.honey} opacity={0.9} />
                <path d="M 28 20 a 9 9 0 1 1 -3 -7 m 3 -5 l 0 6 l -6 0" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
                <text x={46} y={27} fontFamily={FONT.body} fontWeight={600} fontSize={18} fill={INK}>
                  Updated
                </text>
              </g>
              {[0, 1, 2].map((k) => (
                <rect key={k} x={18 + k * 82} y={472} width={72} height={60} rx={10} fill={[TONE.blush, TONE.sky, TONE.butter][k]} opacity={0.8} />
              ))}
            </g>
          }
        />
      )}
    </svg>
  );
};
