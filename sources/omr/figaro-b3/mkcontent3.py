import json, os, re, xml.etree.ElementTree as ET
V = "/home/claude/voices/content/pieces"; SRC = "/home/claude/ext/figaro/b3in/z/figaro_pp72-100"; FX = "/home/claude/ext/figaro/b3/fixed"
ED = "Breitkopf & Härtel vocal score (Edition Breitkopf 1716, about 1900)"
ROLE = {  # file role / part name -> (app id, name, voice type)
  "conte": ("count", "The Count", "Baritone"), "il conte": ("count", "The Count", "Baritone"),
  "contessa": ("countess", "The Countess", "Soprano"), "la contessa": ("countess", "The Countess", "Soprano"),
  "susanna": ("susanna", "Susanna", "Soprano"), "figaro": ("figaro", "Figaro", "Bass-baritone"),
  "basilio": ("basilio", "Don Basilio", "Tenor"), "cherubino": ("cherubino", "Cherubino", "Mezzo-soprano"),
  "coro": ("chorus", "Chorus", "Soprano"), "coro (tutti)": ("chorus", "Chorus", "Soprano"),
  "soprano": ("soprano", "Chorus sopranos", "Soprano"), "alto": ("alto", "Chorus altos", "Alto"),
  "tenor": ("tenor", "Chorus tenors", "Tenor"), "bass": ("bass", "Chorus basses", "Bass")}
P = [  # file, editionId, title, subtitle, kind, pages
 ("Recit_after_No07_Basilio_in_traccia_tosto", "mozart-basilio-in-traccia-tosto", "Basilio, in traccia tosto", "The Count, Susanna, Basilio and Cherubino: recitative from Le nozze di Figaro, Act 1", "recitative", "pages 72-74"),
 ("No08_Coro_Giovani_liete", "mozart-giovani-liete", "Giovani liete", "Chorus No. 8 from Le nozze di Figaro, Act 1", "chorus", "pages 74-76 (No. 8)"),
 ("Recit_after_No08_Cos_e_questa_commedia", "mozart-cos-e-questa-commedia", "Cos'è questa commedia", "The Count, Figaro, Susanna and chorus: recitative from Le nozze di Figaro, Act 1", "recitative", "pages 76-79"),
 ("No08_Coro_Giovani_liete_reprise", "mozart-giovani-liete-reprise", "Giovani liete (repeated)", "The chorus sung again, Le nozze di Figaro, Act 1", "chorus", "pages 79-81"),
 ("Recit_after_No08_Evviva", "mozart-evviva", "Evviva!", "Recitative from Le nozze di Figaro, Act 1", "recitative", "pages 81-83"),
 ("No09_Aria_Non_piu_andrai", "mozart-non-piu-andrai", "Non più andrai", "Figaro's aria No. 9 from Le nozze di Figaro, Act 1", "aria", "pages 84-89 (No. 9)"),
 ("No10_Cavatina_Porgi_amor", "mozart-porgi-amor", "Porgi, amor", "The Countess's cavatina No. 10 from Le nozze di Figaro, Act 2", "cavatina", "pages 90-91 (No. 10)"),
 ("Recit_after_No10_Vieni_cara_Susanna", "mozart-vieni-cara-susanna", "Vieni, cara Susanna", "The Countess, Susanna and Figaro: recitative from Le nozze di Figaro, Act 2", "recitative", "pages 92-100")]
for f, ed, title, sub, kind, where in P:
    d = f"{V}/{ed}"; os.makedirs(d, exist_ok=True)
    x = open(f"{FX}/{f}.musicxml").read(); open(f"{d}/score.musicxml", "w").write(x)
    r = ET.fromstring(x.encode())
    parts = [(sp.get("id"), sp.findtext("part-name").strip()) for sp in r.iter("score-part")]
    lang = json.load(open(f"{SRC}/{f}.json")); lang["editionId"] = ed
    for ph in lang["phrases"]: ph["role"] = ROLE[ph["role"].lower()][0]
    json.dump(lang, open(f"{d}/language.json", "w"), ensure_ascii=False, indent=1)
    roles, pm = [], []; ch = 3
    for pid, name in parts:
        if name.lower() == "piano":
            pm.append({"key": "piano", "label": "Piano", "shortLabel": "Piano", "kind": "piano", "source": {"xmlPartId": pid, "staves": [1, 2]}, "channel": 0, "program": 0, "velocityScale": 0.8, "defaultVolume": 0.7}); continue
        rid, rname, vt = ROLE[name.lower()]
        roles.append({"id": rid, "name": rname, "voiceType": vt, "partKey": rid})
        pm.append({"key": rid, "label": f"{rname} ({vt})", "shortLabel": rname.replace("The ", "").replace("Don ", ""), "kind": "voice", "roleId": rid, "source": {"xmlPartId": pid}, "channel": ch, "program": 0, "velocityScale": 0.85, "defaultVolume": 1.0}); ch += 1
    nb = len(r.find("part").findall("measure"))
    man = {"editionId": ed, "editionVersion": "1.0.0-klengel", "title": title, "subtitle": sub, "kind": kind, "fixture": False, "pedal": "classical",
           "composer": "Wolfgang Amadeus Mozart", "librettist": "Lorenzo Da Ponte", "language": "it",
           "files": {"musicxml": "score.musicxml", "language": "language.json", "audioDir": "audio"},
           "roles": roles, "partMapping": pm, "passages": [{"id": "a", "label": "The whole piece", "start": "1", "end": str(nb)}],
           "licences": [
             {"item": "Music", "source": "W. A. Mozart, Le nozze di Figaro, K. 492 (1786)", "author": "Wolfgang Amadeus Mozart (1756–1791)", "licence": "Public domain", "notes": ""},
             {"item": "Libretto text", "source": "Lorenzo Da Ponte, libretto of Le nozze di Figaro (1786)", "author": "Lorenzo Da Ponte (1749–1838)", "licence": "Public domain", "notes": "Words as printed in the Breitkopf vocal score."},
             {"item": "Score (score.musicxml)", "source": f"{ED}, {where}", "author": "Paul Klengel (1854–1935), piano reduction", "licence": "Public domain", "notes": "Written out from the printed pages (sung lines and piano each transcribed twice independently and reconciled), checked in several rounds, then checked again independently against the print."},
             {"item": "IPA, gloss and translation", "source": "Written for this app", "author": "Counterpart development team", "licence": "CC0 1.0", "notes": "Unreviewed by a diction coach."}]}
    json.dump(man, open(f"{d}/manifest.json", "w"), indent=1, ensure_ascii=False)
    print(ed, nb, [r_["id"] for r_ in roles])
