"""language.json for the Duettino and the recitative: each sung line with its translation, IPA and word meanings.

The lines are found in each singer's sung words (from the score) by matching the text units below, longest first,
so every repeat becomes its own phrase at the bar where it is sung.
"""
import json, re, sys, unicodedata
import xml.etree.ElementTree as ET


def strip(w):
    return "".join(c for c in unicodedata.normalize("NFD", w.lower()) if unicodedata.category(c) != "Mn")


def key(w):
    return re.sub(r"[^a-z']", "", strip(w)).strip("'") or strip(w)


def akey(w):
    """lower case, punctuation off, accents kept (è is, e and; sì yes, si herself)"""
    return re.sub(r"[^a-zàèéìòù']", "", w.lower()).strip("'")


# word -> (meaning, IPA as sung)
D = {
    "cinque": ("five", "ˈtʃiŋ.kwe"), "dieci": ("ten", "ˈdjɛ.tʃi"), "venti": ("twenty", "ˈven.ti"), "trenta": ("thirty", "ˈtren.ta"),
    "trentasei": ("thirty-six", "tren.taˈsɛ.i"), "quarantatre": ("forty-three", "kwa.ran.taˈtre"),
    "ora": ("now", "ˈo.ra"), "si": ("yes, truly", "ˈsi"), "ch'io": ("that I", "ˈkjo"), "son": ("am", "son"), "contenta": ("happy", "konˈtɛn.ta"),
    "sembra": ("it seems", "ˈsem.bra"), "fatto": ("made", "ˈfat.to"), "in": ("in", "in"), "ver": ("truth", "ˈvɛr"), "per": ("for", "per"),
    "me": ("me", "ˈme"), "te": ("you", "ˈte"), "guarda": ("look", "ˈgwar.da"), "un": ("a", "un"), "po": ("little", "ˈpɔ"),
    "mio": ("my", "ˈmi.o"), "caro": ("dear", "ˈka.ro"), "figaro": ("Figaro", "ˈfi.ga.ro"), "adesso": ("now", "aˈdɛs.so"), "il": ("the", "il"),
    "capello": ("hat", "kapˈpɛl.lo"), "core": ("heart", "ˈkɔ.re"), "or": ("now", "or"), "e": ("is", "ɛ"), "piu": ("more", "ˈpju"),
    "bello": ("beautiful", "ˈbɛl.lo"), "ah": ("ah", "a"), "mattino": ("morning", "matˈti.no"), "alle": ("to the", "ˈal.le"),
    "nozze": ("wedding", "ˈnɔt.tse"), "vicino": ("near", "viˈtʃi.no"), "quant'": ("how", "kwant"), "quant": ("how", "kwant"),
    "dolce": ("sweet", "ˈdol.tʃe"), "al": ("to the", "al"), "tuo": ("your", "ˈtu.o"), "tenero": ("loving", "ˈtɛ.ne.ro"),
    "sposo": ("bridegroom", "ˈspɔ.zo"), "questo": ("this", "ˈkwe.sto"), "bel": ("pretty", "bɛl"), "capellino": ("little hat", "kap.pelˈli.no"),
    "vezzoso": ("charming", "vetˈtso.zo"), "che": ("that", "ke"), "susanna": ("Susanna", "suˈzan.na"), "ella": ("she", "ˈel.la"),
    "stessa": ("herself", "ˈstes.sa"), "fe": ("made", "ˈfɛ"),
    # recitative
    "cosa": ("what", "ˈkɔ.za"), "stai": ("are you", "ˈstai"), "misurando": ("measuring", "mi.zuˈran.do"), "figaretto": ("little Figaro", "fi.gaˈret.to"),
    "io": ("I", "ˈi.o"), "guardo": ("I'm checking", "ˈgwar.do"), "se": ("whether", "se"), "quel": ("that", "kwel"), "letto": ("bed", "ˈlɛt.to"),
    "ci": ("to us", "tʃi"), "destina": ("assigns", "deˈsti.na"), "conte": ("Count", "ˈkon.te"), "fara": ("will make", "faˈra"),
    "buona": ("good", "ˈbwɔ.na"), "figura": ("figure", "fiˈgu.ra"), "loco": ("place", "ˈlɔ.ko"), "questa": ("this", "ˈkwe.sta"),
    "stanza": ("room", "ˈstan.tsa"), "certo": ("certainly", "ˈtʃɛr.to"), "a": ("to", "a"), "noi": ("us", "ˈnoi"), "la": ("it", "la"),
    "cede": ("grants", "ˈtʃɛ.de"), "generoso": ("generous", "dʒe.neˈro.zo"), "padrone": ("master", "paˈdro.ne"), "dono": ("I give", "ˈdo.no"),
    "ragione": ("reason", "raˈdʒo.ne"), "l'ho": ("I have it", "ˈlɔ"), "qui": ("here", "ˈkwi"), "perche": ("why", "perˈke"),
    "non": ("not", "non"), "puoi": ("you can", "ˈpwɔi"), "far": ("make", "far"), "passi": ("it passes", "ˈpas.si"), "voglio": ("I want", "ˈvɔʎ.ʎo"),
    "sei": ("are", "ˈsɛi"), "tu": ("you", "tu"), "servo": ("servant", "ˈsɛr.vo"), "o": ("or", "o"), "no": ("no", "ˈnɔ"), "ma": ("but", "ma"),
    "capisco": ("I understand", "kaˈpi.sko"), "tanto": ("so much", "ˈtan.to"), "ti": ("to you", "ti"), "spiace": ("displeases", "ˈspja.tʃe"),
    "comoda": ("convenient", "ˈkɔ.mo.da"), "del": ("of the", "del"), "palazzo": ("palace", "paˈlat.tso"), "perch'io": ("because I", "perˈkjo"),
    "pazzo": ("mad", "ˈpat.tso"), "grazie": ("thank you", "ˈgrat.tsje"), "tanti": ("so many", "ˈtan.ti"), "elogi": ("compliments", "eˈlɔ.dʒi"),
    "poco": ("little", "ˈpɔ.ko"), "potria": ("could", "poˈtri.a"), "meglio": ("better", "ˈmɛʎ.ʎo"), "stare": ("stand", "ˈsta.re"), "altro": ("other", "ˈal.tro"),
}
D_ACC = {"è": ("is", "ɛ"), "e": ("and", "e"), "sì": ("yes", "ˈsi"), "si": ("herself", "si"), "pò": ("little", "ˈpɔ"),
         "fè": ("made", "ˈfɛ"), "più": ("more", "ˈpju"), "farà": ("will make", "faˈra"), "quì": ("here", "ˈkwi"),
         "perchè": ("why", "perˈke"), "stàre": ("stand", "ˈsta.re"), "quant'": ("how", "kwant")}


def look(w):
    return D_ACC.get(akey(w)) or D_ACC.get(akey(w) + "'") or D[key(w)]

# text units: (words, translation, gloss groups as (first, last, meaning))
U = [
    ("Cinque", "Five…", []), ("dieci", "ten…", []), ("venti", "twenty…", []), ("trenta", "thirty…", []),
    ("trentasei", "thirty-six…", []), ("quarantatre", "forty-three.", []),
    ("Ora sì ch'io son contenta", "Now I'm really happy:", [(0, 1, "now indeed")]),
    ("sembra fatto in ver per me", "it really seems made for me.", [(2, 3, "truly")]),
    ("sembra fatto in ver per te", "it really seems made for you.", [(2, 3, "truly")]),
    ("per me", "for me.", []), ("per te", "for you.", []),
    ("Guarda un pò, mio caro Figaro", "Just look, my dear Figaro,", [(0, 2, "just look")]),
    ("guarda un pò", "just look,", [(0, 2, "just look")]),
    ("guarda adesso il mio capello", "look at my hat now.", []),
    ("il mio capello", "my hat.", []),
    ("Sì, mio core, or è più bello", "Yes, my heart, now it's prettier still;", [(4, 5, "prettier")]),
    ("sì, mio core", "yes, my heart,", []),
    ("or è più bello", "now it's prettier still;", [(2, 3, "prettier")]),
    ("ah il mattino alle nozze vicino", "Ah, on the morning so close to the wedding,", []),
    ("quant' è dolce al mio tenero sposo", "how sweet it is for my loving bridegroom", []),
    ("quant' è dolce al tuo tenero sposo", "how sweet it is for your loving bridegroom", []),
    ("questo bel capellino vezzoso", "this pretty, charming little hat", []),
    ("che Susanna ella stessa si fè", "that Susanna made herself.", [(4, 5, "made for herself")]),
    ("che Susanna", "that Susanna", []), ("Susanna", "Susanna", []), ("ella stessa", "herself", []),
    ("stessa si fè", "made herself.", [(1, 2, "made for herself")]),
    ("stessa", "herself,", []), ("si fè", "made herself.", [(0, 1, "made for herself")]),
    # recitative
    ("Cosa stai misurando, caro il mio Figaretto?", "What are you measuring, my dear Figaro?", [(1, 2, "are you measuring")]),
    ("Io guardo se quel letto, che ci destina il conte", "I'm checking whether the bed the Count is giving us", [(5, 7, "is giving us")]),
    ("farà buona figura in questo loco.", "will look good in this spot.", [(0, 2, "will look good")]),
    ("In questa stanza?...", "In this room?…", []),
    ("Certo,", "Certainly:", []),
    ("a noi la cede generoso il padrone.", "our master generously gives it to us.", [(0, 3, "gives it to us")]),
    ("Io per me te la dono.", "As for me, you can have it.", [(0, 2, "as for me"), (3, 5, "I give it to you")]),
    ("E la ragione?", "And the reason?", []),
    ("La ragione l'ho quì.", "I have my reason here.", []),
    ("Perchè non puoi far, che passi un pò quì.", "Why can't you let a little of it pass in here?", [(5, 7, "pass a little")]),
    ("Perchè non voglio;", "Because I don't want to.", []),
    ("sei tu mio servo, o no?", "Are you my servant or not?", []),
    ("Ma non capisco", "But I don't understand", []),
    ("perchè tanto ti spiace", "why you so dislike", [(2, 3, "you dislike")]),
    ("la più comoda stanza del palazzo?", "the most convenient room in the palace.", [(0, 2, "the most convenient")]),
    ("Perch'io son la Susanna e tu sei pazzo.", "Because I'm Susanna and you're mad.", []),
    ("Grazie,", "Thank you,", []),
    ("non tanti elogi,", "not so many compliments!", []),
    ("guarda un poco, se potria meglio stàre in altro loco.", "Look whether it could stand better anywhere else.", [(0, 2, "look"), (8, 9, "anywhere else")]),
]


def sung(path):
    """per role: list of (bar, word as printed, elided-with-next) in order"""
    r = ET.parse(path).getroot()
    out = {}
    for p in r.findall("part"):
        if p.get("id") not in ("P1", "P2"):
            continue
        role = "susanna" if p.get("id") == "P1" else "figaro"
        seq, cur, sb, joined = [], "", None, []
        for m in p.findall("measure"):
            b = int(m.get("number"))
            for n in m.iter("note"):
                l = n.find("lyric")
                if l is None:
                    continue
                texts = [x.text for x in l.findall("text")]
                for k, t in enumerate(texts):
                    if not cur:
                        sb = b
                    cur += t
                    last_piece = k == len(texts) - 1
                    if not last_piece or l.findtext("syllabic") in ("single", "end"):
                        seq.append([sb, cur, not last_piece])
                        cur = ""
        out[role] = seq
    return out


def ipa_of(words, elided):
    out = ""
    for i, w in enumerate(words):
        ipa = look(w)[1]
        out += ipa + ("‿" if elided[i] else (" " if i < len(words) - 1 else ""))
    return out.strip()


def build(path, edition, notes):
    S = sung(path)
    phrases = []
    count = {}
    for role in ("susanna", "figaro") if edition.endswith("vien") else ("figaro", "susanna"):
        pass
    for role, seq in S.items():
        i = 0
        units = sorted(U, key=lambda u: -len(u[0].split()))
        while i < len(seq):
            best = None
            for txt, tr, gg in units:
                uw = txt.split()
                if i + len(uw) <= len(seq) and all(key(uw[j]) == key(seq[i + j][1]) for j in range(len(uw))):
                    best = (txt, tr, gg)
                    break
            if not best:
                raise SystemExit(f"{role}: no unit for '{seq[i][1]}' at bar {seq[i][0]}: {' '.join(w for _, w, _ in seq[i:i + 8])}")
            txt, tr, gg = best
            uw = txt.split()
            n = len(uw)
            chunk = seq[i:i + n]
            words = [w for _, w, _ in chunk]
            original = " ".join(words)
            elided = [e for _, _, e in chunk]
            k = (role, key(original))
            count[k] = count.get(k, 0) + 1
            entry = {
                "id": "",
                "role": role,
                "verse": 1,
                "occurrence": count[k],
                "startMeasure": str(chunk[0][0]),
                "original": original,
                "translation": tr,
                "ipa": ipa_of(words, elided),
                "words": [[w, D[key(w)][0], D[key(w)][1]] for w in words],
                "glossGroups": [{"words": list(range(a, b + 1)), "gloss": g} for a, b, g in gg],
                "audio": {},
            }
            phrases.append(entry)
            i += n
    phrases.sort(key=lambda p: (int(p["startMeasure"]), 0 if p["role"] == "figaro" else 1))
    for j, p in enumerate(phrases):
        p["id"] = f"{p['role'][0]}{j + 1:02d}"
    return {"editionId": edition, "language": "it", "review": {"status": "unreviewed-fixture"}, "notes": notes, "phrases": phrases}


if __name__ == "__main__":
    note = ("Libretto by Lorenzo Da Ponte (1786). Words follow the engraving's spelling (pò, fè, quì, perchè, capello). "
            "IPA follows sung Italian conventions: stressed syllable marked, elisions joined with ‿, open e/o as ɛ/ɔ, "
            "intervocalic s voiced; capello/capellino are sung with a double p (cappello). Translation literal, for meaning.")
    for path, ed in (("app/duettino.musicxml", "mozart-cinque-dieci-venti"), ("app/recit.musicxml", "mozart-cosa-stai-misurando")):
        L = build(path, ed, note)
        json.dump(L, open(path.replace(".musicxml", ".language.json"), "w"), ensure_ascii=False, indent=1)
        print(ed, len(L["phrases"]), "phrases")
