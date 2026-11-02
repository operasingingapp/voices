"""blob-voices.py stage | record NAME=URL ...
stage: list the voice packs (src/standalone/voicepacks/*.mp3) whose contents are not yet in the artifact's file store,
copying each to .cache/blobstage/<name>.mp4 (the store takes .mp4; the bytes stay the original MP3).
record: write the store addresses the upload returned into src/standalone/voiceblobs.json."""
import hashlib, json, os, shutil, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(R, "src/standalone/voicepacks"); M = os.path.join(R, "src/standalone/voiceblobs.json"); S = os.path.join(R, ".cache/blobstage")
m = json.load(open(M))
sha = lambda f: hashlib.sha1(open(f, "rb").read()).hexdigest()
if sys.argv[1] == "stage":
    shutil.rmtree(S, ignore_errors=True); os.makedirs(S)
    cur = {f: sha(os.path.join(P, f)) for f in sorted(os.listdir(P)) if f.endswith(".mp3")}
    gone = [k for k in m if k not in cur]
    for k in gone: print("GONE", k, m[k]["url"])
    for f, h in cur.items():
        if m.get(f, {}).get("sha1") != h:
            dst = os.path.join(S, f[:-4] + ".mp4"); shutil.copy(os.path.join(P, f), dst); print("UPLOAD", dst)
    json.dump({"sha": cur}, open(os.path.join(S, "_sha.json"), "w"))
else:
    cur = json.load(open(os.path.join(S, "_sha.json")))["sha"]
    for a in sys.argv[2:]:
        name, url = a.split("=", 1); f = name.removesuffix(".mp4") + ".mp3"
        m[f] = {"sha1": cur[f], "url": url}
    m = {k: v for k, v in m.items() if k in cur}
    json.dump(m, open(M, "w"), indent=1, sort_keys=True); print(len(m), "packs recorded")
