import React from 'react';
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { COLOR, FONT } from '../brand';

export type CaptionLine = { text: string; italic?: boolean; color?: string };

/**
 * Words rise in one by one (a spring each, a little blur falling away), and
 * the last line gets a yarn underline that stitches itself in.
 */
export const KineticCaption: React.FC<{
  lines: CaptionLine[];
  start: number;
  size?: number;
  align?: 'left' | 'center';
  stagger?: number;
  underline?: boolean;
  out?: number; // frame to leave
}> = ({
  lines,
  start,
  size = 92,
  align = 'left',
  stagger = 3,
  underline = true,
  out,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let w = 0;
  const leave =
    out === undefined
      ? 0
      : interpolate(frame, [out, out + 10], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.in(Easing.cubic),
        });
  const totalWords = lines.reduce((n, l) => n + l.text.split(' ').length, 0);
  const lineDone = start + totalWords * stagger + 6;
  const draw = interpolate(frame, [lineDone, lineDone + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <div
      style={{
        fontFamily: FONT.display,
        color: COLOR.cream,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: '-0.02em',
        textAlign: align,
        opacity: 1 - leave,
        transform: `translateY(${-leave * 30}px)`,
      }}
    >
      {lines.map((line, li) => (
        <div
          key={li}
          style={{
            position: 'relative',
            display: 'block',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ position: 'relative', display: 'inline-block' }}>
            {line.text.split(' ').map((word, wi) => {
              const k = w++;
              const s = spring({
                frame: frame - start - k * stagger,
                fps,
                config: { damping: 16, mass: 0.7, stiffness: 140 },
              });
              return (
                <span
                  key={wi}
                  style={{
                    display: 'inline-block',
                    marginRight: '0.24em',
                    fontStyle: line.italic ? 'italic' : 'normal',
                    fontWeight: line.italic ? 400 : 600,
                    color: line.color ?? COLOR.cream,
                    opacity: s,
                    transform: `translateY(${(1 - s) * 0.55}em) rotate(${(1 - s) * 4}deg)`,
                    filter: `blur(${(1 - s) * 10}px)`,
                  }}
                >
                  {word}
                </span>
              );
            })}
            {underline && li === lines.length - 1 && (
              <svg
                width="100%"
                height={size * 0.3}
                viewBox="0 0 400 30"
                preserveAspectRatio="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: -size * 0.2,
                  overflow: 'visible',
                }}
              >
                <path
                  d="M2 18 C 30 6, 52 28, 80 16 S 130 6, 160 17 S 214 28, 240 15 S 300 5, 330 16 S 376 26, 396 12"
                  fill="none"
                  stroke={COLOR.amber}
                  strokeWidth={5}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset={1 - draw}
                  opacity={draw > 0 ? 1 : 0}
                />
              </svg>
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

/** A small label in the body font, e.g. "Minneapolis · 2025 · daily highs" */
export const Eyebrow: React.FC<{
  children: React.ReactNode;
  start: number;
  color?: string;
}> = ({ children, start, color = COLOR.amber }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [start, start + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        fontFamily: FONT.body,
        fontWeight: 600,
        fontSize: 24,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color,
        opacity: t,
        transform: `translateX(${(1 - t) * -20}px)`,
      }}
    >
      {children}
    </div>
  );
};
