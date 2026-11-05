import React from 'react';
import {
  AbsoluteFill,
  getStaticFiles,
  OffthreadVideo,
  staticFile,
} from 'remotion';
import { FONT } from '../brand';

/**
 * Where real UI footage goes. Until `public/footage/<name>` exists (the
 * footage step records it), the drawn stand-in shows, tagged with the clip it
 * waits for. Once the file is there, the clip plays instead: nothing else
 * changes. The clip plays on its parent's clock, so a slot that appears
 * partway through a scene sits in a <Sequence from={...}> starting there.
 */
export const FootageSlot: React.FC<{
  name: string;
  children: React.ReactNode;
  /** Seconds into the clip to start */
  start?: number;
  tag?: boolean;
}> = ({ name, children, start = 0, tag = true }) => {
  const path = `footage/${name}`;
  const have = getStaticFiles().some((f) => f.name === path);
  if (have) {
    return (
      <OffthreadVideo
        src={staticFile(path)}
        muted
        trimBefore={Math.round(start * 30)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }
  return (
    <AbsoluteFill>
      {children}
      {tag && (
        <div
          style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            padding: '4px 10px',
            borderRadius: 6,
            background: 'rgba(242,164,58,0.92)',
            color: '#1b1306',
            fontFamily: FONT.body,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          FOOTAGE · {name}
        </div>
      )}
    </AbsoluteFill>
  );
};
