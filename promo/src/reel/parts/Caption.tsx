import React from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { clamp } from '../../components/anim';
import { FONT, INK, SAFE } from '../theme';
import { bar } from '../timing';

/**
 * Words drift up one by one in Fraunces italic, then leave together.
 * Sits just under the Reels' top safe area.
 */
export const Caption: React.FC<{
  f: number;
  lines: string[];
  inBar: number;
  outBar: number;
  top?: number;
  size?: number;
}> = ({ f, lines, inBar, outBar, top = SAFE.top + 70, size = 70 }) => {
  const a = bar(inBar);
  const z = bar(outBar);
  if (f < a - 2 || f > z + 14) return null;
  const leave = interpolate(f, [z, z + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  let w = 0;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top,
          left: SAFE.left,
          right: SAFE.right,
          textAlign: 'center',
          fontFamily: FONT.display,
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: size,
          lineHeight: 1.12,
          letterSpacing: '-0.01em',
          color: INK,
          opacity: 1 - leave,
          transform: `translateY(${-leave * 24}px)`,
        }}
      >
        {lines.map((line, li) => (
          <div key={li}>
            {line.split(' ').map((word, wi) => {
              const t = interpolate(f, [a + w * 3, a + w * 3 + 16], [0, 1], {
                ...clamp,
                easing: Easing.out(Easing.cubic),
              });
              w++;
              return (
                <span
                  key={wi}
                  style={{
                    display: 'inline-block',
                    marginRight: '0.26em',
                    opacity: t,
                    transform: `translateY(${(1 - t) * 26}px)`,
                    filter: t < 1 ? `blur(${(1 - t) * 6}px)` : undefined,
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
