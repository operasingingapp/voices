import json, os, re, shutil
V = "/home/claude/voices/content/pieces"
ED = "Breitkopf & Härtel vocal score (Edition Breitkopf 1716, about 1900)"
P = [("recit", "mozart-tutto-ancor-non-ho-perso", "Tutto ancor non ho perso", "Marcellina and Susanna: recitative from Le nozze di Figaro, Act 1", "recitative", "pages 37-38",
      [("M", "P1", "marcellina", "Marcellina", "Mezzo-soprano"), ("S", "P2", "susanna", "Susanna", "Soprano")], "P3"),
     ("duet", "mozart-via-resti-servita", "Via resti servita", "Marcellina and Susanna's duettino No. 5 from Le nozze di Figaro, Act 1", "duettino", "pages 38-43 (No. 5)",
      [("S", "P1", "susanna", "Susanna", "Soprano"), ("M", "P2", "marcellina", "Marcellina", "Mezzo-soprano")], "P3")]
for key, ed, title, sub, kind, where, singers, pno in P:
    d = f"{V}/{ed}"; os.makedirs(d, exist_ok=True)
    shutil.copy(f"{key}_cur.xml", f"{d}/score.musicxml")
    lang = json.load(open(f"lang_{key}4.json")); lang["editionId"] = ed
    json.dump(lang, open(f"{d}/language.json", "w"), ensure_ascii=False, indent=1)
    nb = len(re.findall(r'<measure ', open(f"{key}_cur.xml").read())) // (len(singers) + 1)
    pm = [{"key": "piano", "label": "Piano", "shortLabel": "Piano", "kind": "piano", "source": {"xmlPartId": pno, "staves": [1, 2]}, "channel": 0, "program": 0, "velocityScale": 0.8, "defaultVolume": 0.7}]
    roles = []
    for k, (code, pid, rid, name, vt) in enumerate(singers):
        roles.append({"id": rid, "name": name, "voiceType": vt, "partKey": rid})
        pm.append({"key": rid, "label": f"{name} ({vt})", "shortLabel": name, "kind": "voice", "roleId": rid, "source": {"xmlPartId": pid}, "channel": 3 + k, "program": 0, "velocityScale": 0.85, "defaultVolume": 1.0})
    man = {"editionId": ed, "editionVersion": "1.0.0-klengel", "title": title, "subtitle": sub, "kind": kind, "fixture": False, "pedal": "classical",
           "composer": "Wolfgang Amadeus Mozart", "librettist": "Lorenzo Da Ponte", "language": "it",
           "files": {"musicxml": "score.musicxml", "language": "language.json", "audioDir": "audio"},
           "roles": roles, "partMapping": pm, "passages": [{"id": "a", "label": "The whole piece", "start": "1", "end": str(nb)}],
           "licences": [
             {"item": "Music", "source": "W. A. Mozart, Le nozze di Figaro, K. 492 (1786), Act 1", "author": "Wolfgang Amadeus Mozart (1756–1791)", "licence": "Public domain", "notes": ""},
             {"item": "Libretto text", "source": "Lorenzo Da Ponte, libretto of Le nozze di Figaro (1786)", "author": "Lorenzo Da Ponte (1749–1838)", "licence": "Public domain", "notes": "Words as printed in the Breitkopf vocal score."},
             {"item": "Score (score.musicxml)", "source": f"{ED}, {where}", "author": "Paul Klengel (1854–1935), piano reduction", "licence": "Public domain", "notes": "Written out from the printed pages: sung lines and piano each transcribed twice independently and reconciled; checked in full rounds until clean, then accidentals, slur and singer passes and a fresh independent check."},
             {"item": "IPA, gloss and translation", "source": "Written for this app", "author": "Counterpart development team", "licence": "CC0 1.0", "notes": "Unreviewed by a diction coach."}]}
    json.dump(man, open(f"{d}/manifest.json", "w"), indent=1, ensure_ascii=False)
    print(ed, nb)
