import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { FONT, FPS } from './brand';
import { clamp, tween } from './components/anim';
import { AndMore } from './scenes/AndMore';
import { EndCard } from './scenes/EndCard';
import { GalleryWall } from './scenes/GalleryWall';
import { Hook } from './scenes/Hook';
import { NewDays } from './scenes/NewDays';
import { Pdf } from './scenes/Pdf';
import { PhotoPalette } from './scenes/PhotoPalette';
import { PlanIt } from './scenes/PlanIt';
import { Ravelry } from './scenes/Ravelry';
import { Sync } from './scenes/Sync';
import {
  BEAT_COUNT,
  MUSIC_START_FRAME,
  Cue,
  SceneId,
  TAIL,
  TOTAL,
  beatFrame,
  cueFor,
  sceneSpans,
} from './timing';

// Frames the next scene starts early, so it's fully in on the downbeat
const LEAD = 5;

const render = (id: SceneId, cue: Cue): React.ReactNode => {
  switch (id) {
    case 'hook':
      return <Hook />;
    case 'plan':
      return <PlanIt cue={cue} />;
    case 'photo':
      return <PhotoPalette />;
    case 'newDays':
      return <NewDays cue={cue} />;
    case 'sync':
      return <Sync cue={cue} />;
    case 'gallery':
      return <GalleryWall />;
    case 'ravelry':
      return <Ravelry cue={cue} />;
    case 'pdf':
      return <Pdf cue={cue} />;
    case 'more':
      return <AndMore cue={cue} />;
    case 'end':
      // The end card's first 10 frames are a pause; start past them
      return (
        <Sequence from={-10} layout="none">
          <EndCard />
        </Sequence>
      );
  }
};

/** A rough camera push between scenes: the new one settles in from a little closer */
const Shot: React.FC<{ children: React.ReactNode; first: boolean }> = ({
  children,
  first,
}) => {
  const f = useCurrentFrame();
  if (first) return <AbsoluteFill>{children}</AbsoluteFill>;
  const t = tween(f, 0, LEAD + 4, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill
      style={{
        opacity: t,
        transform: `scale(${1.06 - 0.06 * t})`,
        filter: t < 1 ? `blur(${(1 - t) * 10}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Flashes on every beat (big on downbeats), with the scene's name: to check the sync by ear */
const BeatDebug: React.FC = () => {
  const f = useCurrentFrame();
  let b = 0;
  while (b + 1 < BEAT_COUNT + 12 && beatFrame(b + 1) <= f) b++;
  const since = f - beatFrame(b);
  const on = f >= beatFrame(0) ? Math.max(0, 1 - since / 6) : 0;
  const down = b % 4 === 0;
  const scene = [...sceneSpans()].reverse().find((s) => f >= s.from);
  return (
    <div
      style={{
        position: 'absolute',
        left: 30,
        top: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: FONT.body,
        fontSize: 24,
        color: '#fff',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 99,
          background: down ? '#ff4d4d' : '#ffd23f',
          opacity: 0.25 + on * 0.75,
          transform: `scale(${(down ? 1.2 : 0.8) + on * 0.4})`,
        }}
      />
      <div
        style={{
          background: 'rgba(0,0,0,0.6)',
          padding: '4px 12px',
          borderRadius: 8,
        }}
      >
        bar {Math.floor(b / 4) + 1}.{(b % 4) + 1} · {scene?.id} ·{' '}
        {(f / FPS).toFixed(2)}s
      </div>
    </div>
  );
};

export const Main45: React.FC<{ showBeats?: boolean }> = ({
  showBeats = false,
}) => {
  const spans = sceneSpans();
  const tailAt = beatFrame(TAIL.atBeat);
  const X = 6; // crossfade frames into the tail
  return (
    <AbsoluteFill style={{ background: '#0c1322' }}>
      {spans.map((s, i) => {
        const from = i === 0 ? 0 : s.from - LEAD;
        const dur =
          (i === 0 ? s.dur : s.dur + LEAD) +
          (i < spans.length - 1 ? LEAD + 4 : 0);
        return (
          <Sequence key={s.id} from={from} durationInFrames={dur} name={s.id}>
            <Shot first={i === 0}>{render(s.id, cueFor(s.beat, from))}</Shot>
          </Sequence>
        );
      })}
      {showBeats && <BeatDebug />}

      {/* The song from just before its first note, then its own ending spliced in on the end card's downbeat */}
      <Sequence durationInFrames={tailAt + X}>
        <Audio
          src={staticFile('music.mp3')}
          trimBefore={MUSIC_START_FRAME}
          volume={(f) => interpolate(f, [tailAt, tailAt + X], [0.9, 0], clamp)}
        />
      </Sequence>
      <Sequence from={tailAt}>
        <Audio
          src={staticFile('music.mp3')}
          trimBefore={Math.round(TAIL.start * FPS)}
          volume={(f) =>
            interpolate(
              f,
              [0, X, TOTAL - tailAt - 12, TOTAL - tailAt],
              [0, 0.6, 0.6, 0],
              clamp,
            )
          }
        />
      </Sequence>
    </AbsoluteFill>
  );
};
