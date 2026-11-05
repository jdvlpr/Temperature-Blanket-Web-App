import React from 'react';

/**
 * A laptop or phone around a screen of `w`×`h` px. Place and tilt it with
 * `style` (it keeps 3D for its children). `lift` is drawn over the screen,
 * unclipped, so a control can rise out of it with translateZ.
 */
export const DeviceFrame: React.FC<{
  kind: 'laptop' | 'phone';
  w: number;
  h: number;
  children: React.ReactNode;
  lift?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ kind, w, h, children, lift, style }) => {
  const laptop = kind === 'laptop';
  const pad = laptop ? 22 : 14;
  const r = laptop ? 22 : 56;
  return (
    <div
      style={{ position: 'absolute', transformStyle: 'preserve-3d', ...style }}
    >
      <div
        style={{
          position: 'relative',
          width: w + pad * 2,
          height: h + pad * 2 + (laptop ? 12 : 0),
          borderRadius: r,
          background: 'linear-gradient(160deg, #2a3348, #0b0f18 40%)',
          boxShadow:
            '0 60px 120px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.08)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: pad,
            top: pad,
            width: w,
            height: h,
            borderRadius: laptop ? 6 : r - pad,
            overflow: 'hidden',
            background: '#f7f4ee',
          }}
        >
          {children}
        </div>
        {laptop ? (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 8,
              width: 8,
              height: 8,
              marginLeft: -4,
              borderRadius: 9,
              background: '#3a455c',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: pad + 12,
              width: w * 0.3,
              height: 26,
              marginLeft: -w * 0.15,
              borderRadius: 20,
              background: '#05070c',
            }}
          />
        )}
        {lift && (
          <div
            style={{
              position: 'absolute',
              left: pad,
              top: pad,
              width: w,
              height: h,
              transformStyle: 'preserve-3d',
            }}
          >
            {lift}
          </div>
        )}
      </div>
      {laptop && (
        <div
          style={{
            width: w + pad * 2 + 160,
            height: 26,
            marginLeft: -80,
            borderRadius: '4px 4px 22px 22px',
            background: 'linear-gradient(180deg, #c9ced8, #7d8596)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          }}
        />
      )}
    </div>
  );
};
