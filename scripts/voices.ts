/**
 * Spoken Italian for every piece, made with ElevenLabs. Runs on GitHub (see .github/workflows/voices.yml),
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
 * No voice chosen yet (voice.config.json "voiceId" empty, no --voice)? The run first auditions the most used
 * native Italian voices from the ElevenLabs library (two lines each, in content/voice-audition/), adds the most
 * used one to the account, writes it into voice.config.json, and goes on with it. Changing voice later is one
 * edit of voice.config.json; the old voice's files stay until removed.
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
  /** a voice to look up by name in the Italian voice library, when voiceId is empty (e.g. "Serena") */
  voiceSearch?: string;
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
const bare = (t: string) => plain(t).replace(/[.,;:!?«»“”"()—–-]+/g, " ").replace(/\s+/g, " ").trim();
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
 * quickly → "Sì sì,"); a word held a whole bar or more gets a comma even without one in the text; words sung on one
 * note (an elision) are never split by punctuation.
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
    if (last) return t.replace(/[.,:]+$/, "") + (/[?]$/.test(t) ? "" : ".");
    const a = onset[k];
    const b = onset[k + 1];
    const span = a !== undefined && b !== undefined ? b - a : undefined;
    const core = t.replace(/[.,:?]+$/, "");
    if (joinsAfter.has(k)) return core;
    const punct = t.slice(core.length);
    if (span === undefined) return t;
    if (punct && span < 1.5) return core; // the music doesn't stop here
    if (!punct && span >= 3) return `${core},`; // held a bar or more: a breath
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
    // where two words are sung on one note (an elision, "piace,‿è"), the punctuation between them goes, so the
    // voice runs them together instead of pausing at the comma
    const syl0 = ph.syllables ?? [];
    const joinsAfter = new Set<number>();
    for (let i = 0; i + 1 < syl0.length; i++) if (syl0[i].noteId === syl0[i + 1].noteId && syl0[i + 1].word === syl0[i].word + 1) joinsAfter.add(syl0[i].word);
    const text = phrased(ph, joinsAfter, notes);
    // a repeated line ("Babbo, pietà, pietà!") is made once; the second points to the first
    if (!seenLine.has(text)) {
      seenLine.set(text, ph.id);
      const ws = ph.words.map((w) => plain(w.text));
      lines.push({ key: ph.id, kind: "line", text, file: `${base}/lines/${slug(text)}.mp3`, words: ws });
      if (config.slowLines !== false)
        lines.push({ key: `${ph.id}-slow`, kind: "line-slow", text, file: `${base}/lines/${slug(text)}-slow.mp3`, words: ws, slow: true });
    }
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
  const src = spoken.length ? spoken : text;
  const out: [number, number][] = [];
  let at = 0;
  for (const w of words) {
    const core = bare(w);
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

async function findVoice(name: string): Promise<{ id: string; name: string }> {
  const res = await api(`/v1/shared-voices?language=it&page_size=30&search=${encodeURIComponent(name)}`);
  const list = ((await res.json()) as { voices: { voice_id: string; public_owner_id: string; name: string }[] }).voices;
  const v = list.find((x) => x.name.toLowerCase().startsWith(name.toLowerCase())) ?? list[0];
  if (!v) throw new Error(`No Italian voice called "${name}" in the voice library.`);
  const added = (await (
    await api(`/v1/voices/add/${v.public_owner_id}/${v.voice_id}`, { method: "POST", body: JSON.stringify({ new_name: `Counterpart · ${v.name}` }) })
  ).json()) as { voice_id: string };
  return { id: added.voice_id, name: v.name };
}

async function chooseVoice(): Promise<{ id: string; name: string }> {
  console.log("No voice chosen yet: auditioning the most used native Italian voices from the ElevenLabs library.");
  const res = await api(`/v1/shared-voices?language=it&page_size=40&sort=usage_character_count_1y`);
  const list = ((await res.json()) as { voices: { voice_id: string; public_owner_id: string; name: string; locale?: string; accent?: string; gender?: string; use_case?: string; free_users_allowed?: boolean }[] }).voices;
  // narration-style voices with a standard Italian accent read diction best
  const good = list.filter((v) => (v.locale ?? "it").startsWith("it") && !/sicil|napol|venet|sard|roman|milan/i.test(v.accent ?? ""));
  const picks = (good.length ? good : list).slice(0, 4);
  if (!picks.length) throw new Error("No Italian voices were found in the voice library.");
  const sample = "O mio babbino caro, mi piace, è bello, bello.";
  const audition: { name: string; voiceId: string; gender?: string; accent?: string; file: string }[] = [];
  for (const v of picks) {
    const added = (await (
      await api(`/v1/voices/add/${v.public_owner_id}/${v.voice_id}`, { method: "POST", body: JSON.stringify({ new_name: `Counterpart · ${v.name}` }) })
    ).json()) as { voice_id: string };
    const sp = await speak(added.voice_id, sample, false);
    const file = `content/voice-audition/${slug(v.name)}.mp3`;
    save(file, sp.audio);
    audition.push({ name: v.name, voiceId: added.voice_id, gender: v.gender, accent: v.accent, file });
    console.log(`  auditioned ${v.name} (${v.gender ?? "?"}, ${v.accent ?? "?"}) → ${file}`);
  }
  writeFileSync(join(ROOT, "content/voice-audition/audition.json"), JSON.stringify({ sample, voices: audition }, null, 1));
  return { id: audition[0].voiceId, name: audition[0].name };
}

/* ---------------- the run ---------------- */

async function main() {
  const todo = pieces();
  if (!todo.length) throw new Error(`No piece "${pieceArg}" in data/content.`);
  if (!DRY && !KEY) throw new Error("ELEVENLABS_API_KEY is not set (on GitHub: a repository secret).");
  if (!DRY && !config.voiceId) {
    const v = config.voiceSearch ? await findVoice(config.voiceSearch) : await chooseVoice();
    config.voiceId = v.id;
    config.voiceName = v.name;
    writeFileSync(CONFIG, JSON.stringify(config, null, 2) + "\n");
    console.log(`Using ${v.name} (${v.id}); saved in voice.config.json. Change it there to use another voice.`);
    if (process.env.GITHUB_ACTIONS) console.log(`::notice::Voice chosen: ${v.name}`);
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
  console.log(`${todo.length} piece(s), ${jobs.length} clip(s) to make, ${chars} characters (about ${chars} credits).`);
  for (const j of jobs.slice(0, DRY ? Infinity : 0)) console.log(`  ${j.clip.kind.padEnd(9)} ${j.clip.key.padEnd(18)} ${j.clip.text}`);
  if (DRY) return;
  if (!jobs.length) {
    for (const r of refs) if (bank[r.bankKey]) r.data.clips[r.clipKey] = bank[r.bankKey];
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
  for (const r of refs) if (bank[r.bankKey]) r.data.clips[r.clipKey] = bank[r.bankKey];
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
