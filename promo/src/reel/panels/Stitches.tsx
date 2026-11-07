import React from 'react';
import { Easing, interpolate } from 'remotion';
import { clamp, pop } from '../../components/anim';
import hero from '../../data/hero.json';
import { FONT, INK, TONE } from '../theme';
import { Cut, Stitches as Sew, scallop } from '../parts/PaperKit';
import { bar, lilt } from '../timing';

/** A place: a felt map, sewn on, and a paper pin dropping onto it as the camera arrives */
export const Stitches: React.FC<{ f: number }> = ({ f }) => {
  const cx = 540;
  const cy = 590;
  const map = pop(f, bar(8.5), 13, 110);
  const drop = interpolate(f, [bar(9), bar(9.4)], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const squash = pop(f, bar(9.4), 9, 220);
  const label = pop(f, bar(9.8), 14, 140);
  const pinY = cy - 40 - (1 - drop) * 520 - (drop >= 1 ? lilt(f) * 6 : 0);
  const land = scallop(cx, cy, 270, 150, 11, 0.1, 1.3);
  const lake = `M ${cx + 30} ${cy - 70} c 50 -26 120 -14 130 22 c 10 34 -40 58 -90 46 c -50 -10 -72 -46 -40 -68 Z`;
  const river = `M ${cx - 230} ${cy + 50} C ${cx - 120} ${cy - 10} ${cx - 20} ${cy + 70} ${cx + 60} ${cy + 20} S ${cx + 160} ${cy - 30} ${cx + 160} ${cy - 30}`;
  return (
    <svg style={{ position: 'absolute', left: 1080, top: 0, overflow: 'visible' }} width={1080} height={1920}>
      <g transform={`translate(${cx} ${cy}) scale(${map}) rotate(${(1 - map) * -6}) translate(${-cx} ${-cy})`} opacity={Math.min(1, map * 2)}>
        <Cut depth={2}>
          <path d={land} fill="#b9c99a" />
        </Cut>
        <Sew d={scallop(cx, cy, 252, 134, 11, 0.1, 1.3)} />
        <Cut depth={1}>
          <path d={river} fill="none" stroke="#8fb6d2" strokeWidth={14} strokeLinecap="round" />
          <path d={lake} fill="#8fb6d2" />
        </Cut>
        <Sew d={lake} width={2.5} />
      </g>
      {drop > 0 && (
        <g transform={`translate(${cx} ${pinY}) scale(${1 + (1 - squash) * 0.18} ${1 - (1 - squash) * 0.18})`}>
          <ellipse cy={56} rx={24 * drop} ry={8 * drop} fill="#5a3f2c" opacity={0.18} />
          <Cut depth={3}>
            <path d="M 0 54 C -12 30 -42 6 -42 -24 A 42 42 0 1 1 42 -24 C 42 6 12 30 0 54 Z" fill={TONE.russet} />
            <circle cy={-24} r={15} fill={TONE.white} />
          </Cut>
        </g>
      )}
      <g opacity={Math.min(1, label)} transform={`translate(${cx} ${cy + 230}) scale(${0.9 + 0.1 * label})`}>
        <text textAnchor="middle" fontFamily={FONT.display} fontStyle="italic" fontSize={60} fill={INK}>
          {hero.location.short}
        </text>
        <text y={52} textAnchor="middle" fontFamily={FONT.body} fontWeight={600} fontSize={28} letterSpacing="0.22em" fill={TONE.russet}>
          2025
        </text>
      </g>
    </svg>
  );
};
