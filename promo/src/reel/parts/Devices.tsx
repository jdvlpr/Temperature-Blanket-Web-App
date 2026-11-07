import React from 'react';
import { Cut, rrect } from './PaperKit';

const PW = 300;
const PH = 610;
const BODY = '#3b3330';
/** The strip above the app on a phone, so its camera notch never covers the app */
const STATUS = 38;

/**
 * A phone, floating on its own (centered on x, y). `screen` is drawn in the
 * screen's box (PW-28 × PH-28, origin at its top left). `seeThrough`: a camera
 * viewfinder, only the body's frame, the world showing through.
 */
export const Phone: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  screen?: React.ReactNode;
  screenFill?: string;
  seeThrough?: boolean;
}> = ({ x, y, scale = 1, rotate = 0, screen, screenFill = '#fffaf2', seeThrough = false }) => {
  const sw = PW - 28;
  const sh = PH - 28;
  const outer = rrect(-PW / 2, -PH / 2, PW, PH, 46);
  const inner = rrect(-sw / 2, -sh / 2, sw, sh, 34);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <Cut depth={3}>
        <path d={seeThrough ? `${outer} ${inner}` : outer} fillRule="evenodd" fill={BODY} />
      </Cut>
      <rect x={PW / 2 - 2} y={-PH / 2 + 120} width={5} height={60} rx={2} fill={BODY} />
      <svg x={-sw / 2} y={-sh / 2} width={sw} height={sh} viewBox={`0 0 ${sw} ${sh}`}>
        <defs>
          <clipPath id="phone-screen">
            <rect width={sw} height={sh} rx={34} />
          </clipPath>
        </defs>
        <g clipPath="url(#phone-screen)">
          <rect width={sw} height={sh} fill={screenFill} />
          {seeThrough ? (
            screen
          ) : (
            <>
              <rect width={sw} height={STATUS} fill="#f3ead9" />
              <g transform={`translate(0 ${STATUS})`}>{screen}</g>
            </>
          )}
          {/* A soft sheen across the glass */}
          <path d={`M ${sw * 0.55} 0 L ${sw} 0 L ${sw} ${sh * 0.35} Z`} fill="#fff" opacity={seeThrough ? 0 : 0.08} />
        </g>
      </svg>
      <rect x={-28} y={-PH / 2 + 24} width={56} height={14} rx={7} fill={BODY} />
    </g>
  );
};
/** The app's area on a phone screen (below the status strip) */
export const PHONE_SCREEN = { w: PW - 28, h: PH - 28 - STATUS };

const LW = 560;
const LH = 360;
/** A laptop on its base, the screen's box LW-40 × LH-40 */
export const Laptop: React.FC<{ x: number; y: number; scale?: number; screen?: React.ReactNode }> = ({
  x,
  y,
  scale = 1,
  screen,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <Cut depth={2}>
      <path d={rrect(-LW / 2, -LH, LW, LH, 24)} fill="#4a403a" />
    </Cut>
    <svg x={-LW / 2 + 20} y={-LH + 20} width={LW - 40} height={LH - 40}>
      <rect width={LW - 40} height={LH - 40} rx={8} fill="#fffaf2" />
      {screen}
    </svg>
    <Cut depth={2}>
      <path d={`M ${-LW / 2 - 40} 0 L ${LW / 2 + 40} 0 L ${LW / 2 + 64} 22 Q ${LW / 2 + 66} 30 ${LW / 2 + 56} 30 L ${-LW / 2 - 56} 30 Q ${-LW / 2 - 66} 30 ${-LW / 2 - 64} 22 Z`} fill="#d8cdbf" />
    </Cut>
    <rect x={-60} y={2} width={120} height={9} rx={4.5} fill="#bfb2a2" />
  </g>
);
export const LAPTOP_SCREEN = { w: LW - 40, h: LH - 40 };
