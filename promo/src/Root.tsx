import React from 'react';
import { Composition } from 'remotion';
import { FPS, H, W } from './brand';
import { Hook } from './scenes/Hook';
import { PhotoPalette } from './scenes/PhotoPalette';
import { GalleryWall } from './scenes/GalleryWall';
import { EndCard } from './scenes/EndCard';
import { MotionTest } from './MotionTest';
import { Main45 } from './Main45';
import { TOTAL } from './timing';
import { PlanIt } from './scenes/PlanIt';
import { NewDays } from './scenes/NewDays';
import { Sync } from './scenes/Sync';
import { Ravelry } from './scenes/Ravelry';
import { Pdf } from './scenes/Pdf';
import { AndMore } from './scenes/AndMore';
import { Reel } from './reel/Reel';
import { MapleStill } from './reel/MapleStill';
import { RH, RW } from './reel/theme';
import { TOTAL as REEL_TOTAL } from './reel/timing';

const scene = (id: string, component: React.FC, frames: number) => (
  <Composition
    key={id}
    id={id}
    component={component}
    durationInFrames={frames}
    fps={FPS}
    width={W}
    height={H}
  />
);

export const Root: React.FC = () => (
  <>
    {/* The Instagram Reel (src/reel/): 1080×1920 */}
    <Composition
      id="Reel"
      component={Reel}
      durationInFrames={REEL_TOTAL}
      fps={FPS}
      width={RW}
      height={RH}
      defaultProps={{ showBeats: false, audio: true }}
    />
    <Composition
      id="ReelDebug"
      component={Reel}
      durationInFrames={REEL_TOTAL}
      fps={FPS}
      width={RW}
      height={RH}
      defaultProps={{ showBeats: true, audio: true }}
    />
    <Composition
      id="ReelMaple"
      component={MapleStill}
      durationInFrames={1}
      fps={FPS}
      width={800}
      height={800}
    />
    <Composition
      id="Animatic45"
      component={Main45}
      durationInFrames={TOTAL}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{ showBeats: false }}
    />
    <Composition
      id="Animatic45Debug"
      component={Main45}
      durationInFrames={TOTAL}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{ showBeats: true }}
    />
    {scene('PlanIt', PlanIt, 150)}
    {scene('NewDays', NewDays, 115)}
    {scene('Sync', Sync, 115)}
    {scene('Ravelry', Ravelry, 115)}
    {scene('Pdf', Pdf, 115)}
    {scene('AndMore', AndMore, 80)}
    <Composition
      id="Hook"
      component={Hook}
      durationInFrames={150}
      fps={FPS}
      width={W}
      height={H}
    />
    <Composition
      id="PhotoPalette"
      component={PhotoPalette}
      durationInFrames={150}
      fps={FPS}
      width={W}
      height={H}
    />
    <Composition
      id="GalleryWall"
      component={GalleryWall}
      durationInFrames={150}
      fps={FPS}
      width={W}
      height={H}
    />
    <Composition
      id="EndCard"
      component={EndCard}
      durationInFrames={180}
      fps={FPS}
      width={W}
      height={H}
    />
    <Composition
      id="MotionTest"
      component={MotionTest}
      durationInFrames={630}
      fps={FPS}
      width={W}
      height={H}
    />
  </>
);
