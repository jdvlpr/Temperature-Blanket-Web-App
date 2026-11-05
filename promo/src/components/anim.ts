import { Easing, interpolate, spring } from 'remotion';
import { FPS } from '../brand';

export const clamp = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

/** 0..1 between frames a and b, eased (in-out cubic by default) */
export const tween = (
  f: number,
  a: number,
  b: number,
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
) => interpolate(f, [a, b], [0, 1], { ...clamp, easing });

export const pop = (f: number, at: number, damping = 14, stiffness = 140) =>
  spring({ frame: f - at, fps: FPS, config: { damping, stiffness } });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
