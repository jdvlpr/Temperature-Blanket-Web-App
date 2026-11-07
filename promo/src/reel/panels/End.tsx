import React from 'react';
import { AbsoluteFill } from 'remotion';
import { pop } from '../../components/anim';
import { LogoMark } from '../../components/LogoMark';
import { FONT, INK, RW, TONE } from '../theme';
import { bar } from '../timing';

/** The end card: drawn in screen space, after the camera arrives at the blanket's end */
export const End: React.FC<{ f: number }> = ({ f }) => {
  if (f < bar(33)) return null;
  const logo = pop(f, bar(33.5), 11, 130);
  const name = pop(f, bar(34), 14, 120);
  const beta = pop(f, bar(34.67), 14, 120);
  const url = pop(f, bar(35.33), 12, 140);
  const rise = (s: number) => ({
    opacity: Math.min(1, s),
    transform: `translateY(${(1 - s) * 30}px)`,
  });
  return (
    <AbsoluteFill style={{ alignItems: 'center', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 560, width: RW, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ transform: `scale(${logo}) rotate(${(1 - logo) * -12}deg)` }}>
          <LogoMark size={210} shadow="drop-shadow(0 14px 22px rgba(90,63,44,0.22))" />
        </div>
        <div style={{ ...rise(name), marginTop: 48, fontFamily: FONT.display, fontWeight: 600, fontSize: 86, color: INK, letterSpacing: '-0.02em' }}>
          Temperature Blanket
        </div>
        <div style={{ ...rise(beta), marginTop: 14, fontFamily: FONT.display, fontStyle: 'italic', fontSize: 52, lineHeight: 1.15, color: TONE.russet, textAlign: 'center' }}>
          Try the next version
          <br />
          and share your feedback
        </div>
        <div
          style={{
            ...rise(url),
            marginTop: 44,
            padding: '18px 36px',
            borderRadius: 999,
            background: TONE.honey,
            border: `4px solid ${INK}`,
            fontFamily: FONT.body,
            fontWeight: 600,
            fontSize: 38,
            color: INK,
          }}
        >
          next.temperature-blanket.com
        </div>
      </div>
    </AbsoluteFill>
  );
};
