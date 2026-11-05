"""Beat grid for the music, printed as JSON for src/data/beats.json.

Run once, then check by ear in the studio (the Animatic45Debug composition
flashes a dot on every beat). Needs ffmpeg and numpy:

    python3 -m venv /tmp/beats-venv && /tmp/beats-venv/bin/pip install numpy
    /tmp/beats-venv/bin/python -I scripts/beats.py public/music.mp3

Spectral-flux onsets. The head (what the video plays) is beat-tracked from the
first note, since the tempo wanders a little; the tail (the final cadence,
spliced under the end card) gets a steady grid. The downbeat is a judgement
call: the accents are weak, so hand-check it and change `shift` in
src/data/beats.json if every cut feels early or late.
"""

import json
import subprocess
import sys

import numpy as np

SR = 22050
HOP = 256
WIN = 1024
FR = SR / HOP

raw = subprocess.run(
    ['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
    capture_output=True,
).stdout
x = np.frombuffer(raw, dtype=np.float32)
n = (len(x) - WIN) // HOP
frames = np.lib.stride_tricks.as_strided(x, (n, WIN), (x.strides[0] * HOP, x.strides[0]))
S = np.log1p(100 * np.abs(np.fft.rfft(frames * np.hanning(WIN), axis=1)))
flux = np.maximum(0, np.diff(S, axis=0)).sum(1)
flux = (flux - flux.mean()) / flux.std()


def peak(t):
    i = int(t * FR)
    return flux[max(0, i - 1) : i + 2].max()


def track(seed, end, p):
    """Beats forward from `seed`: predict, then snap halfway to a strong onset nearby."""
    beats = [seed]
    while beats[-1] + p < end:
        pred = beats[-1] + p
        near = onsets[np.abs(onsets - pred) < 0.06]
        nb = 0.5 * pred + 0.5 * near[np.argmax([flux[int(t * FR)] for t in near])] if len(near) else pred
        p = 0.85 * p + 0.15 * (nb - beats[-1])
        beats.append(nb)
    return beats


def fit(a, b):
    """Best steady period and phase for beats between a and b seconds."""
    best = None
    for p in np.arange(0.60, 0.65, 0.0005):
        for off in np.arange(0, p, 0.005):
            ts = a + off + np.arange(0, int((b - a - 0.7) / p)) * p
            s = sum(peak(t) for t in ts)
            if best is None or s > best[0]:
                best = (s, p, a + off)
    return float(best[1]), float(best[2])


peaks = [i for i in range(1, len(flux) - 1) if flux[i] > 1.0 and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]]
onsets = np.array(peaks) / FR
# The music's first note (its loudest onset in the first two seconds) is beat 0, a downbeat.
# The piece moves in steady eighth notes, so a tracker can lock onto the off-beats; anchoring
# to the first note keeps the phase, and the debug composition shows it.
first = onsets[onsets < 2][np.argmax([flux[int(t * FR)] for t in onsets[onsets < 2]])]
head = track(float(first), 50, 0.628)
tail_p, tail_t0 = fit(98, 113.5)
dur = len(x) / SR
rms = [float(np.sqrt((x[int(t * SR) : int((t + 0.1) * SR)] ** 2).mean())) for t in np.arange(0, dur - 0.1, 0.1)]
silent = next(i for i in range(len(rms) - 1, 0, -1) if rms[i] > 0.15) * 0.1
tail_beats = tail_t0 + np.arange(0, int((silent - tail_t0) / tail_p) + 1) * tail_p
# The final cadence: the last strong hit before the track falls silent
final_hit = float(max(t for t in tail_beats if t <= silent and peak(t) > 3))

print(
    json.dumps(
        {
            'beats': [round(float(t), 4) for t in head],
            'tail': {'period': round(tail_p, 5), 'finalHit': round(final_hit, 4)},
            'duration': round(dur, 3),
        }
    )
)
