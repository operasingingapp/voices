/**
 * Spoken words for every piece, in its own language, made with ElevenLabs. Runs on GitHub (see .github/workflows/voices.yml),
 * where ELEVENLABS_API_KEY is a repository secret; this workspace cannot reach ElevenLabs.
 *
 * For each piece in data/content/<id>/language.json it makes:
 *   - every line, at normal speed and slowly (with the time each word is spoken, to light it up);
 *   - every word on its own (in a word bank shared by all pieces, so "bello" is made once);
 *   - every pair of words sung together on one note (an elision, "vo' andare"), as one clip.
 * Clips already made with the same text, voice and settings are skipped, so a run only pays for what is new.
 *
 * Output (committed by the workflow):
 *   content/voice-bank/<voice>/lines|joins|words/<slug>.mp3 and manifest.json: every recording, shared by all pieces
 *   content/pieces/<id>/voice/<voice>/manifest.json: which recordings the piece uses (line id → recording)
 *
 * Each language has its own voice: Italian uses "voiceId" in voice.config.json, any other language the entry under
 * "languages" (e.g. "de"). A piece sung by a man (its role a tenor, baritone or bass) uses the language's entry
 * under "male" when there is one (e.g. "it": MarcoTrox), and the language's voice otherwise. No voice chosen yet for a language? The run first auditions the most used native voices
 * of that language from the ElevenLabs library (a line each, in content/voice-audition/), adds the most used one to
 * the account, writes it into voice.config.json, and goes on with it. Changing voice later is one edit of
 * voice.config.json; the old voice's files stay until removed.
 *
 *   npx tsx scripts/voices.ts --dry-run                 list what would be made, and the characters it costs
 *   npx tsx scripts/voices.ts --piece <id|all> [--redo l03,w:bello] [--voice <voiceId>]
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const ROOT = join(import.meta.dirname, "..");
const API = "https://api.elevenlabs.io";
const CONFIG = join(ROOT, "voice.config.json");

interface Config {
  voiceId: string;
  voiceName?: string;
  modelId: string;
  /** speed of lines and words (ElevenLabs 0.7–1.2; 1 = its natural, rather quick pace) */
  normalSpeed: number;
  slowSpeed: number;
  /** extra easing of the slow lines (ffmpeg atempo, pitch kept): 0.85 = 15% longer */
  slowStretch: number;
  /** make a separate slow recording of each line; false = the app slows the normal one down itself */
  slowLines?: boolean;
  /** ElevenLabs speaker boost: a little more presence, sometimes a little less even */
  speakerBoost?: boolean;
  stability: number;
  similarityBoost: number;
  maxCharsPerRun: number;
  /** lines read differently from the automatic shaping: the written line → exactly what the voice is given */
  sayAs?: Record<string, string>;
  /** a voice to look up by name in the Italian voice library, when voiceId is empty (e.g. "Serena") */
  voiceSearch?: string;
  /** the voice for each language other than Italian, by language code */
  /** libraryId: the exact voice wanted from the ElevenLabs library (several voices share a name) */
  /** a language may also set its own model, speed and stability (each falls back to the settings above) */
  languages?: Record<string, { voiceId: string; voiceName?: string; voiceSearch?: string; libraryId?: string } & Partial<Pick<Config, "modelId" | "normalSpeed" | "slowSpeed" | "stability" | "similarityBoost" | "speakerBoost">>>;
  /** the voice for pieces sung by a man, by language code; without one, the language's voice is used */
  male?: Record<string, { voiceId: string; voiceName?: string }>;
}
interface Word {
  text: string;
}
interface Phrase {
  id: string;
  original: string;
  words: Word[];
  syllables?: { noteId: string; word: number }[];
}
interface Clip {
  key: string; // stable id: l03, l03-slow, join-2, w:bello
  kind: "line" | "line-slow" | "word" | "join";
  text: string; // what is sent
  file: string; // path from the repo root
  words?: string[]; // the line's written words, to time them
  slow?: boolean;
}
interface Made {
  text: string;
  hash: string;
  file: string;
  /** seconds when each written word starts and ends (lines only) */
  words?: [number, number][];
  /** the line reshaped like the music (see shapeLine) */
  sung?: { file: string; hash: string; words: [number, number][] };
}

/* ---------------- arguments and config ---------------- */

const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? "") : "";
};
const DRY = args.includes("--dry-run");
const pieceArg = arg("piece") || "all";
const redo = new Set(
  arg("redo")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);
const config: Config = {
  voiceId: "",
  modelId: "eleven_multilingual_v2",
  normalSpeed: 0.85,
  slowSpeed: 0.7,
  slowStretch: 0.8,
  stability: 0.55,
  similarityBoost: 0.75,
  maxCharsPerRun: 30000,
  ...(existsSync(CONFIG) ? JSON.parse(readFileSync(CONFIG, "utf8")) : {}),
};
if (arg("voice")) config.voiceId = arg("voice");
const KEY = process.env.ELEVENLABS_API_KEY ?? "";
/** ffmpeg: the one bundled with the project (ffmpeg-static), else the system's */
const FFMPEG: string = (() => {
  try {
    const p = createRequire(import.meta.url)("ffmpeg-static") as string | null;
    if (p && existsSync(p)) return p;
  } catch {
    /* not installed */
  }
  return "ffmpeg";
})();

/* ---------------- what to make ---------------- */

const plain = (t: string) => t.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
const bare = (t: string) => plain(t).replace(/[.,;:!?«»“”"()—–…-]+/g, " ").replace(/\s+/g, " ").trim();
const short = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 8);
const slug = (w: string) =>
  `${w
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${short(w.toLowerCase())}`;

function pieces(): string[] {
  const all = readdirSync(join(ROOT, "data/content")).filter((d) => existsSync(join(ROOT, "data/content", d, "language.json")));
  // the fixtures used by tests are invented text: no voices for them
  const real = all.filter((d) => !d.startsWith("cp-fx-"));
  return pieceArg === "all" ? real : real.filter((d) => d === pieceArg);
}

/** when each sung note starts, in quarter notes from the top of the piece */
function noteTimes(piece: string): Map<string, number> {
  const f = join(ROOT, "data/content", piece, "edition.json");
  const at = new Map<string, number>();
  if (!existsSync(f)) return at;
  const ed = JSON.parse(readFileSync(f, "utf8")) as { measures: { startQ: number }[]; notes: { id: string; m: number; q: number }[] };
  for (const n of ed.notes) at.set(n.id, (ed.measures[n.m]?.startQ ?? 0) + n.q);
  return at;
}

/**
 * The line as the voice should read it, shaped like the sung line: calm, never shouted, pausing only where the music
 * does. "!" and ";" become plain stops and commas (an exclamation makes the voice shout); a comma stays only where the
 * word is held (1½ beats or more) before the next one, and is dropped where the music runs straight on ("Sì, sì" sung
 * quickly → "Sì sì,"); no comma is added inside a phrase ("l'ingrato, cor" reads wrongly; the held note gets its
 * breath from shapeLine instead); words sung on one note (an elision) are never split by punctuation.
 */
function phrased(ph: Phrase, joinsAfter: Set<number>, notes: Map<string, number>): string {
  const syl = ph.syllables ?? [];
  const onset = ph.words.map((_, k) => {
    const s = syl.find((x) => x.word === k);
    return s ? notes.get(s.noteId) : undefined;
  });
  const out = ph.words.map((w, k) => {
    let t = plain(w.text).replace(/!/g, ".").replace(/;/g, ",");
    const last = k === ph.words.length - 1;
    if (last) return t.replace(/[.,:…]+$/, "") + (/[?]$/.test(t) ? "" : ".");
    const a = onset[k];
    const b = onset[k + 1];
    const span = a !== undefined && b !== undefined ? b - a : undefined;
    const core = t.replace(/[.,:?…]+$/, "");
    if (joinsAfter.has(k)) return core;
    const punct = t.slice(core.length);
    if (span === undefined) return t;
    if (punct && span < 1.5) return core; // the music doesn't stop here
    return punct ? `${core}${punct.replace(/\./g, ",")}` : core;
  });
  // each line read as its own sentence
  const line = plain(out.join(" "));
  return line.charAt(0).toUpperCase() + line.slice(1);
}

function clipsFor(piece: string, voiceDir: string): { lines: Clip[]; words: Clip[] } {
  const lang = JSON.parse(readFileSync(join(ROOT, "data/content", piece, "language.json"), "utf8")) as { phrases: Phrase[] };
  const notes = noteTimes(piece);
  // every recording lives in the voice's bank, shared by all pieces: a line or word heard before is never made again
  const base = `content/voice-bank/${voiceDir}`;
  const lines: Clip[] = [];
  const words: Clip[] = [];
  const seenLine = new Map<string, string>();
  let joinN = 0;
  const seenJoin = new Set<string>();
  for (const ph of lang.phrases) {
    // a run of coloratura sung on "ah" has nothing to say: no recording
    if (ph.words.length && ph.words.every((w) => /^(ah|a|oh)$/i.test(bare(w.text)))) continue;
    // where two words are sung on one note (an elision, "piace,‿è"), the punctuation between them goes, so the
    // voice runs them together instead of pausing at the comma
    const syl0 = ph.syllables ?? [];
    const joinsAfter = new Set<number>();
    for (let i = 0; i + 1 < syl0.length; i++) if (syl0[i].noteId === syl0[i + 1].noteId && syl0[i + 1].word === syl0[i].word + 1) joinsAfter.add(syl0[i].word);
    // a line sung again ("di cangiar l'ingrato cor" seven times) is recorded once, as first read; every
    // occurrence points to that recording and gets its own shape (shapeLine) from its own notes
    const same = bare(ph.original).toLowerCase();
    const text = seenLine.get(same) ?? config.sayAs?.[plain(ph.original)] ?? phrased(ph, joinsAfter, notes);
    const first = !seenLine.has(same);
    seenLine.set(same, text);
    const ws = ph.words.map((w) => plain(w.text));
    lines.push({ key: ph.id, kind: "line", text, file: `${base}/lines/${slug(text)}.mp3`, words: ws });
    if (first && config.slowLines !== false)
      lines.push({ key: `${ph.id}-slow`, kind: "line-slow", text, file: `${base}/lines/${slug(text)}-slow.mp3`, words: ws, slow: true });
    // words sung together on one note across the gap between two words: one clip for the pair
    const syl = ph.syllables ?? [];
    for (let i = 0; i + 1 < syl.length; i++) {
      const a = syl[i];
      const b = syl[i + 1];
      if (a.noteId !== b.noteId || b.word !== a.word + 1) continue;
      const pair = `${bare(ph.words[a.word].text)} ${bare(ph.words[b.word].text)}`;
      if (seenJoin.has(pair.toLowerCase())) continue;
      seenJoin.add(pair.toLowerCase());
      lines.push({ key: `join-${++joinN}`, kind: "join", text: `${pair}.`, file: `${base}/joins/${slug(pair)}.mp3` });
    }
    for (const w of ph.words) {
      const t = bare(w.text);
      // an elided word ("vo'") never stands alone: it is heard in its join
      if (!t || /'$/.test(t)) continue;
      words.push({ key: `w:${t.toLowerCase()}`, kind: "word", text: `${t}.`, file: "" });
    }
  }
  return { lines, words };
}

/* ---------------- ElevenLabs ---------------- */

async function api(path: string, init: RequestInit = {}, tries = 4): Promise<Response> {
  for (let k = 0; ; k++) {
    const res = await fetch(`${API}${path}`, { ...init, headers: { "xi-api-key": KEY, "Content-Type": "application/json", ...(init.headers ?? {}) } });
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && k < tries) {
      await new Promise((r) => setTimeout(r, 2000 * 2 ** k));
      continue;
    }
    throw new Error(`ElevenLabs ${init.method ?? "GET"} ${path} → ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
}

interface Spoken {
  audio: Buffer;
  starts: number[];
  ends: number[];
  chars: string[];
}
async function speak(voiceId: string, text: string, slow: boolean): Promise<Spoken> {
  const res = await api(`/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    body: JSON.stringify({
      text,
      model_id: config.modelId,
      seed: 42,
      voice_settings: {
        stability: config.stability,
        similarity_boost: config.similarityBoost,
        // no acting: a plain, even reading
        style: 0,
        use_speaker_boost: config.speakerBoost ?? true,
        speed: slow ? config.slowSpeed : config.normalSpeed,
      },
    }),
  });
  const j = (await res.json()) as {
    audio_base64: string;
    alignment?: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
  };
  return {
    audio: Buffer.from(j.audio_base64, "base64"),
    chars: j.alignment?.characters ?? [],
    starts: j.alignment?.character_start_times_seconds ?? [],
    ends: j.alignment?.character_end_times_seconds ?? [],
  };
}

/** Even loudness for every clip (speech at about -18 LUFS), saved as MP3. */
function save(file: string, audio: Buffer, stretch = 1) {
  const out = join(ROOT, file);
  mkdirSync(dirname(out), { recursive: true });
  const tmp = `${out}.raw.mp3`;
  writeFileSync(tmp, audio);
  try {
    execFileSync(FFMPEG, ["-v", "error", "-y", "-i", tmp, "-af", `${stretch !== 1 ? `atempo=${stretch},` : ""}loudnorm=I=-18:TP=-1.5:LRA=11`, "-ar", "44100", "-b:a", "96k", out]);
  } catch {
    writeFileSync(out, audio); // no ffmpeg: keep the file as it came
  }
  rmSync(tmp, { force: true });
}

/** When each written word is spoken, from the per-character timings. */
function wordTimes(sp: Spoken, text: string, words: string[]): [number, number][] {
  const spoken = sp.chars.join("");
  // matched without regard to case: the line is sent with a capital ("Mi piace") though written "mi piace"
  const src = (spoken.length ? spoken : text).toLowerCase();
  const out: [number, number][] = [];
  let at = 0;
  for (const w of words) {
    const core = bare(w).toLowerCase();
    const i = core ? src.indexOf(core, at) : -1;
    if (i < 0 || !sp.starts.length) {
      out.push([NaN, NaN]);
      continue;
    }
    const j = i + core.length - 1;
    out.push([+sp.starts[i].toFixed(3), +sp.ends[Math.min(j, sp.ends.length - 1)].toFixed(3)]);
    at = j + 1;
  }
  return out;
}

/* ---------------- choosing a voice when none is set ---------------- */

async function findVoice(name: string, lang = "it", libraryId?: string): Promise<{ id: string; name: string }> {
  type Shared = { voice_id: string; public_owner_id: string; name: string; gender?: string };
  const search = async (q: string) =>
    ((await (await api(`/v1/shared-voices?page_size=100&sort=usage_character_count_1y&${q}&search=${encodeURIComponent(name)}`)).json()) as { voices: Shared[] }).voices;
  const list = await search(`language=${lang}`);
  let v: Shared | undefined;
  if (libraryId) {
    // that exact voice, never another of the same name
    v = list.find((x) => x.voice_id === libraryId) ?? (await search("")).find((x) => x.voice_id === libraryId);
    if (!v) throw new Error(`The library voice ${libraryId} ("${name}") was not found in the ElevenLabs voice library.`);
  } else {
    // the most used voice of that name (the list comes sorted by use); a woman's voice where the name is shared
    const named = list.filter((x) => x.name.toLowerCase().startsWith(name.toLowerCase()));
    v = named.find((x) => /female|woman/i.test(x.gender ?? "")) ?? named[0] ?? list[0];
  }
  if (!v) throw new Error(`No ${LANGUAGE_NAME[lang] ?? lang} voice called "${name}" in the voice library.`);
  // added to the account to use it; a voice already there keeps its id
  const added = await api(`/v1/voices/add/${v.public_owner_id}/${v.voice_id}`, { method: "POST", body: JSON.stringify({ new_name: `Counterpart · ${v.name}` }) })
    .then((r) => r.json() as Promise<{ voice_id?: string }>)
    .catch(() => ({}) as { voice_id?: string });
  return { id: added.voice_id || v.voice_id, name: v.name };
}

const LANGUAGE_NAME: Record<string, string> = { it: "Italian", de: "German", fr: "French", es: "Spanish", cs: "Czech", ru: "Russian" };
const AUDITION_LINE: Record<string, string> = {
  it: "O mio babbino caro, mi piace, è bello, bello.",
  de: "Der Hölle Rache kocht in meinem Herzen.",
};
/** regional accents to pass over: a standard accent reads diction best */
const REGIONAL: Record<string, RegExp> = {
  it: /sicil|napol|venet|sard|roman|milan/i,
  de: /swiss|schweiz|austria|österreich|bavar|bayer|saxon|sächs|berlin|swabian|schwäb/i,
};

async function chooseVoice(lang = "it"): Promise<{ id: string; name: string }> {
  const name = LANGUAGE_NAME[lang] ?? lang;
  console.log(`No ${name} voice chosen yet: auditioning the most used native ${name} voices from the ElevenLabs library.`);
  const res = await api(`/v1/shared-voices?language=${lang}&page_size=40&sort=usage_character_count_1y`);
  const list = ((await res.json()) as { voices: { voice_id: string; public_owner_id: string; name: string; locale?: string; accent?: string; gender?: string; use_case?: string; free_users_allowed?: boolean }[] }).voices;
  // narration-style voices with a standard accent read diction best; a woman's voice, like the Italian one, where there is one
  const standard = list.filter((v) => (v.locale ?? lang).startsWith(lang) && !(REGIONAL[lang] ?? /$^/).test(v.accent ?? ""));
  const pool = standard.length ? standard : list;
  const women = pool.filter((v) => /female|woman/i.test(v.gender ?? ""));
  const picks = [...women, ...pool.filter((v) => !women.includes(v))].slice(0, 4);
  if (!picks.length) throw new Error(`No ${name} voices were found in the voice library.`);
  const sample = AUDITION_LINE[lang] ?? AUDITION_LINE.it;
  const audition: { name: string; voiceId: string; gender?: string; accent?: string; file: string }[] = [];
  for (const v of picks) {
    const added = (await (
      await api(`/v1/voices/add/${v.public_owner_id}/${v.voice_id}`, { method: "POST", body: JSON.stringify({ new_name: `Counterpart · ${v.name}` }) })
    ).json()) as { voice_id: string };
    const sp = await speak(added.voice_id, sample, false);
    const file = `content/voice-audition/${lang}-${slug(v.name)}.mp3`;
    save(file, sp.audio);
    audition.push({ name: v.name, voiceId: added.voice_id, gender: v.gender, accent: v.accent, file });
    console.log(`  auditioned ${v.name} (${v.gender ?? "?"}, ${v.accent ?? "?"}) → ${file}`);
  }
  writeFileSync(join(ROOT, `content/voice-audition/audition${lang === "it" ? "" : `-${lang}`}.json`), JSON.stringify({ sample, voices: audition }, null, 1));
  return { id: audition[0].voiceId, name: audition[0].name };
}

/* ---------------- shaping a line like the music ---------------- */

/**
 * A speaking voice keeps its own pace: "Sì, sì" comes out in a third of a second although the second "sì" is held for
 * a beat and a half. So each recorded line is reshaped after it is made, at no cost: it is cut at the start of every
 * word, and each word gets time in proportion to its note values (from its onset to the next word's) — a held word is
 * stretched a little (pitch kept, rubberband) and followed by a short breath; a quick one is left as it is. The pace
 * comes from the line itself (the median seconds-per-beat of its words), so any line of any aria works the same way.
 * Words sung on one note (an elision) are kept together. The result goes to the bank's sung/ folder; the plain
 * recording stays, so the shape can be retuned (SHAPE below) without making anything again.
 */
const SHAPE = { minStretch: 1.1, maxStretch: 1.35, maxBreath: 0.45, fade: 0.006, v: 1 };

function spansOf(ph: Phrase, notes: Map<string, number>): (number | undefined)[] {
  const syl = ph.syllables ?? [];
  const on = ph.words.map((_, k) => {
    const s = syl.find((x) => x.word === k);
    return s ? notes.get(s.noteId) : undefined;
  });
  return ph.words.map((_, k) => (on[k] !== undefined && on[k + 1] !== undefined ? on[k + 1]! - on[k]! : undefined));
}

function duration(file: string): number {
  try {
    const out = execFileSync(FFMPEG, ["-hide_banner", "-i", file], { stdio: ["ignore", "pipe", "pipe"] }).toString();
    void out;
  } catch (e) {
    const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(String((e as { stderr?: Buffer }).stderr ?? ""));
    if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3];
  }
  return NaN;
}

function shapeLine(src: string, out: string, times: [number, number][], spans: (number | undefined)[], joined: Set<number>): [number, number][] | null {
  const total = duration(join(ROOT, src));
  if (!(total > 0)) return null;
  joined = new Set(joined);
  times.forEach(([a], k) => {
    if (Number.isFinite(a)) return;
    if (k > 0) joined.add(k - 1);
    else joined.add(0);
  });
  if (times.every(([a]) => !Number.isFinite(a))) return null;
  times = times.map(([a, b], k) => (Number.isFinite(a) ? [a, b] : k === 0 ? [0, 0] : times[k - 1]) as [number, number]);
  // units: runs of words that are cut together (an elision, or a word without timing)
  const units: { words: number[]; from: number; to: number; beats?: number }[] = [];
  for (let k = 0; k < times.length; k++) {
    const prev = units[units.length - 1];
    if (prev && joined.has(k - 1)) {
      prev.words.push(k);
      prev.beats = spans[k] === undefined || prev.beats === undefined ? undefined : prev.beats + spans[k]!;
    } else units.push({ words: [k], from: k === 0 ? 0 : times[k][0], to: total, beats: spans[k] });
  }
  for (let u = 0; u + 1 < units.length; u++) units[u].to = units[u + 1].from;
  const rates = units.filter((u) => u.beats && u.beats > 0).map((u) => (u.to - u.from) / u.beats!).sort((a, b) => a - b);
  const pace = rates.length ? rates[Math.floor((rates.length - 1) / 2)] : 0;
  const parts: string[] = [];
  const labels: string[] = [];
  const newTimes: [number, number][] = [];
  let t = 0;
  units.forEach((u, i) => {
    const d = u.to - u.from;
    const want = u.beats && pace ? u.beats * pace : d;
    const f = Math.min(SHAPE.maxStretch, Math.max(SHAPE.minStretch, want / d));
    const breath = i + 1 < units.length ? Math.min(SHAPE.maxBreath, Math.max(0, want - d * f)) : 0;
    const len = d * f;
    for (const k of u.words) newTimes[k] = [+(t + (times[k][0] - u.from) * f).toFixed(3), +(t + (times[k][1] - u.from) * f).toFixed(3)];
    if (u.words[0] === 0) newTimes[0][0] = +(t + Math.max(0, times[0][0]) * f).toFixed(3);
    parts.push(
      `[0:a]atrim=start=${u.from.toFixed(4)}:end=${u.to.toFixed(4)},asetpts=PTS-STARTPTS,rubberband=tempo=${(1 / f).toFixed(4)}:pitchq=quality,` +
        `afade=t=in:d=${SHAPE.fade},afade=t=out:st=${Math.max(0, len - SHAPE.fade).toFixed(4)}:d=${SHAPE.fade}` +
        `${breath > 0.01 ? `,apad=pad_dur=${breath.toFixed(3)}` : ""}[u${i}]`,
    );
    labels.push(`[u${i}]`);
    t += len + (breath > 0.01 ? breath : 0);
  });
  const graph = `${parts.join(";")};${labels.join("")}concat=n=${units.length}:v=0:a=1[out]`;
  const dst = join(ROOT, out);
  mkdirSync(dirname(dst), { recursive: true });
  execFileSync(FFMPEG, ["-v", "error", "-y", "-i", join(ROOT, src), "-filter_complex", graph, "-map", "[out]", "-ar", "44100", "-b:a", "96k", dst]);
  return newTimes;
}

function shapeAll(piece: string, voiceDir: string, data: { clips: Record<string, Made & { sung?: { file: string; hash: string; words: [number, number][] } }> }) {
  const lang = JSON.parse(readFileSync(join(ROOT, "data/content", piece, "language.json"), "utf8")) as { phrases: Phrase[] };
  const notes = noteTimes(piece);
  let made = 0;
  for (const ph of lang.phrases) {
    const c = data.clips[ph.id];
    if (!c?.words) continue;
    const syl = ph.syllables ?? [];
    const joined = new Set<number>();
    for (let i = 0; i + 1 < syl.length; i++) if (syl[i].noteId === syl[i + 1].noteId && syl[i + 1].word === syl[i].word + 1) joined.add(syl[i].word);
    const spans = spansOf(ph, notes);
    const hash = short(JSON.stringify([SHAPE, c.hash, spans, [...joined]]));
    // one shaped file per shape: a line sung again to other notes gets its own
    const out = c.file.replace("/lines/", "/sung/").replace(/\.mp3$/, `-${hash.slice(0, 6)}.mp3`);
    if (c.sung?.hash === hash && existsSync(join(ROOT, out))) continue;
    try {
      const words = shapeLine(c.file, out, c.words, spans, joined);
      if (words) {
        c.sung = { file: out, hash, words };
        made++;
      }
    } catch (e) {
      console.log(`  could not shape ${ph.id}: ${String(e).slice(0, 200)}`);
    }
  }
  if (made) console.log(`Shaped ${made} line(s) of ${piece} like the music.`);
}

/* ---------------- the run ---------------- */

/** a piece's roles' voices: a man's (tenor, baritone, bass) or a woman's. An ensemble may have both, and is made in both voices */
const MALE = /tenor|baritone|bass|countertenor|haute-contre/i;
const voiceTypes = (piece: string) => {
  const m = join(ROOT, "content/pieces", piece, "manifest.json");
  if (!existsSync(m)) return [""];
  const roles = (JSON.parse(readFileSync(m, "utf8")) as { roles?: { voiceType?: string }[] }).roles ?? [];
  return roles.length ? roles.map((r) => r.voiceType ?? "") : [""];
};
const hasMale = (piece: string) => voiceTypes(piece).some((v) => MALE.test(v));
const hasFemale = (piece: string) => voiceTypes(piece).some((v) => !MALE.test(v));

/** the language of a piece, from its words */
const languageOf = (piece: string) =>
  (JSON.parse(readFileSync(join(ROOT, "data/content", piece, "language.json"), "utf8")) as { language?: string }).language || "it";

async function main() {
  const all = pieces();
  if (!all.length) throw new Error(`No piece "${pieceArg}" in data/content.`);
  // one voice per language: the pieces of each language are made with that language's voice
  const langs = [...new Set(all.map(languageOf))].sort((a, b) => (a === "it" ? -1 : b === "it" ? 1 : a.localeCompare(b)));
  const italian = { voiceId: config.voiceId, voiceName: config.voiceName };
  for (const lang of langs) {
    const inLang = all.filter((p) => languageOf(p) === lang);
    // pieces sung by a man, with a man's voice set for this language, are made separately with it
    const male = config.male?.[lang];
    const men = male?.voiceId ? inLang.filter(hasMale) : [];
    if (men.length) {
      const keep = { voiceId: config.voiceId, voiceName: config.voiceName };
      config.voiceId = male!.voiceId;
      config.voiceName = male!.voiceName;
      await runLanguage(lang, men);
      Object.assign(config, keep);
    }
    const todo = inLang.filter((p) => !men.includes(p) || hasFemale(p));
    if (!todo.length) continue;
    if (lang === "it") {
      config.voiceId = italian.voiceId;
      config.voiceName = italian.voiceName;
    }
    const base = { modelId: config.modelId, normalSpeed: config.normalSpeed, slowSpeed: config.slowSpeed, stability: config.stability, similarityBoost: config.similarityBoost, speakerBoost: config.speakerBoost };
    if (lang !== "it") {
      const v = config.languages?.[lang];
      // --voice applies to Italian; another language uses its own entry, with its own settings where it has them
      config.voiceId = v?.voiceId ?? "";
      config.voiceName = v?.voiceName;
      for (const k of Object.keys(base) as (keyof typeof base)[]) if (v?.[k] !== undefined) (config as unknown as Record<string, unknown>)[k] = v[k];
    }
    await runLanguage(lang, todo);
    Object.assign(config, base);
    if (lang === "it") Object.assign(italian, { voiceId: config.voiceId, voiceName: config.voiceName });
  }
}

async function runLanguage(lang: string, todo: string[]) {
  if (args.includes("--shape")) {
    const voiceDir = slug(config.voiceId).replace(/-[0-9a-f]{8}$/, "");
    for (const piece of todo) {
      const mPath = join(ROOT, `content/pieces/${piece}/voice/${voiceDir}/manifest.json`);
      if (!existsSync(mPath)) continue;
      const data = JSON.parse(readFileSync(mPath, "utf8"));
      shapeAll(piece, voiceDir, data);
      writeFileSync(mPath, JSON.stringify(data, null, 1));
    }
    return;
  }
  if (!DRY && !KEY) throw new Error("ELEVENLABS_API_KEY is not set (on GitHub: a repository secret).");
  if (!DRY && !config.voiceId) {
    const search = lang === "it" ? config.voiceSearch : config.languages?.[lang]?.voiceSearch;
    const libraryId = lang === "it" ? undefined : config.languages?.[lang]?.libraryId;
    const v = search ? await findVoice(search, lang, libraryId) : await chooseVoice(lang);
    // save the choice in the file as it stands (only this language's entry changes)
    const saved = JSON.parse(readFileSync(CONFIG, "utf8"));
    if (lang === "it") Object.assign(saved, { voiceId: v.id, voiceName: v.name });
    else saved.languages = { ...(saved.languages ?? {}), [lang]: { ...(saved.languages?.[lang] ?? {}), voiceId: v.id, voiceName: v.name } };
    writeFileSync(CONFIG, JSON.stringify(saved, null, 2) + "\n");
    config.voiceId = v.id;
    config.voiceName = v.name;
    config.languages = saved.languages;
    console.log(`Using ${v.name} (${v.id}) for ${LANGUAGE_NAME[lang] ?? lang}; saved in voice.config.json. Change it there to use another voice.`);
    if (process.env.GITHUB_ACTIONS) console.log(`::notice::${LANGUAGE_NAME[lang] ?? lang} voice chosen: ${v.name}`);
  }
  const voiceDir = config.voiceId ? slug(config.voiceId).replace(/-[0-9a-f]{8}$/, "") || "voice" : "voice";
  const settings = JSON.stringify([config.voiceId, config.modelId, config.stability, config.similarityBoost, config.speakerBoost ?? true, "plain-42"]);
  const slowSettings = JSON.stringify([config.slowSpeed, config.slowStretch]);
  const hashOf = (c: Clip) => short(`${settings}|${c.slow ? slowSettings : config.normalSpeed}|${c.kind}|${c.text}`);

  // the shared word bank
  const bankDir = `content/voice-bank/${voiceDir}`;
  const bankPath = join(ROOT, bankDir, "manifest.json");
  const bank: Record<string, Made> = existsSync(bankPath) ? JSON.parse(readFileSync(bankPath, "utf8")) : {};

  type Job = { clip: Clip; done: (m: Made) => void };
  const jobs: Job[] = [];
  const manifests: { path: string; data: { voiceId: string; voiceName?: string; model: string; clips: Record<string, Made> } }[] = [];
  const wordsWanted = new Map<string, Clip>();
  const refs: { data: { clips: Record<string, Made> }; clipKey: string; bankKey: string }[] = [];
  const queued = new Set<string>();
  for (const piece of todo) {
    const { lines, words } = clipsFor(piece, voiceDir);
    const mPath = join(ROOT, `content/pieces/${piece}/voice/${voiceDir}/manifest.json`);
    const data = existsSync(mPath) ? JSON.parse(readFileSync(mPath, "utf8")) : { clips: {} };
    data.voiceId = config.voiceId;
    data.voiceName = config.voiceName;
    data.model = config.modelId;
    data.words = data.words ?? {};
    manifests.push({ path: mPath, data });
    for (const c of lines) {
      const bankKey = `${c.kind}:${c.text}`;
      refs.push({ data, clipKey: c.key, bankKey });
      const have = bank[bankKey];
      const fresh = have && have.hash === hashOf(c) && existsSync(join(ROOT, have.file));
      if ((fresh && !redo.has(c.key) && !redo.has(c.key.replace(/-slow$/, ""))) || queued.has(bankKey)) continue;
      queued.add(bankKey);
      jobs.push({ clip: c, done: (m) => (bank[bankKey] = m) });
    }
    for (const w of words) {
      data.words[w.key.slice(2)] = `${bankDir}/words/${slug(w.key.slice(2))}.mp3`;
      wordsWanted.set(w.key, w);
    }
  }
  for (const [key, w] of wordsWanted) {
    const word = key.slice(2);
    w.file = `${bankDir}/words/${slug(word)}.mp3`;
    const have = bank[word];
    if (have && have.hash === hashOf(w) && existsSync(join(ROOT, have.file)) && !redo.has(key)) continue;
    jobs.push({ clip: w, done: (m) => (bank[word] = m) });
  }

  const chars = jobs.reduce((n, j) => n + j.clip.text.length, 0);
  console.log(`${LANGUAGE_NAME[lang] ?? lang}: ${todo.length} piece(s), ${jobs.length} clip(s) to make, ${chars} characters (about ${chars} credits).`);
  for (const j of jobs.slice(0, DRY ? Infinity : 0)) console.log(`  ${j.clip.kind.padEnd(9)} ${j.clip.key.padEnd(18)} ${j.clip.text}`);
  if (DRY) return;
  if (!jobs.length) {
    for (const r of refs) if (bank[r.bankKey]) r.data.clips[r.clipKey] = { ...bank[r.bankKey], ...(r.data.clips[r.clipKey]?.sung ? { sung: r.data.clips[r.clipKey].sung } : {}) };
    manifests.forEach((m, i) => shapeAll(todo[i], voiceDir, m.data as never));
    for (const m of manifests) writeFileSync(m.path, JSON.stringify(m.data, null, 1));
    return;
  }
  if (chars > config.maxCharsPerRun) throw new Error(`That is more than maxCharsPerRun (${config.maxCharsPerRun}) in voice.config.json; raise it to go on.`);

  // two at a time: the smaller plans allow only a few requests at once
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      const c = job.clip;
      const sp = await speak(config.voiceId, c.text, !!c.slow);
      // the voice's own slowest speed is still quick for learning: the slow line is also eased out a little
      const stretch = c.slow ? config.slowStretch : 1;
      save(c.file, sp.audio, stretch);
      const times = c.words ? wordTimes(sp, c.text, c.words).map(([a, b]) => [+(a / stretch).toFixed(3), +(b / stretch).toFixed(3)] as [number, number]) : undefined;
      job.done({ text: c.text, hash: hashOf(c), file: c.file, ...(times ? { words: times } : {}) });
      console.log(`  made ${c.key}: ${c.text}`);
    }
  };
  await Promise.all([worker(), worker()]);

  // each piece's manifest points at the shared recordings
  for (const r of refs) if (bank[r.bankKey]) r.data.clips[r.clipKey] = { ...bank[r.bankKey], ...(r.data.clips[r.clipKey]?.sung ? { sung: r.data.clips[r.clipKey].sung } : {}) };
  manifests.forEach((m, i) => shapeAll(todo[i], voiceDir, m.data as never));
  for (const m of manifests) {
    mkdirSync(dirname(m.path), { recursive: true });
    writeFileSync(m.path, JSON.stringify(m.data, null, 1));
  }
  mkdirSync(dirname(bankPath), { recursive: true });
  writeFileSync(bankPath, JSON.stringify(bank, null, 1));
  console.log("Done.");
  if (process.env.GITHUB_ACTIONS) console.log(`::notice::Made ${jobs.length} clips (${chars} characters).`);
}

main().catch((e) => {
  const msg = String(e instanceof Error ? e.message : e);
  console.error(msg);
  // on GitHub, also as an annotation: readable on the run's page without opening the log
  if (process.env.GITHUB_ACTIONS) console.log(`::error::${msg.replace(/\r?\n/g, " ")}`);
  process.exit(1);
});
