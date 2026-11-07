import React from 'react';
import { AbsoluteFill } from 'remotion';
import { PaperDefs } from './parts/PaperKit';
import { Maple, PHOTO } from './panels/October';

/** The October photo on its own: rendered to scripts/fixtures/maple.png for the palette engine */
export const MapleStill: React.FC = () => (
  <AbsoluteFill style={{ background: '#f2e1c6' }}>
    <PaperDefs />
    <svg width={PHOTO.size} height={PHOTO.size} viewBox={`${PHOTO.x} ${PHOTO.y} ${PHOTO.size} ${PHOTO.size}`}>
      <Maple f={0} still />
    </svg>
  </AbsoluteFill>
);
