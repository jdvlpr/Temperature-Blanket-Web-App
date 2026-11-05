import React from 'react';
import {
  Audio,
  Series,
  staticFile,
  interpolate,
  useVideoConfig,
} from 'remotion';
import { EndCard } from './scenes/EndCard';
import { GalleryWall } from './scenes/GalleryWall';
import { Hook } from './scenes/Hook';
import { PhotoPalette } from './scenes/PhotoPalette';

// The four styleframe scenes back to back with the music, to judge motion
// before the animatic (no transitions yet: those come with the camera moves)
export const MotionTest: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  return (
    <>
      <Series>
        <Series.Sequence durationInFrames={150}>
          <Hook />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <PhotoPalette />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <GalleryWall />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <EndCard />
        </Series.Sequence>
      </Series>
      <Audio
        src={staticFile('music.mp3')}
        volume={(f) =>
          interpolate(
            f,
            [0, 15, durationInFrames - 45, durationInFrames],
            [0, 0.9, 0.9, 0],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            },
          )
        }
      />
    </>
  );
};
