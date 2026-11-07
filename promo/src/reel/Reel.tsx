import React from 'react';
import { AbsoluteFill, Audio, Sequence, getStaticFiles, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { clamp } from '../components/anim';
import { Caption } from './parts/Caption';
import { Clouds } from './parts/Clouds';
import { Hills } from './parts/Hills';
import { Foreground } from './parts/Foreground';
import { InkDefs } from './parts/InkDefs';
import { PaperDefs } from './parts/PaperKit';
import { Leaves } from './parts/Leaves';
import { Paper } from './parts/Paper';
import { Sky } from './parts/Sky';
import { GroundBlanket, HeroBall, MonthTags, Strand, TAG_FRAMES } from './parts/Year';
import { End } from './panels/End';
import { NextFall } from './panels/NextFall';
import { October } from './panels/October';
import { Stitches } from './panels/Stitches';
import { Summer } from './panels/Summer';
import { SFX } from './sfx';
import { FONT, PAPER, RW } from './theme';
import { MUSIC_START_FRAME, PANEL, TOTAL, bar, barAt, beatFrame, cameraX, seasonAt, toMusicBar } from './timing';

/** Panels, each drawn only while it's near the camera */
const PANELS: { x: number; w: number; C: React.FC<{ f: number }> }[] = [
  { x: PANEL.october, w: 1080, C: October },
  { x: PANEL.stitches, w: 1080, C: Stitches },
  { x: PANEL.summer, w: 1080, C: Summer },
  { x: PANEL.nextFall, w: 1080, C: NextFall },
];

const CUES = [
  ...SFX.map((s) => ({ ...s, frame: Math.round(bar(s.at)) })),
  ...TAG_FRAMES.map((frame) => ({ name: 'tag-pop', at: barAt(frame), volume: 0.2, frame })),
];

const SoundEffects: React.FC = () => {
  const have = new Set(getStaticFiles().map((s) => s.name));
  return (
    <>
      {CUES.filter((c) => have.has(`sfx/${c.name}.mp3`)).map((c, i) => (
        <Sequence key={i} from={c.frame} name={`sfx ${c.name}`}>
          <Audio src={staticFile(`sfx/${c.name}.mp3`)} volume={c.volume} />
        </Sequence>
      ))}
    </>
  );
};

export const Reel: React.FC<{ showBeats?: boolean; audio?: boolean }> = ({ showBeats = false, audio = true }) => {
  const f = useCurrentFrame();
  const camX = cameraX(f);
  const season = seasonAt(camX + RW / 2);
  const fadeAt = bar(41);
  // The shutter's light over the whole frame
  const flash = interpolate(f - bar(2), [0, 2, 10], [0, 0.35, 0], clamp);
  return (
    <AbsoluteFill style={{ background: PAPER, overflow: 'hidden' }}>
      <InkDefs />
      <PaperDefs />
      <Sky season={season} />
      <Clouds f={f} camX={camX} />
      <Hills camX={camX} />
      <AbsoluteFill style={{ transform: `translateX(${-camX}px)` }}>
        {PANELS.filter((p) => p.x < camX + RW + 200 && p.x + p.w > camX - 200).map(({ x, C }) => (
          <C key={x} f={f} />
        ))}
        <MonthTags f={f} />
        <GroundBlanket f={f} />
        <Strand f={f} />
        <HeroBall f={f} />
      </AbsoluteFill>
      <Foreground camX={camX} />
      <End f={f} />
      <Leaves f={f} camX={camX} fall={leafFall(f)} />
      <Caption f={f} lines={['Start with a', 'favorite fall day']} inBar={0.5} outBar={6.9} />
      <Caption f={f} lines={['Add new days', 'as your year goes on']} inBar={13.6} outBar={19.6} />
      <Caption f={f} lines={['On every device']} inBar={21.4} outBar={25.7} />
      <Caption f={f} lines={['Share it.', 'Update it anytime.']} inBar={27.6} outBar={31.9} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      <Paper />
      {showBeats && <BeatDebug f={f} />}
      {audio && (
        <>
          <Audio
            src={staticFile('waltz.mp3')}
            trimBefore={MUSIC_START_FRAME}
            volume={(t) => interpolate(t, [fadeAt, TOTAL - 4], [0.9, 0], clamp)}
          />
          <SoundEffects />
        </>
      )}
    </AbsoluteFill>
  );
};

/**
 * How far the leaves have fallen by frame f, in frames of normal speed: they
 * slow to 35% over the end card. The slowdown is integrated (not speed × time),
 * so they keep falling and never drift back up.
 */
const leafFall = (f: number) => {
  const a = bar(35);
  const b = bar(40);
  const k = 0.65; // how much slower they get
  if (f <= a) return f;
  if (f <= b) return f - (k * (f - a) ** 2) / (2 * (b - a));
  return a + (b - a) * (1 - k / 2) + (1 - k) * (f - b);
};

/** A dot on every beat (big and red on each bar's first), the bar number, and sound cues as they fire */
const BeatDebug: React.FC<{ f: number }> = ({ f }) => {
  const b = toMusicBar(barAt(f));
  const beat = Math.floor(b * 3 + 1e-6);
  const since = f - beatFrame(beat);
  const on = b >= 0 ? Math.max(0, 1 - since / 6) : 0;
  const down = beat % 3 === 0;
  const cue = CUES.filter((c) => f >= c.frame && f < c.frame + 12).map((c) => c.name);
  return (
    <div style={{ position: 'absolute', left: 40, top: 40, display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONT.body, fontSize: 30, color: '#fff' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 99,
          background: down ? '#ff4d4d' : '#ffd23f',
          opacity: 0.25 + on * 0.75,
          transform: `scale(${(down ? 1.25 : 0.75) + on * 0.4})`,
        }}
      />
      <div style={{ background: 'rgba(0,0,0,0.6)', padding: '6px 14px', borderRadius: 8 }}>
        bar {Math.floor(b) + 1}.{(beat % 3) + 1} · {(f / 30).toFixed(2)}s{cue.length ? ` · ♪ ${cue.join(', ')}` : ''}
      </div>
    </div>
  );
};
