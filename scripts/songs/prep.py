"""prep.py SONG_ID OPENSCORE_DIR : start a song from an OpenScore Lieder folder.

Writes content/pieces/song-<SONG_ID>/score.musicxml (the OpenScore MusicXML with its verse numbers taken off the
first syllables), content/pieces/song-<SONG_ID>/manifest.json, and /home/claude/ext/songs/song-<SONG_ID>/draft.json:
the sung words cut into phrases, each word as [text, gloss, ipa] with gloss and ipa left empty for the language pass,
plus info.json (key, time, poet, sources). finish.py then writes language.json and sets the tempo.
"""
import json, os, re, sys, zipfile, glob
sys.path.insert(0, os.path.dirname(__file__))
from words import words_of

ROOT = "/home/claude/voices"
song_id, src = sys.argv[1], sys.argv[2]
eid = f"song-{song_id}"
songs_ts = open(f"{ROOT}/src/standalone/songs.ts", encoding="utf-8").read()
line = next(l for l in songs_ts.splitlines() if f'id: "{song_id}"' in l)
song = {k: json.loads(v) for k, v in re.findall(r'(\w+): ("(?:[^"\\]|\\.)*")', line)}

mxl = glob.glob(f"{src}/*.mxl")[0]
z = zipfile.ZipFile(mxl)
name = next(n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META"))
xml = z.read(name).decode("utf-8")
# "1. Du" -> "Du": the verse number is the lyric's number attribute, not sung text
xml = re.sub(r"(<text>)\s*\d+\.\s*", r"\1", xml)
out = f"{ROOT}/content/pieces/{eid}"
os.makedirs(out, exist_ok=True)
open(f"{out}/score.musicxml", "w", encoding="utf-8").write(xml)

work = f"/home/claude/ext/songs/{eid}"
os.makedirs(work, exist_ok=True)
txt = (glob.glob(f"{src}/*.txt") or [None])[0]
w = words_of(f"{out}/score.musicxml", txt)

# phrases: cut after a word that ends a clause (. ; : ! ?), or after a comma once the phrase has 5 words or more
repeated = any(d == "backward" for _, d in w["repeats"])
phrases = []
for v, ws in sorted(w["verses"].items(), key=lambda x: int(x[0])):
    cur = []
    def flush():
        if cur:
            n = sum(1 for p in phrases if p["verse"] == int(v)) + 1
            phrases.append({"id": f"v{v}-{n}", "role": "voice", "verse": int(v),
                            "occurrence": int(v) if repeated and int(v) > 1 else 1,
                            "startMeasure": cur[0][0], "words": [[t, "", ""] for _, t in cur],
                            "translation": "", "glossGroups": []})
    for bar, t in ws:
        cur.append([bar, t])
        if re.search(r"[.;:!?]['’»\")]*$", t) or (t.endswith(",") and len(cur) >= 5):
            flush(); cur = []
    flush()

root = xml
key = re.search(r"<fifths>(-?\d+)</fifths>(?:\s*<mode>(\w+)</mode>)?", root)
time = re.search(r"<beats>(\d+)</beats>\s*<beat-type>(\d+)</beat-type>", root)
poet = re.search(r'<creator type="lyricist">(.*?)</creator>', root)
source = re.search(r'<creator type="arranger">(.*?)</creator>', root)
readme = open(f"{src}/README.md", encoding="utf-8").read() if os.path.exists(f"{src}/README.md") else ""
ms = re.search(r"https://musescore.com/score/(\d+)", readme)
imslp = re.search(r"\[IMSLP\]: (\S+)", readme)
info = {"songId": song_id, "editionId": eid, "title": song["title"], "composer": song["composer"],
        "composerFull": song["composerFull"], "lang": song["lang"],
        "fifths": int(key.group(1)) if key else 0, "mode": (key.group(2) if key and key.group(2) else ""),
        "time": f"{time.group(1)}/{time.group(2)}" if time else "",
        "poet": poet.group(1).strip() if poet else "", "transcription": source.group(1).strip() if source else "",
        "openscore": src.replace("/home/claude/ext/Lieder/", "https://github.com/OpenScore/Lieder/tree/main/"),
        "musescore": f"https://musescore.com/score/{ms.group(1)}" if ms else "", "imslp": imslp.group(1) if imslp else "",
        "unmatched": w["unmatched"], "measures": len(w["measures"]), "repeats": w["repeats"],
        "parts": w["parts"], "tempoWords": re.findall(r"<words[^>]*>([^<]*)</words>", root)[:4]}
json.dump(info, open(f"{work}/info.json", "w"), ensure_ascii=False, indent=1)
json.dump({"editionId": eid, "language": song["lang"], "phrases": phrases}, open(f"{work}/draft.json", "w"), ensure_ascii=False, indent=1)

voice_id, piano_id = w["parts"][0][0], w["parts"][1][0]
manifest = {
    "editionId": eid, "editionVersion": "1.0.0-openscore", "title": song["title"],
    "subtitle": f"{song['composerFull']}: song" + (f", words by {info['poet']}" if info["poet"] else ""),
    "kind": "song", "fixture": False, "pedal": "romantic",
    "composer": song["composerFull"], "librettist": info["poet"], "language": song["lang"],
    "files": {"musicxml": "score.musicxml", "language": "language.json", "audioDir": "audio"},
    "roles": [{"id": "voice", "name": "Voice", "voiceType": "Voice", "partKey": "voice"}],
    "partMapping": [
        {"key": "piano", "label": "Piano", "shortLabel": "Piano", "kind": "piano",
         "source": {"xmlPartId": piano_id, "staves": [1, 2]}, "channel": 0, "program": 0, "velocityScale": 0.8, "defaultVolume": 0.7},
        {"key": "voice", "label": "Voice", "shortLabel": "Voice", "kind": "voice", "roleId": "voice",
         "source": {"xmlPartId": voice_id}, "channel": 3, "program": 0, "velocityScale": 0.85, "defaultVolume": 1.0},
    ],
    "passages": [],
    "licences": [
        {"item": "Music", "source": f"{song['composerFull']}, {song['title']}", "author": song["composerFull"], "licence": "Public domain", "notes": ""},
        {"item": "Poem", "source": song["title"], "author": info["poet"] or "Unknown", "licence": "Public domain", "notes": ""},
        {"item": "Score (score.musicxml)", "source": f"OpenScore Lieder Corpus ({info['openscore']})", "author": info["transcription"] or "OpenScore contributors",
         "licence": "CC0 1.0", "notes": "Transcribed and proofread by OpenScore Lieder contributors; verse numbers taken off the first syllables. Playback tempo set for this app."},
        {"item": "IPA, gloss and translation", "source": "Written for this app", "author": "Counterpart development team", "licence": "CC0 1.0", "notes": "Unreviewed by a diction coach."},
    ],
}
json.dump(manifest, open(f"{out}/manifest.json", "w"), ensure_ascii=False, indent=1)
print(eid, len(phrases), "phrases;", "unmatched" if w["unmatched"] else "words all matched", w["unmatched"] or "")
