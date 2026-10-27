/**
 * Generates the MusicXML for Counterpart's two ORIGINAL development fixtures.
 *
 * These are short pieces written for this MVP so the app can be developed without licensed
 * repertoire. They are NOT genuine arias or ensembles and must not be presented as such.
 *
 * The rest of each prepared piece (manifest, language content, audio, licence records) is authored
 * by hand in content/pieces/<id>/ and validated by scripts/import-content.ts.
 *
 *   npx tsx scripts/compose-fixtures.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";

type Clef = "treble" | "treble8vb" | "bass";

interface MeasureMeta {
  // bpm is always quarter notes per minute (what <sound tempo> means); dottedDisplay shows ♩. = n in compound metres
  tempo?: { q?: number; bpm: number; text?: string; metronome?: boolean; dottedDisplay?: number }[];
  words?: { q?: number; text: string }[];
  rehearsal?: string;
  repeatStart?: boolean;
  repeatEnd?: boolean;
  final?: boolean;
  double?: boolean;
}

interface PartDef {
  id: string;
  name: string;
  abbr: string;
  instrument: string;
  midiProgram: number;
  clefs: Clef[];
  staves: string[][]; // staves[s][measureIdx] = token string
}

interface PieceDef {
  file: string;
  title: string;
  subtitle: string;
  composer: string;
  lyricist: string;
  rights: string;
  fifths: number;
  time: [number, number];
  measures: number;
  meta: Record<number, MeasureMeta>; // 1-based measure numbers
  parts: PartDef[];
}

const DIV = 4; // divisions per quarter
const DUR: Record<string, number> = { w: 16, h: 8, q: 4, e: 2, s: 1 };
const TYPE: Record<string, string> = { w: "whole", h: "half", q: "quarter", e: "eighth", s: "16th" };
const STEP_SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];

function keyAlter(fifths: number, step: string): number {
  if (fifths > 0 && SHARP_ORDER.slice(0, fifths).includes(step)) return 1;
  if (fifths < 0 && FLAT_ORDER.slice(0, -fifths).includes(step)) return -1;
  return 0;
}

interface Pitch {
  step: string;
  alter: number;
  octave: number;
  tie: boolean;
}
function parsePitch(s: string): Pitch {
  const m = s.trim().match(/^([A-G])(#|b)?(\d)(~)?$/);
  if (!m) throw new Error(`bad pitch '${s}'`);
  return { step: m[1], alter: m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0, octave: Number(m[3]), tie: !!m[4] };
}

interface Token {
  kind: "note" | "rest" | "mrest" | "dyn";
  pitches: Pitch[];
  dur: number;
  type?: string;
  dot: boolean;
  tieAll: boolean;
  fermata: boolean;
  lyrics: (string | null)[]; // per verse; null = none
  dyn?: string;
}

function parseToken(tok: string): Token {
  if (tok.startsWith("@")) return { kind: "dyn", pitches: [], dur: 0, dot: false, tieAll: false, fermata: false, lyrics: [], dyn: tok.slice(1) };
  if (tok === "R") return { kind: "mrest", pitches: [], dur: 0, dot: false, tieAll: false, fermata: false, lyrics: [] };
  const m = tok.match(/^(r|\[[^\]]+\]|[A-G](?:#|b)?\d)(w|h|q|e|s)(\.)?(~)?(!)?(?::(.*))?$/);
  if (!m) throw new Error(`bad token '${tok}'`);
  const [, head, d, dot, tie, ferm, lyr] = m;
  const dur = DUR[d] * (dot ? 1.5 : 1);
  const lyrics = lyr === undefined ? [] : lyr.split("|").map((v) => (v === "" || v === "_" ? null : v));
  if (head === "r") return { kind: "rest", pitches: [], dur, type: TYPE[d], dot: !!dot, tieAll: false, fermata: !!ferm, lyrics: [] };
  const pitches = head.startsWith("[") ? head.slice(1, -1).split(",").map(parsePitch) : [parsePitch(head)];
  return { kind: "note", pitches, dur, type: TYPE[d], dot: !!dot, tieAll: !!tie, fermata: !!ferm, lyrics };
}

function syllabic(s: string): { text: string; syl: string } {
  const b = s.startsWith("-");
  const e = s.endsWith("-");
  const text = s.replace(/^-/, "").replace(/-$/, "");
  const syl = b && e ? "middle" : b ? "end" : e ? "begin" : "single";
  return { text, syl };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function clefXml(c: Clef, n?: number): string {
  const num = n ? ` number="${n}"` : "";
  if (c === "bass") return `<clef${num}><sign>F</sign><line>4</line></clef>`;
  if (c === "treble8vb") return `<clef${num}><sign>G</sign><line>2</line><clef-octave-change>-1</clef-octave-change></clef>`;
  return `<clef${num}><sign>G</sign><line>2</line></clef>`;
}

function directionXml(meta: MeasureMeta | undefined, q: number, includeTempo: boolean): string {
  if (!meta) return "";
  let out = "";
  const at = (x?: number) => (x ?? 0) === q;
  if (includeTempo && meta.rehearsal && q === 0)
    out += `<direction placement="above"><direction-type><rehearsal enclosure="square">${esc(meta.rehearsal)}</rehearsal></direction-type></direction>`;
  if (includeTempo)
    for (const t of meta.tempo ?? [])
      if (at(t.q)) {
        if (!t.text && t.metronome === false) {
          // an unmarked tempo change (e.g. inside a rit.): a measure-level <sound>; a <direction> must have a <direction-type>
          out += `<sound tempo="${t.bpm}"/>`;
          continue;
        }
        out += `<direction placement="above">`;
        if (t.text) out += `<direction-type><words font-weight="bold">${esc(t.text)}</words></direction-type>`;
        if (t.metronome !== false)
          out += t.dottedDisplay
            ? `<direction-type><metronome parentheses="no"><beat-unit>quarter</beat-unit><beat-unit-dot/><per-minute>${t.dottedDisplay}</per-minute></metronome></direction-type>`
            : `<direction-type><metronome parentheses="no"><beat-unit>quarter</beat-unit><per-minute>${t.bpm}</per-minute></metronome></direction-type>`;
        out += `<sound tempo="${t.bpm}"/></direction>`;
      }
  if (includeTempo)
    for (const w of meta.words ?? [])
      if (at(w.q)) out += `<direction placement="above"><direction-type><words font-style="italic">${esc(w.text)}</words></direction-type></direction>`;
  return out;
}

const DYN_SOUND: Record<string, number> = { pp: 36, p: 54, mp: 71, mf: 89, f: 106, ff: 124 };

function buildPart(piece: PieceDef, part: PartDef, isFirst: boolean): string {
  const mDur = (piece.time[0] * 16) / piece.time[1]; // in divisions (DIV=4 per quarter)
  const lines: string[] = [];
  // pending tie stops per staff: key "step-alter-octave"
  const pendingTies: Map<string, boolean>[] = part.staves.map(() => new Map());
  for (let mi = 0; mi < piece.measures; mi++) {
    const num = mi + 1;
    const meta = piece.meta[num];
    let xml = `<measure number="${num}">`;
    if (meta?.repeatStart) xml += `<barline location="left"><bar-style>heavy-light</bar-style><repeat direction="forward"/></barline>`;
    if (mi === 0) {
      xml += `<attributes><divisions>${DIV}</divisions><key><fifths>${piece.fifths}</fifths><mode>major</mode></key>`;
      xml += `<time><beats>${piece.time[0]}</beats><beat-type>${piece.time[1]}</beat-type></time>`;
      if (part.staves.length > 1) xml += `<staves>${part.staves.length}</staves>`;
      part.clefs.forEach((c, i) => (xml += clefXml(c, part.staves.length > 1 ? i + 1 : undefined)));
      xml += `</attributes>`;
    }
    for (let s = 0; s < part.staves.length; s++) {
      const src = part.staves[s][mi];
      if (src === undefined) throw new Error(`${piece.file} ${part.id} staff ${s + 1} missing measure ${num}`);
      const toks = src.trim().split(/\s+/).filter(Boolean).map(parseToken);
      if (s > 0) xml += `<backup><duration>${mDur}</duration></backup>`;
      const voice = s === 0 ? "1" : "5";
      let pos = 0;
      let n = 0;
      const measureAlters = new Map<string, number>(); // step+octave -> alter shown in this measure
      for (let ti = 0; ti < toks.length; ti++) {
        const t = toks[ti];
        if (t.kind === "dyn") {
          xml += `<direction placement="${part.staves.length > 1 ? "below" : "above"}"><direction-type><dynamics><${t.dyn}/></dynamics></direction-type><sound dynamics="${DYN_SOUND[t.dyn!]}"/></direction>`;
          continue;
        }
        if (s === 0) xml += directionXml(meta, pos / DIV, isFirst);
        n++;
        if (t.kind === "mrest") {
          xml += `<note id="${part.id}-m${num}-s${s + 1}-n${n}"><rest measure="yes"/><duration>${mDur}</duration><voice>${voice}</voice>${part.staves.length > 1 ? `<staff>${s + 1}</staff>` : ""}</note>`;
          pos += mDur;
          continue;
        }
        if (t.kind === "rest") {
          xml += `<note id="${part.id}-m${num}-s${s + 1}-n${n}"><rest/><duration>${t.dur}</duration><voice>${voice}</voice><type>${t.type}</type>${t.dot ? "<dot/>" : ""}${part.staves.length > 1 ? `<staff>${s + 1}</staff>` : ""}${t.fermata ? `<notations><fermata type="upright"/></notations>` : ""}</note>`;
          pos += t.dur;
          continue;
        }
        // melisma: does the next note in this staff (possibly in the next measure) carry no lyric?
        const nextSrc = part.staves[s][mi + 1];
        const nextMeasureToks = nextSrc ? nextSrc.trim().split(/\s+/).filter(Boolean).map(parseToken) : [];
        const next = [...toks.slice(ti + 1), ...nextMeasureToks].find((x) => x.kind === "note" || x.kind === "rest" || x.kind === "mrest");
        t.pitches.forEach((p, ci) => {
          const id = `${part.id}-m${num}-s${s + 1}-n${n}${ci ? `c${ci}` : ""}`;
          const key = `${p.step}${p.alter}${p.octave}`;
          const tieStop = pendingTies[s].get(key) === true;
          if (tieStop) pendingTies[s].delete(key);
          const tieStart = p.tie || t.tieAll;
          if (tieStart) pendingTies[s].set(key, true);
          let acc = "";
          const so = `${p.step}${p.octave}`;
          const expected = measureAlters.has(so) ? measureAlters.get(so)! : keyAlter(piece.fifths, p.step);
          if (p.alter !== expected && !tieStop) acc = p.alter === 1 ? "sharp" : p.alter === -1 ? "flat" : "natural";
          measureAlters.set(so, p.alter);
          let nx = `<note id="${id}">${ci ? "<chord/>" : ""}<pitch><step>${p.step}</step>${p.alter ? `<alter>${p.alter}</alter>` : ""}<octave>${p.octave}</octave></pitch>`;
          nx += `<duration>${t.dur}</duration>`;
          if (tieStop) nx += `<tie type="stop"/>`;
          if (tieStart) nx += `<tie type="start"/>`;
          nx += `<voice>${voice}</voice><type>${t.type}</type>${t.dot ? "<dot/>" : ""}`;
          if (acc) nx += `<accidental>${acc}</accidental>`;
          if (part.staves.length > 1) nx += `<staff>${s + 1}</staff>`;
          const notations: string[] = [];
          if (tieStop) notations.push(`<tied type="stop"/>`);
          if (tieStart) notations.push(`<tied type="start"/>`);
          if (t.fermata && ci === 0) notations.push(`<fermata type="upright"/>`);
          if (notations.length) nx += `<notations>${notations.join("")}</notations>`;
          if (ci === 0) {
            t.lyrics.forEach((ly, vi) => {
              if (!ly) return;
              const parts = ly.split("‿").map(syllabic);
              const nextLy = next?.lyrics?.[vi] ?? null;
              const melismaFollows = next && next.kind === "note" && nextLy === null && (next.lyrics.length > 0 || t.lyrics.length > 0);
              const lastSyl = parts[parts.length - 1].syl;
              nx += `<lyric number="${vi + 1}">`;
              parts.forEach((pp, k) => {
                if (k > 0) nx += `<elision>‿</elision>`;
                nx += `<syllabic>${pp.syl}</syllabic><text>${esc(pp.text)}</text>`;
              });
              if (melismaFollows && (lastSyl === "single" || lastSyl === "end")) nx += `<extend type="start"/>`;
              nx += `</lyric>`;
            });
          }
          nx += `</note>`;
          xml += nx;
        });
        pos += t.dur;
      }
      if (pos !== mDur) throw new Error(`${piece.file} ${part.id} m${num} staff ${s + 1}: ${pos}/${mDur} divisions`);
    }
    if (meta?.repeatEnd) xml += `<barline location="right"><bar-style>light-heavy</bar-style><repeat direction="backward" times="2"/></barline>`;
    else if (meta?.final) xml += `<barline location="right"><bar-style>light-heavy</bar-style></barline>`;
    else if (meta?.double) xml += `<barline location="right"><bar-style>light-light</bar-style></barline>`;
    xml += `</measure>`;
    lines.push(xml);
  }
  return `<part id="${part.id}">\n${lines.join("\n")}\n</part>`;
}

function buildScore(piece: PieceDef): string {
  const partList = piece.parts
    .map(
      (p) =>
        `<score-part id="${p.id}"><part-name>${esc(p.name)}</part-name><part-abbreviation>${esc(p.abbr)}</part-abbreviation>` +
        `<score-instrument id="${p.id}-I1"><instrument-name>${esc(p.instrument)}</instrument-name></score-instrument>` +
        `<midi-instrument id="${p.id}-I1"><midi-program>${p.midiProgram + 1}</midi-program></midi-instrument></score-part>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
<work><work-title>${esc(piece.title)}</work-title></work>
<movement-title>${esc(piece.subtitle)}</movement-title>
<identification>
<creator type="composer">${esc(piece.composer)}</creator>
<creator type="lyricist">${esc(piece.lyricist)}</creator>
<rights>${esc(piece.rights)}</rights>
<encoding><software>Counterpart fixture composer (scripts/compose-fixtures.ts)</software><encoding-date>2026-10-26</encoding-date></encoding>
</identification>
<part-list>
${partList}
</part-list>
${piece.parts.map((p, i) => buildPart(piece, p, i === 0)).join("\n")}
</score-partwise>
`;
}

/* ------------------------------------------------------------------ */
/* Accompaniment helpers                                               */
/* ------------------------------------------------------------------ */

/** Broken-chord left hand, four eighths per half bar (4/4). */
const LH4: Record<string, string> = {
  F: "F2e C3e A3e C3e",
  Gm: "G2e D3e Bb3e D3e",
  Gm7: "G2e D3e F3e D3e",
  C7: "C3e G3e Bb3e G3e",
  C: "C3e G3e E3e G3e",
  Dm: "D2e A2e F3e A2e",
  A7: "A2e E3e G3e E3e",
  Bb: "Bb1e F2e D3e F2e",
};
/** Right-hand chord voicings kept below the vocal line. */
const RH: Record<string, string> = {
  F: "[A3,C4,F4]",
  Gm: "[Bb3,D4,G4]",
  Gm7: "[Bb3,D4,F4]",
  C7: "[Bb3,C4,E4]",
  C: "[G3,C4,E4]",
  Dm: "[A3,D4,F4]",
  A7: "[G3,C#4,E4]",
  Bb: "[Bb3,D4,F4]",
};
const lh = (a: string, b: string) => `${LH4[a]} ${LH4[b]}`;
const rhHalves = (a: string, b: string) => `${RH[a]}h ${RH[b]}h`;
const rhQuarters = (a: string, b: string) => `${RH[a]}q ${RH[a]}q ${RH[b]}q ${RH[b]}q`;

/* ------------------------------------------------------------------ */
/* Fixture A — aria for soprano and piano                              */
/* ------------------------------------------------------------------ */

const ARIA_HARMONY: [string, string][] = [
  ["F", "F"], ["Gm", "C7"], ["F", "Dm"], ["Gm7", "C7"], // 1–4 introduction
  ["F", "F"], ["F", "Gm"], ["C7", "C7"], ["F", "C7"], // 5–8
  ["Bb", "Bb"], ["C", "C7"], ["Gm7", "C7"], ["F", "F"], // 9–12
  ["Dm", "Dm"], ["A7", "A7"], ["Gm", "C7"], ["C7", "C7"], // 13–16 più mosso
  ["F", "F"], ["F", "Gm"], ["Bb", "C7"], ["F", "F"], // 17–20
];

const ariaSoprano = [
  "R", "R", "R", "R",
  // m5–12, two verses (lyric 1 | lyric 2)
  "@mp C5q.:Lu-|Ven- A4e:-me|-to F4q:di|d'a- A4q:se-|-pri-",
  "C5h:-ra,|-le, A4q:dol-|por- Bb4q:-ce‿e|-ta‿il",
  "C5q.:lon-|mio D5e:-ta-|can- C5h:-no,|-to,",
  "rh rq C5q:scen-|là",
  "D5q.:-di|do- E5e:sul|-ve‿il F5h:ma-|cuo-",
  "E5q:_|_ D5q:-re,|-re Bb4q:po-|so- A4q:-sa|-spi-",
  "G4h:la|-ra C5q:ma-|tan- Bb4q:_|_",
  "A4h:-no.|-to. rh",
  // m13–16 più mosso
  "@f A4q:Ah! Bb4e:_ C5e:_ D5q:_ F5q:_",
  "E5h:_ rq A4q:non",
  "D5q:tar- C5q:-da- Bb4h:-re,",
  "G4q:tor- A4q:-na Bb4q:da G4q:me!",
  // m17–20 reprise
  "@p C5q.:Lu- A4e:-me F4q:di A4q:se-",
  "C5h:-ra, A4q:re- Bb4q:-sta",
  "D5h:con C5q:me, Bb4q:_",
  "A4w!:_",
];

const ariaRH = [
  "@p C5q. A4e F4q A4q",
  "Bb4h A4q G4q",
  "A4q. C5e F5q D5q",
  "C5h Bb4h",
  "@mp " + rhHalves("F", "F"),
  rhHalves("F", "Gm"),
  rhHalves("C7", "C7"),
  rhHalves("F", "C7"),
  rhHalves("Bb", "Bb"),
  rhHalves("C", "C7"),
  rhHalves("Gm7", "C7"),
  `${RH.F}h C5e Bb4e A4e G4e`,
  "@f " + rhQuarters("Dm", "Dm"),
  rhQuarters("A7", "A7"),
  rhQuarters("Gm", "C7"),
  rhQuarters("C7", "C7"),
  "@p " + rhHalves("F", "F"),
  rhHalves("F", "Gm"),
  rhHalves("Bb", "C7"),
  "[A3,C4,F4]w!",
];
const ariaLH = ARIA_HARMONY.map(([a, b], i) => (i === 19 ? "[F2,C3]w!" : lh(a, b)));

const aria: PieceDef = {
  file: "content/pieces/cp-fx-aria-lume/score.musicxml",
  title: "Lume di sera",
  subtitle: "Aria (development fixture — original, not genuine repertoire)",
  composer: "Counterpart fixture (original, 2026)",
  lyricist: "Counterpart fixture (original Italian text, 2026)",
  rights: "Original development fixture created for the Counterpart MVP. CC0 1.0. Not a genuine aria.",
  fifths: -1,
  time: [4, 4],
  measures: 20,
  meta: {
    1: { tempo: [{ bpm: 66, text: "Andante" }] },
    4: { double: true },
    5: { rehearsal: "A", repeatStart: true },
    12: { repeatEnd: true },
    13: { rehearsal: "B", tempo: [{ bpm: 84, text: "Più mosso" }] },
    16: { double: true },
    17: { rehearsal: "C", tempo: [{ bpm: 66, text: "Tempo I" }] },
    19: { words: [{ text: "rit." }], tempo: [{ bpm: 60, metronome: false }, { q: 2, bpm: 54, metronome: false }] },
    20: { tempo: [{ bpm: 46, metronome: false }], final: true },
  },
  parts: [
    { id: "P1", name: "Clara (Soprano)", abbr: "Cl.", instrument: "Voice", midiProgram: 0, clefs: ["treble"], staves: [ariaSoprano] },
    { id: "P2", name: "Piano", abbr: "Pno.", instrument: "Piano", midiProgram: 0, clefs: ["treble", "bass"], staves: [ariaRH, ariaLH] },
  ],
};

/* ------------------------------------------------------------------ */
/* Fixture B — ensemble (terzetto) for soprano, tenor, baritone, piano */
/* ------------------------------------------------------------------ */

const W_LH: Record<string, string> = {
  Bb: "Bb1q [F2,Bb2,D3]q [F2,Bb2,D3]q",
  Eb: "Eb2q [G2,Bb2,Eb3]q [G2,Bb2,Eb3]q",
  F7: "F2q [A2,C3,Eb3]q [A2,C3,Eb3]q",
  Gm: "G2q [Bb2,D3,G3]q [Bb2,D3,G3]q",
  Cm: "C2q [G2,C3,Eb3]q [G2,C3,Eb3]q",
};
const W_RH: Record<string, string> = {
  Bb: "[D4,F4,Bb4]",
  Eb: "[Eb4,G4,Bb4]",
  F7: "[C4,Eb4,A4]",
  Gm: "[D4,G4,Bb4]",
  Cm: "[C4,Eb4,G4]",
};

const ensSoprano = [
  "R", "R", "R", "R", "R", "R",
  "@mf D5h:Re- Bb4q:-sta,",
  "Eb5q:ti C5q:pre- G4q:-go,",
  "A4q:non C5q:mi Eb5q:la-",
  "D5q:-sciar! C5q:_ Bb4q:_",
  "R", "R",
  "@p F5h:Ad- D5q:-dio,",
  "Eb5q:mio G5q:be- F5q:-ne,",
  "D5h:ad- C5q:-dio!",
  "Bb4h.!:_",
];
const ensTenor = [
  "R", "R",
  "@mf F3q:Già Bb3q:l'al- D4q:-ba",
  "Eb4h:chia- G3q:-ma,",
  "F3q:de- A3q:-vo C4q:par-",
  "Bb3h.:-tir.",
  "R", "R",
  "@mp C4h:de- A3q:-vo",
  "F3q:par- Bb3h:-tir!",
  "R", "R",
  "@p D4h:Ad- Bb3q:-dio,",
  "G3h:ad- A3q:-dio,",
  "Bb3h:a- A3q:-mor",
  "Bb3h.!:_",
];
const ensBaritone = [
  "R", "R", "R", "R", "R", "R", "R", "R", "R", "R",
  "@f Eb3e:Il G3e:so- Bb3q:-le G3q:sor-",
  "F3q:-ge‿è A3e:tem- C4e:-po‿an- F3q:-diam!",
  "@p Bb2h:An- D3q:-dia-",
  "Eb3h:-mo‿an- F3q:-diam,",
  "F3h:ad- F3q:-dio!",
  "Bb2h.!:_",
];
const ensRH = [
  "@mp Bb4q D5q F5q",
  "Eb5h C5q",
  `${W_RH.Bb}h.`,
  `${W_RH.Eb}h.`,
  `${W_RH.F7}h.`,
  `${W_RH.Bb}h.`,
  `${W_RH.Gm}h.`,
  "[C4~,Eb4~,G4]h.", // C and E♭ are tied into m. 9 (used to test cut-boundary flagging)
  `${W_RH.F7}h.`,
  `${W_RH.Bb}h.`,
  `${W_RH.Eb}h.`,
  `${W_RH.F7}h.`,
  `@p ${W_RH.Bb}h.`,
  `${W_RH.Eb}h ${W_RH.F7}q`,
  `${W_RH.Bb}h ${W_RH.F7}q`,
  "[D4,F4,Bb4]h.!",
];
const ensLH = [
  W_LH.Bb, W_LH.F7, W_LH.Bb, W_LH.Eb, W_LH.F7, W_LH.Bb,
  W_LH.Gm, W_LH.Cm, W_LH.F7, W_LH.Bb, W_LH.Eb, W_LH.F7,
  W_LH.Bb,
  "Eb2q [G2,Bb2,Eb3]q F2q",
  "F2q [Bb2,D3]q [A2,C3,Eb3]q",
  "[Bb1,F2,Bb2]h.!",
];

const ensemble: PieceDef = {
  file: "content/pieces/cp-fx-terzetto-alba/score.musicxml",
  title: "Già l'alba chiama",
  subtitle: "Terzetto (development fixture — original, not genuine repertoire)",
  composer: "Counterpart fixture (original, 2026)",
  lyricist: "Counterpart fixture (original Italian text, 2026)",
  rights: "Original development fixture created for the Counterpart MVP. CC0 1.0. Not a genuine ensemble.",
  fifths: -2,
  time: [3, 4],
  measures: 16,
  meta: {
    1: { tempo: [{ bpm: 104, text: "Allegretto" }] },
    3: { rehearsal: "A" },
    7: { rehearsal: "B" },
    11: { rehearsal: "C" },
    12: { double: true },
    13: { rehearsal: "D", tempo: [{ bpm: 80, text: "Meno mosso" }] },
    16: { tempo: [{ bpm: 60, metronome: false }], final: true },
  },
  parts: [
    { id: "P1", name: "Clara (Soprano)", abbr: "Cl.", instrument: "Voice", midiProgram: 0, clefs: ["treble"], staves: [ensSoprano] },
    { id: "P2", name: "Davide (Tenor)", abbr: "Dav.", instrument: "Voice", midiProgram: 0, clefs: ["treble8vb"], staves: [ensTenor] },
    { id: "P3", name: "Ettore (Baritone)", abbr: "Ett.", instrument: "Voice", midiProgram: 0, clefs: ["bass"], staves: [ensBaritone] },
    { id: "P4", name: "Piano", abbr: "Pno.", instrument: "Piano", midiProgram: 0, clefs: ["treble", "bass"], staves: [ensRH, ensLH] },
  ],
};


/* ------------------------------------------------------------------ */
/* Puccini, "O mio babbino caro" (Gianni Schicchi, 1918) — voice and piano   */
/* UNVERIFIED TRANSCRIPTION. Vocal pitches follow two published letter-note  */
/* versions of the melody (A♭ and F, one note line per text line). Rhythm,   */
/* syllable placement, intro/postlude and the piano part were reconstructed  */
/* for this app and have not been checked against the Ricordi vocal score.   */
/* ------------------------------------------------------------------ */

const B_RH: Record<string, string> = { I: "[C4,Eb4,Ab4]", ii7: "[Db4,F4,Ab4]", vi: "[C4,F4,Ab4]", V7: "[Db4,Eb4,G4]", V: "[Eb4,G4,Bb4]", IV: "[Db4,F4,Ab4]" };
const B_LH: Record<string, string> = { I: "Ab2", ii7: "Bb2", vi: "F2", V7: "Eb2", V: "Eb2", IV: "Db3" };
/** 6/8 accompaniment: bass on each dotted-quarter beat, soft repeated chords on the off-beats. */
const accRH = (a: string, b: string) => `re ${B_RH[a]}e ${B_RH[a]}e re ${B_RH[b]}e ${B_RH[b]}e`;
const accLH = (a: string, b: string) => `${B_LH[a]}q. ${B_LH[b]}q.`;
const B_HARMONY: [string, string][] = [
  ["I", "I"], ["I", "V7"], ["ii7", "ii7"], ["vi", "vi"], ["V7", "IV"], ["I", "I"], // bars 5–10
  ["ii7", "V7"], ["V", "V7"], ["I", "V7"], ["ii7", "V7"], ["ii7", "ii7"], ["vi", "vi"], // 11–16
  ["IV", "V7"], ["I", "I"], ["ii7", "IV"], ["I", "vi"], ["IV", "V7"], ["IV", "V7"], // 17–22
  ["ii7", "IV"], ["V7", "I"], ["I", "ii7"], ["vi", "V7"], ["I", "ii7"], ["IV", "I"], // 23–28
];

const babVoice = [
  "R", "R", "R", "R",
  "@p Ab4q.:O Ab4e:mi- Ab4e:-o Ab4e:bab-", // 5
  "C5q:-bi- G4e:-no F4e:ca- Eb4e:-ro, Ab4e:mi",
  "Bb4q:pia- C5e:-ce‿è Ab4q:bel- Ab4e:-lo,",
  "Ab5q.:bel- Eb5q:-lo; C5e:vo'‿an-",
  "Eb5q:-da- Bb4e:-re‿in Db5q:Por- C5e:-ta",
  "Ab4q.:Ros- Ab4q:-sa Ab4e:a", // 10
  "Bb4q:com- C5e:-pe- Ab4q:-rar G4e:l'a-",
  "Bb4q.:-nel- Bb4q:-lo! Eb4e:Sì,",
  "Ab4q:sì, C5e:ci Ab4q:vo- G4e:-glio‿an-",
  "F4q.:-da- Eb4q:-re! Ab4e:e",
  "@mf Bb4q:se C5e:l'a- Ab4q:-mas- Ab4e:-si‿in-", // 15
  "Ab5q.:-dar- Eb5q:-no, F5e:an-",
  "Ab5q:-drei F5e:sul Eb5q:Pon- Db5e:-te",
  "Eb5q.:Vec- C5q:-chio, Ab4e:ma",
  "Bb4q:per C5e:but- Ab4q:-tar- F4e:-mi‿in",
  "Ab4q.:Ar- Ab4q:-no! F5e:Mi", // 20
  "@f Ab5q:strug- F5e:-go‿e Eb5q:mi Db5e:tor-",
  "Ab5q.:-men- Eb5e:-to! Db5e:_ C5e:O",
  "F5q.!:Di- Db5q:-o, C5e:vor-",
  "Bb4q:-rei Ab4e:mo- Ab4q.:-rir!",
  "Ab4e:Bab- Bb4e:-bo, C5e:pie- Ab4q.:-tà,", // 25
  "rq Ab5e:pie- Eb5q.:-tà!",
  "@p Ab4e:Bab- Bb4e:-bo, C5e:pie- Ab4q.:-tà,",
  "rq F4e:pie- Ab4q.~:-tà!",
  "Ab4q.:_ rq.",
  "R", // 30
];

const babRH = [
  "@p Ab4q Bb4e C5q Ab4e",
  "Ab5q. Eb5q.",
  "Db5q C5e Bb4q.",
  "[C4,Eb4,Ab4]q. [Db4,Eb4,G4]q.",
  ...B_HARMONY.map(([a, b], i) => (i === 0 ? "@p " : i === 16 ? "@mf " : i === 22 ? "@pp " : "") + accRH(a, b)),
  "@pp Ab4e Bb4e C5e Ab4q.",
  "[C4,Eb4,Ab4]h.!",
];
const babLH = [
  "Ab2e Eb3e Ab3e C4e Ab3e Eb3e",
  "F2e C3e F3e Eb2e Bb2e Db3e",
  "Db2e Ab2e F3e Eb2e Bb2e G3e",
  "Ab2e Eb3e C4e Eb2e Bb2e Db3e",
  ...B_HARMONY.map(([a, b]) => accLH(a, b)),
  "Ab2e Eb3e Ab3e C4e Ab3e Eb3e",
  "[Ab1,Ab2]h.!",
];

const babbino: PieceDef = {
  file: "content/pieces/puccini-o-mio-babbino-caro/score.musicxml",
  title: "O mio babbino caro",
  subtitle: "Lauretta's aria from Gianni Schicchi (unverified transcription)",
  composer: "Giacomo Puccini",
  lyricist: "Giovacchino Forzano",
  rights:
    "Music: Giacomo Puccini (1858–1924), public domain. Libretto: Giovacchino Forzano (1884–1970), first published 1918. This encoding is an unverified transcription made for the Counterpart MVP.",
  fifths: -4,
  time: [6, 8],
  measures: 30,
  meta: {
    1: { tempo: [{ bpm: 84, text: "Andantino ingenuo", dottedDisplay: 56 }] },
    5: { rehearsal: "A" },
    13: { rehearsal: "B" },
    21: { rehearsal: "C" },
    23: { tempo: [{ bpm: 60, metronome: false }, { q: 1.5, bpm: 84, metronome: false }] },
    25: { rehearsal: "D" },
    28: { words: [{ text: "rit." }], tempo: [{ bpm: 74, metronome: false }] },
    29: { tempo: [{ bpm: 62, metronome: false }] },
    30: { tempo: [{ bpm: 50, metronome: false }], final: true },
  },
  parts: [
    { id: "P1", name: "Lauretta (Soprano)", abbr: "Lau.", instrument: "Voice", midiProgram: 0, clefs: ["treble"], staves: [babVoice] },
    { id: "P2", name: "Piano", abbr: "Pno.", instrument: "Piano", midiProgram: 0, clefs: ["treble", "bass"], staves: [babRH, babLH] },
  ],
};

// "O mio babbino caro" now uses the engraving from cafe-puccini.dk (CC BY-NC-ND), so the
// reconstructed version above is kept for reference only and is no longer written out.
void babbino;
for (const piece of [aria, ensemble]) {
  const xml = buildScore(piece);
  mkdirSync(piece.file.replace(/\/[^/]+$/, ""), { recursive: true });
  writeFileSync(piece.file, xml);
  console.log(`wrote ${piece.file} (${(xml.length / 1024).toFixed(1)} KB)`);
}
