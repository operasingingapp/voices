#!/usr/bin/env python3
"""
chunk-grand.py: the grand-piano recordings, cut into short chunks so the app can start playing within a second.

Source: the Pianoteq masters (private R2 bucket sottovoce-masters, prefixes boheme-normalized/ and figaro-normalized/,
FLAC 48 kHz): "<folder>/<Piece>__Piano.flac" is a piece's accompaniment, "<folder>/<Piece>__<Role>.flac" one singer's line.
Folder names map to editionIds through the title lists (--titles, "editionId<TAB>title" per line, as convert.py),
roles to partKeys through each edition's parts (data/content/<eid>/edition.json, as lines.py named them).

Output (public bucket sottovoce-audio), no processing but the encode (levels stay in grandPiano.json, untouched):
  piano/v2/<eid>/NNN.m4a                     accompaniment: AAC-LC ~160 kbps, stereo, 48 kHz
  piano/v2/lines/<eid>/<partKey>/NNN.m4a     a singer's line: AAC-LC ~96 kbps, MONO, 48 kHz (see DOWNMIX)
  .../manifest.json                          per recording: {rate, chunk, overlap, samples, chunks, channels}
  piano/v2/calib-2.m4a, calib-1.m4a          the calibration files (see below)
  piano/v2/manifest.json                     every recording's manifest, keyed by its folder

Chunks: the master (T samples) is padded with OVERLAP zeros at each end (P = 0^V + x + 0^V) and chunk i is
P[i*CHUNK : (i+1)*CHUNK + 2*OVERLAP], i.e. the recording's samples [i*CHUNK - V, (i+1)*CHUNK + V): every chunk
carries 0.25 s of its neighbours on each side, so the player can line chunks up with each other by
cross-correlation of the overlap and cross-fade them inside it, whatever a browser does about the codec's priming
and edit list. Where a chunk's decoded samples begin (the decoder's lead, the same for every chunk of one encoder
setting) is measured once per session on the calibration file: a known noise burst (xorshift32, the same generator
as src/audio/chunkedAudio.ts: calibrationNoise) encoded with the same settings.

DOWNMIX (lines): the mono line plays on both speakers, so it must sound as loud there as the stereo master did, or
the gainDb kept in grandPiano.json (measured on the stereo masters) would no longer hold. Pianoteq's two channels
are only partly correlated (0.3-0.5), so a fixed mix is off either way: ffmpeg's -ac 1 (0.707 (L+R)) comes out
1.1-1.8 dB louder, (L+R)/2 1.2-2.0 dB softer. Each line is therefore (L+R)/2 scaled so that its integrated
loudness (EBU R128) on two speakers equals the stereo master's; the scale is recorded as "downmixDb" in its manifest.

The grandPiano.json entries keep their gainDb and get "v2": {"dir": "v2/<eid>/", "samples": T, "channels": C}.

Resumable: a recording whose manifest.json is already in the bucket is skipped (the manifest goes up last).
  CF_TOKEN=... python3 scripts/audio/chunk-grand.py --titles boh.txt --titles fig2.txt [--only <eid>] [--jobs 2]
  CF_TOKEN=... python3 scripts/audio/chunk-grand.py --titles ... --verify     (every object exists; writes the json)
"""
import argparse, json, os, re, subprocess, sys, tempfile, threading, unicodedata, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

import numpy as np

ACCOUNT = '119a434c8ade96738f55b2de3a8c360b'
API = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/r2/buckets'
RATE = 48000
CHUNK = 10 * RATE  # 10 s
OVERLAP = RATE // 4  # 0.25 s each side
PREFIXES = ('boheme-normalized/', 'figaro-normalized/')
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MAPF = os.path.join(REPO, 'src/standalone/grandPiano.json')
SETTINGS = {2: ['-b:a', '160k'], 1: ['-b:a', '96k']}
TOKEN = os.environ.get('CF_TOKEN', '')


def req(url, method='GET', data=None, ctype=None, tries=5):
    for t in range(tries):
        try:
            r = urllib.request.Request(url, method=method, data=data,
                                       headers={'Authorization': 'Bearer ' + TOKEN, **({'Content-Type': ctype} if ctype else {})})
            with urllib.request.urlopen(r, timeout=600) as res:
                return res.read()
        except Exception as e:  # transient network errors: try again
            if t == tries - 1 or getattr(e, 'code', 500) in (400, 401, 403, 404):
                raise
            import time; time.sleep(2 * (t + 1))


def keys(bucket, prefix):
    out, cur = [], None
    while True:
        u = f'{API}/{bucket}/objects?per_page=1000&prefix={urllib.parse.quote(prefix)}' + (f'&cursor={cur}' if cur else '')
        d = json.loads(req(u)); out += [x['key'] for x in d['result']]
        info = d.get('result_info') or {}
        cur = info.get('cursor')
        if not cur or not info.get('is_truncated'):
            return out


def put(key, body, ctype):
    json.loads(req(f'{API}/sottovoce-audio/objects/{urllib.parse.quote(key)}', 'PUT', body, ctype))


def folder_names(title_files):
    """folder name (as the shell wrote it) -> editionId"""
    names = {}
    for tf in title_files:
        for line in open(tf, encoding='utf-8'):
            if not line.strip(): continue
            eid, title = line.rstrip('\n').split('\t')
            t = unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode()
            names[re.sub(r'_+', '_', re.sub(r'[^A-Za-z0-9\n]', '_', t)).strip('_')] = eid
            for v in (title, title.replace('’', "'")):
                raw = re.sub(r'_+', '_', re.sub(r'[^A-Za-z0-9\n]', '_', v.encode('ascii', 'ignore').decode())).strip('_')
                names[raw] = eid
    return names


def appclean(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^A-Za-z0-9]+', '_', s).strip('_')


def jobs_list(title_files):
    """every master -> (master key, destination dir under piano/, editionId, partKey or None, channels)"""
    names = folder_names(title_files)
    out = []
    for prefix in PREFIXES:
        for k in sorted(keys('sottovoce-masters', prefix)):
            if not k.endswith('.flac'): continue
            folder, fname = k.split('/')[1], k.split('/')[2]
            eid = names.get(folder)
            if not eid:
                print('no edition for', k, file=sys.stderr); continue
            role = fname[:-5].split('__')[-1]
            if role == 'Piano':
                out.append((k, f'v2/{eid}/', eid, None, 2)); continue
            ed = json.load(open(os.path.join(REPO, f'data/content/{eid}/edition.json')))
            part = next((p for p in ed['parts'] if p['kind'] in ('voice', 'chorus')
                         and appclean(p.get('shortLabel') or p.get('label') or p['key']) == role), None)
            if not part:
                print('no part for', k, file=sys.stderr); continue
            out.append((k, f"v2/lines/{eid}/{part['key']}/", eid, part['key'], 1))
    return out


def chunk_bounds(total):
    """how many chunks: chunk i covers the recording's samples [i*CHUNK - OVERLAP, (i+1)*CHUNK + OVERLAP)"""
    return max(1, -(-total // CHUNK))


def chunks_of(x):
    """x: (samples, channels) float32 -> the list of chunk arrays (see the module doc)"""
    total = x.shape[0]
    p = np.concatenate([np.zeros((OVERLAP, x.shape[1]), np.float32), x, np.zeros((OVERLAP, x.shape[1]), np.float32)])
    return [p[i * CHUNK: (i + 1) * CHUNK + 2 * OVERLAP] for i in range(chunk_bounds(total))]


def encode(x, channels, out):
    """float32 (samples, channels) -> AAC-LC .m4a at 48 kHz (ffmpeg's native encoder; faststart)"""
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(RATE), '-ac', str(channels), '-i', '-',
                    '-c:a', 'aac', *SETTINGS[channels], '-ar', str(RATE), '-movflags', '+faststart', out],
                   input=np.ascontiguousarray(x, np.float32).tobytes(), check=True)


def decode(path, channels):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ar', str(RATE), '-ac', str(channels), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, channels)


def lufs(x):
    """integrated loudness (EBU R128) of float32 (samples, channels) at 48 kHz, or None (silence)"""
    o = subprocess.run(['ffmpeg', '-v', 'info', '-f', 'f32le', '-ar', str(RATE), '-ac', str(x.shape[1]), '-i', '-', '-af', 'ebur128', '-f', 'null', '-'],
                       input=np.ascontiguousarray(x, np.float32).tobytes(), capture_output=True).stderr.decode()
    v = re.findall(r'^\s+I:\s+(-?[\d.]+) LUFS', o, re.M)
    return float(v[-1]) if v and float(v[-1]) > -69 else None


def downmix(x2):
    """a stereo line -> mono, as loud on two speakers as the stereo was (see DOWNMIX); returns (mono, dB applied)"""
    m = 0.5 * (x2[:, 0] + x2[:, 1])
    a, b = lufs(x2), lufs(np.stack([m, m], 1))
    db = round(a - b, 2) if a is not None and b is not None else 1.5
    return (m * 10 ** (db / 20)).astype(np.float32)[:, None], db


def calibration_noise():
    """the calibration signal: 2400 zeros, 9600 samples of xorshift32 noise at +-0.5, 2400 zeros (as chunkedAudio.ts)"""
    s = 0x9E3779B9
    v = np.zeros(9600, np.float32)
    for i in range(9600):
        s ^= (s << 13) & 0xFFFFFFFF; s ^= s >> 17; s ^= (s << 5) & 0xFFFFFFFF
        v[i] = (s / 4294967296.0 * 2 - 1) * 0.5
    return np.concatenate([np.zeros(2400, np.float32), v, np.zeros(2400, np.float32)])


def run_one(job, tmp, uploaded):
    key, dest, eid, part, ch = job
    prefix = 'piano/' + dest
    if prefix + 'manifest.json' in uploaded:
        man = json.loads(req(f'{API}/sottovoce-audio/objects/{urllib.parse.quote(prefix + "manifest.json")}'))
        if ch == 2 or 'downmixDb' in man:
            return man
        uploaded = set()  # a line from before DOWNMIX: encoded again, every chunk replaced
    d = tempfile.mkdtemp(dir=tmp)
    src = os.path.join(d, 'm.flac')
    open(src, 'wb').write(req(f'{API}/sottovoce-masters/objects/{urllib.parse.quote(key)}'))
    extra = {}
    if ch == 1:
        x, extra['downmixDb'] = downmix(decode(src, 2))
    else:
        x = decode(src, ch)
    os.remove(src)
    cs = chunks_of(x)
    size = 0
    for i, c in enumerate(cs):
        k = f'{prefix}{i:03d}.m4a'
        out = os.path.join(d, f'{i:03d}.m4a')
        encode(c, ch, out)
        body = open(out, 'rb').read(); size += len(body)
        if k not in uploaded:
            put(k, body, 'audio/mp4')
        os.remove(out)
    man = {'rate': RATE, 'chunk': CHUNK, 'overlap': OVERLAP, 'samples': int(x.shape[0]), 'chunks': len(cs), 'channels': ch, 'bytes': size, **extra}
    put(prefix + 'manifest.json', json.dumps(man).encode(), 'application/json')
    os.rmdir(d)
    print(dest, f'{x.shape[0] / RATE:.1f}s', len(cs), 'chunks', size // 1000, 'kB', *(f'{k} {v:+.2f}' for k, v in extra.items()), flush=True)
    return man


def write_json(results):
    """grandPiano.json: every entry keeps its file and gainDb, and gets its v2 layout"""
    done = json.load(open(MAPF))
    for (key, dest, eid, part, ch), man in results:
        if eid not in done: print('not in grandPiano.json:', eid, file=sys.stderr); continue
        v2 = {'dir': dest, 'samples': man['samples'], 'channels': ch}
        if part is None: done[eid]['v2'] = v2
        elif part in done[eid].get('lines', {}): done[eid]['lines'][part]['v2'] = v2
        else: print('line not in grandPiano.json:', eid, part, file=sys.stderr)
    json.dump(done, open(MAPF, 'w'), indent=1, sort_keys=True)
    open(MAPF, 'a').write('\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--titles', action='append', required=True)
    ap.add_argument('--only')
    ap.add_argument('--jobs', type=int, default=2)
    ap.add_argument('--verify', action='store_true')
    ap.add_argument('--tmp', default=tempfile.gettempdir())
    a = ap.parse_args()
    jobs = jobs_list(a.titles)
    if a.only: jobs = [j for j in jobs if j[2] == a.only]
    print(len(jobs), 'recordings', flush=True)
    uploaded = set(keys('sottovoce-audio', 'piano/v2/'))
    # the calibration files, once
    for ch in (2, 1):
        k = f'piano/v2/calib-{ch}.m4a'
        if k not in uploaded:
            out = os.path.join(a.tmp, f'calib-{ch}.m4a')
            encode(np.repeat(calibration_noise()[:, None], ch, 1), ch, out)
            put(k, open(out, 'rb').read(), 'audio/mp4')
    if a.verify:
        missing, results = [], []
        for j in jobs:
            m = j[1]
            mk = f'piano/{m}manifest.json'
            if mk not in uploaded: missing.append(mk); continue
            man = json.loads(req(f'{API}/sottovoce-audio/objects/{urllib.parse.quote(mk)}'))
            if j[4] == 1 and 'downmixDb' not in man: missing.append(mk + ' (old downmix)'); continue
            missing += [f'piano/{m}{i:03d}.m4a' for i in range(man['chunks']) if f'piano/{m}{i:03d}.m4a' not in uploaded]
            results.append((j, man))
        missing += [k for k in ('piano/v2/calib-1.m4a', 'piano/v2/calib-2.m4a') if k not in uploaded]
        print('missing:', len(missing), missing[:20])
        write_json(results)
        allm = {j[1]: man for j, man in results}
        put('piano/v2/manifest.json', json.dumps(allm, sort_keys=True).encode(), 'application/json')
        print('verified', len(results), 'recordings,', sum(m['chunks'] for _, m in results), 'chunks,',
              sum(m['bytes'] for _, m in results) // 1_000_000, 'MB')
        sys.exit(1 if missing else 0)
    lock = threading.Lock()
    results = []
    def work(j):
        try:
            m = run_one(j, a.tmp, uploaded)
            with lock: results.append((j, m))
        except Exception as e:
            print('FAILED', j[0], repr(e), file=sys.stderr, flush=True)
    with ThreadPoolExecutor(a.jobs) as ex:
        list(ex.map(work, jobs))
    print('done', len(results), 'of', len(jobs), flush=True)


if __name__ == '__main__':
    main()
