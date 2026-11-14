#!/usr/bin/env python3
"""
grand-fixture.py: a local copy of one piece's chunked grand-piano accompaniment, for tests/grand (Playwright).

  CF_TOKEN=... python3 scripts/audio/grand-fixture.py [editionId] [--titles boh.txt --titles fig2.txt]

Writes tests/grand/fixtures/ (gitignored):
  piano/v2/<eid>/NNN.m4a, manifest.json      the chunks as served (sottovoce-audio)
  piano/v2/calib-1.m4a, calib-2.m4a          the calibration files
  ref.f32                                    the master (sottovoce-masters), (L+R)/2, float32 48 kHz: the reference
  info.json                                  {eid, samples, chunks, v2Bytes, v1Bytes}
"""
import argparse, importlib.util, json, os, subprocess, urllib.parse

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('cg', os.path.join(HERE, 'chunk-grand.py'))
cg = importlib.util.module_from_spec(spec); spec.loader.exec_module(cg)
OUT = os.path.join(cg.REPO, 'tests/grand/fixtures')

ap = argparse.ArgumentParser()
ap.add_argument('eid', nargs='?', default='puccini-in-un-coupe')
ap.add_argument('--titles', action='append', default=['/home/claude/work/grand/boh.txt', '/home/claude/work/grand/fig2.txt'])
a = ap.parse_args()

get = lambda b, k: cg.req(f'{cg.API}/{b}/objects/{urllib.parse.quote(k)}')
def save(rel, body):
    p = os.path.join(OUT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(body)

man = json.loads(get('sottovoce-audio', f'piano/v2/{a.eid}/manifest.json'))
save(f'piano/v2/{a.eid}/manifest.json', json.dumps(man).encode())
size = 0
for i in range(man['chunks']):
    b = get('sottovoce-audio', f'piano/v2/{a.eid}/{i:03d}.m4a'); size += len(b)
    save(f'piano/v2/{a.eid}/{i:03d}.m4a', b)
for ch in (1, 2):
    save(f'piano/v2/calib-{ch}.m4a', get('sottovoce-audio', f'piano/v2/calib-{ch}.m4a'))
master = next(j[0] for j in cg.jobs_list(a.titles) if j[2] == a.eid and j[3] is None)
src = os.path.join(OUT, 'm.flac'); save('m.flac', get('sottovoce-masters', master))
x = cg.decode(src, 2).mean(1); os.remove(src)  # as the player mixes it (not ffmpeg's -ac 1: 0.707 (L+R))
save('ref.f32', np.ascontiguousarray(x, np.float32).tobytes())
v1 = next((o for o in json.loads(cg.req(f'{cg.API}/sottovoce-audio/objects?prefix=piano/{a.eid}.m4a'))['result']), None)
info = {'eid': a.eid, 'samples': man['samples'], 'chunks': man['chunks'], 'v2Bytes': size, 'v1Bytes': v1 and v1['size']}
save('info.json', json.dumps(info).encode())
print(info)
