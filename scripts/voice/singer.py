"""
The live singer, in Python: the same algorithm the app runs (src/audio/voiceSinger.ts), used to check it offline.

Notes arrive one at a time (start, length, pitch, velocity), as the playback engine sends them. Each note adds one
pulse per period of its pitch curve; the curve glides from the previous note when they touch, and the vibrato fades
in after the onset and carries its phase across a legato join. Colour blends from the previous note's pulses over
BLEND seconds.
"""
import json
import numpy as np

VIB_RATE, VIB_DEPTH, VIB_DELAY, VIB_RISE = 5.4, 0.32, 0.22, 0.35
GLIDE, BLEND, ATTACK, RELEASE = 0.07, 0.05, 0.04, 0.09
LEGATO = 0.06  # a note starting within this of the last one's end is joined to it


class Bank:
    def __init__(self, json_path, bin_path):
        self.meta = json.load(open(json_path))
        raw = np.fromfile(bin_path, dtype="<i2").astype(np.float32)
        R, G = self.meta["pulse"], self.meta["noise"]
        self.notes = []
        for n in self.meta["notes"]:
            p = raw[n["pulses"]: n["pulses"] + n["frames"] * R].reshape(n["frames"], R) * n["scale"]
            g = raw[n["noise"]: n["noise"] + G] * n["scale"]
            self.notes.append((n["midi"], p, g))
        self.sr, self.R, self.step = self.meta["sampleRate"], R, self.meta["step"]

    def nearest(self, m):
        return min(self.notes, key=lambda x: (abs(x[0] - m), x[0] < m))


class Singer:
    def __init__(self, bank, seed=1):
        self.b = bank
        self.rng = np.random.default_rng(seed)
        self.prev = None  # (end time, midi, pulses, vib phase at end)

    def note(self, t, d, midi, vel):
        """returns (start sample, audio) for one note"""
        b, sr, R = self.b, self.b.sr, self.b.R
        legato = self.prev is not None and abs(t - self.prev[0]) < LEGATO
        from_m = self.prev[1] if legato else midi
        phase = self.prev[3] if legato else self.rng.uniform(0, 2 * np.pi)
        prev_p = self.prev[2] if legato else None
        _, P, Gn = b.nearest(midi)
        n = int((d + RELEASE) * sr) + R
        y = np.zeros(n)
        tp, k = 0.0, 0
        amp = 10 ** ((vel - 80) * 0.25 / 20)
        L = len(P)
        while tp < d * sr:
            ts = tp / sr
            # pitch: glide from the previous note, then vibrato fading in
            g = min(1.0, ts / GLIDE) if legato else 1.0
            g = 0.5 - 0.5 * np.cos(np.pi * g)
            base = from_m + (midi - from_m) * g
            ve = min(1.0, max(0.0, (ts - VIB_DELAY) / VIB_RISE))
            phase += 2 * np.pi * VIB_RATE * (1.0 / max(1.0, 440 * 2 ** ((base - 69) / 12)))  # advance per period
            hz = 440 * 2 ** ((base + VIB_DEPTH * ve * np.sin(phase) - 69) / 12)
            period = sr / hz
            # colour: this note's frame (read forwards and backwards), blended from the previous note's at the start
            fi = int(ts / b.step) % (2 * (L - 1))
            fi = fi if fi < L else 2 * (L - 1) - fi
            pulse = P[fi]
            if prev_p is not None and ts < BLEND:
                w = 0.5 - 0.5 * np.cos(np.pi * ts / BLEND)
                pulse = prev_p * (1 - w) + pulse * w
            env = min(1.0, ts / ATTACK) if not legato else 1.0
            i0 = int(tp)
            frac = tp - i0
            seg = pulse * (1 - frac)
            y[i0:i0 + R] += seg * amp * env
            y[i0 + 1:i0 + 1 + R] += pulse * frac * amp * env
            # breath: a period-long slice of the note's noise
            pl = int(period)
            o = int(self.rng.integers(0, len(Gn) - pl))
            y[i0:i0 + pl] += Gn[o:o + pl] * amp * env
            tp += period
            k += 1
        # release
        e = int(d * sr)
        r = int(RELEASE * sr)
        y[e:e + r] *= np.linspace(1, 0, min(r, len(y) - e))
        y[e + r:] = 0
        last_ts = d
        fi = int(last_ts / b.step) % (2 * (L - 1))
        fi = fi if fi < L else 2 * (L - 1) - fi
        self.prev = (t + d, midi, P[fi], phase)
        return int(t * sr), y
