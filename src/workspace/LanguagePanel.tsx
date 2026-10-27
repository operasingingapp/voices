import { useEffect, useMemo, useRef, useState } from "react";
import type { Performance } from "../../shared/timeline";
import type { AudioAsset, CompiledEdition, CompiledLanguage, Phrase } from "../../shared/types";

interface Span {
  ph: Phrase;
  startQ: number;
  endQ: number;
  performed: boolean;
}

export function phraseSpans(perf: Performance, lang: CompiledLanguage): Span[] {
  return lang.phrases.map((ph) => {
    const occs = perf.occurrences(ph.startM);
    const performed = occs.some((o) => o.occ === ph.occurrence) && perf.occurrences(ph.endM).some((o) => o.occ === ph.occurrence);
    const startQ = perf.toPerfQ({ m: ph.startM, q: ph.startQ, occ: ph.occurrence });
    const endQ = perf.toPerfQ({ m: ph.endM, q: ph.endQ, occ: ph.occurrence });
    return { ph, startQ, endQ, performed };
  });
}

interface Props {
  edition: CompiledEdition;
  language: CompiledLanguage;
  perf: Performance;
  roleId: string | null;
  q: number;
  onSeek: (q: number) => void;
  onBeforeSpeak: () => void;
}

export function LanguagePanel(p: Props) {
  const spans = useMemo(() => phraseSpans(p.perf, p.language), [p.perf, p.language]);
  const mine = spans.filter((s) => s.ph.roleId === p.roleId);
  const [pinned, setPinned] = useState<string | null>(null);

  const auto = useMemo(() => {
    const live = mine.filter((s) => s.performed);
    const cur = live.find((s) => p.q >= s.startQ - 1e-6 && p.q < s.endQ - 1e-6);
    if (cur) return { span: cur, relation: "current" as const };
    const next = live.filter((s) => s.startQ > p.q).sort((a, b) => a.startQ - b.startQ)[0];
    if (next) return { span: next, relation: "next" as const };
    const prev = live.filter((s) => s.endQ <= p.q).sort((a, b) => b.endQ - a.endQ)[0];
    return prev ? { span: prev, relation: "previous" as const } : null;
  }, [mine, p.q]);

  const pinnedSpan = pinned ? mine.find((s) => s.ph.id === pinned) : undefined;
  const shown = pinnedSpan ? { span: pinnedSpan, relation: "pinned" as const } : auto;

  // current word: the sounding note of this role at q
  const partKey = p.edition.roles.find((r) => r.id === p.roleId)?.partKey;
  const soundingIds = useMemo(() => {
    if (!partKey) return new Set<string>();
    const ev = p.perf.notes.find((n) => n.part === partKey && n.onQ <= p.q + 1e-6 && n.offQ > p.q + 1e-6);
    return new Set(ev?.ids ?? []);
  }, [p.perf, partKey, p.q]);
  const inPhraseNow = shown && p.q >= shown.span.startQ - 1e-6 && p.q < shown.span.endQ;

  const others = useMemo(() => {
    if (!shown) return [];
    const s = shown.span;
    return spans.filter((o) => o.ph.roleId !== p.roleId && o.performed && o.startQ < s.endQ && o.endQ > s.startQ);
  }, [spans, shown, p.roleId]);

  if (!p.roleId)
    return <p className="empty">The piano has no sung text. Choose a vocal role to see the libretto, gloss, translation and IPA for that line.</p>;
  if (!mine.length) return <p className="empty">No language material has been prepared for this role yet.</p>;

  const relationText = {
    current: "Now",
    next: "Next phrase",
    previous: "Last phrase",
    pinned: "Selected phrase",
  } as const;
  const roleName = p.edition.roles.find((r) => r.id === p.roleId)?.name ?? "";

  return (
    <div className="lang">
      <div className="lang-head">
        <label className="field-inline">
          <span>Phrase</span>
          <select
            value={pinned ?? ""}
            onChange={(e) => {
              const id = e.target.value || null;
              setPinned(id);
              const s = mine.find((x) => x.ph.id === id);
              if (s && s.performed) p.onSeek(s.startQ);
            }}
          >
            <option value="">Follow the music</option>
            {mine.map((s) => (
              <option key={s.ph.id} value={s.ph.id}>
                {s.performed ? "" : "(not performed) "}m. {p.edition.measures[s.ph.startM].number}
                {s.ph.occurrence > 1 ? ` (${s.ph.occurrence}nd time)` : ""}: {s.ph.original}
              </option>
            ))}
          </select>
        </label>
      </div>
      {shown ? (
        <PhraseView
          key={shown.span.ph.id}
          span={shown.span}
          edition={p.edition}
          relation={relationText[shown.relation]}
          soundingIds={inPhraseNow ? soundingIds : new Set()}
          onBeforeSpeak={p.onBeforeSpeak}
          roleName={roleName}
        />
      ) : (
        <p className="empty">No phrase for {roleName} in this version.</p>
      )}
      {others.length > 0 && (
        <details className="others">
          <summary>
            Sung at the same time by {others.map((o) => p.edition.roles.find((r) => r.id === o.ph.roleId)?.name).join(" and ")}
          </summary>
          {others.map((o) => (
            <div key={o.ph.id} className="other-phrase">
              <p className="libretto small">{o.ph.original}</p>
              <p className="translation small">{o.ph.translation}</p>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

function PhraseView(props: { span: Span; edition: CompiledEdition; relation: string; soundingIds: Set<string>; onBeforeSpeak: () => void; roleName: string }) {
  const { ph } = props.span;
  const ed = props.edition;
  const nowWords = ph.words.map((w) => w.noteIds.some((id) => props.soundingIds.has(id)));
  return (
    <article className="phrase" data-testid="phrase" data-phrase-id={ph.id}>
      <p className="phrase-where">
        <strong>{props.relation}</strong> {props.roleName}, m. {ed.measures[ph.startM].number}–{ed.measures[ph.endM].number}
        {ph.occurrence > 1 ? `, ${ph.occurrence === 2 ? "2nd" : `${ph.occurrence}th`} time (verse ${ph.verse})` : ""}
        {!props.span.performed && <span className="tag blue">Cut in this version</span>}
      </p>
      <p className="libretto" lang="it">
        {ph.original}
      </p>
      {glossLines(ph).map((line, li) => (
        <div key={li} className="gloss-grid" style={{ gridTemplateColumns: `repeat(${line.words.length}, auto)` }} role="table" aria-label={li === 0 ? "Word-by-word gloss" : undefined}>
          {line.words.map((i, col) => {
            const w = ph.words[i];
            return (
              <div key={`w${i}`} className={`gw${nowWords[i] ? " now" : ""}`} style={{ gridColumn: col + 1, gridRow: "1 / span 4" }} role="row" data-testid={nowWords[i] ? "word-now" : undefined}>
                <span className="gw-it" lang="it" role="cell">
                  {w.text.replace(/[,.;:!?]+$/, "")}
                </span>
                <span className="gw-ipa" role="cell">
                  {w.ipa || "—"}
                </span>
                <span className="gw-en" role="cell">
                  {w.gloss || "—"}
                </span>
                <span className="gw-notes">{w.noteIds.length > 1 ? `${w.noteIds.length} notes` : "\u00a0"}</span>
              </div>
            );
          })}
          {line.groups.map((g, gi) => (
            <div key={`g${gi}`} className={`gg${g.continues ? " cont" : ""}${g.continued ? " contd" : ""}`} style={{ gridColumn: `${g.from + 1} / ${g.to + 2}`, gridRow: 5 + gi }}>
              <span>{g.continued ? "" : g.gloss}</span>
            </div>
          ))}
        </div>
      ))}
      <p className="translation">{ph.translation || <em>Translation has not been prepared yet.</em>}</p>
      <p className="ipa-line" aria-label="IPA">
        [{ph.ipa}]
      </p>
      <Speak phrase={ph} editionId={ed.editionId} onBefore={props.onBeforeSpeak} />
      {ph.review.status !== "reviewed" && <p className="fine review-note">Unreviewed text: prepared for development, not yet checked by a diction coach.</p>}
    </article>
  );
}

function Speak({ phrase, editionId, onBefore }: { phrase: Phrase; editionId: string; onBefore: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<"normal" | "slow" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => () => audioRef.current?.pause(), []);

  const play = (speed: "normal" | "slow") => {
    setErr(null);
    onBefore();
    audioRef.current?.pause();
    const asset: AudioAsset | undefined = speed === "slow" ? phrase.audio.slow ?? phrase.audio.normal : phrase.audio.normal;
    if (!asset) return;
    const a = new Audio(`/content/${editionId}/audio/${asset.file}`);
    a.preservesPitch = true;
    if (speed === "slow" && !phrase.audio.slow) a.playbackRate = 0.7;
    a.onended = () => setPlaying(null);
    a.onerror = () => {
      setPlaying(null);
      setErr("The recording could not be played.");
    };
    audioRef.current = a;
    setPlaying(speed);
    a.play().catch(() => setPlaying(null));
  };

  const n = phrase.audio.normal;
  return (
    <div className="speak">
      {n ? (
        <>
          <div className="speak-btns">
            <button className="btn small" onClick={() => play("normal")} aria-pressed={playing === "normal"}>
              {playing === "normal" ? "Speaking…" : "Hear spoken"}
            </button>
            <button className="btn small" onClick={() => play("slow")} aria-pressed={playing === "slow"}>
              {playing === "slow" ? "Speaking slowly…" : "Hear slowly"}
            </button>
          </div>
          <p className="fine">
            {n.kind === "placeholder-tts"
              ? "Placeholder machine voice (eSpeak NG), not a pronunciation model. Reviewed recordings have not been delivered yet."
              : n.reviewed
                ? "Reviewed recording."
                : "Recording not yet reviewed."}
            {!phrase.audio.slow && " There is no slow recording; “Hear slowly” plays the normal recording at 70% speed with pitch kept."}
          </p>
        </>
      ) : (
        <p className="missing">Spoken pronunciation has not been prepared for this phrase yet.</p>
      )}
      {phrase.missing.filter((m) => !m.startsWith("Spoken pronunciation has not") && !m.startsWith("No slow")).map((m) => (
        <p key={m} className="missing">
          {m}
        </p>
      ))}
      {err && <p className="form-error">{err}</p>}
    </div>
  );
}

/** Split a phrase's words into lines that fit the panel; gloss groups are split at line ends. */
function glossLines(ph: Phrase, maxWidth = 330) {
  const est = (i: number) => {
    const w = ph.words[i];
    return Math.max(w.text.length * 9.5, w.ipa.length * 8, w.gloss.length * 7) + 14;
  };
  const lines: { words: number[]; groups: { from: number; to: number; gloss: string; continues: boolean; continued: boolean }[] }[] = [];
  let cur: number[] = [];
  let width = 0;
  ph.words.forEach((_, i) => {
    const w = est(i);
    if (cur.length && width + w > maxWidth) {
      lines.push({ words: cur, groups: [] });
      cur = [];
      width = 0;
    }
    cur.push(i);
    width += w;
  });
  if (cur.length) lines.push({ words: cur, groups: [] });
  for (const g of ph.glossGroups) {
    const lo = Math.min(...g.words);
    const hi = Math.max(...g.words);
    for (const line of lines) {
      const a = Math.max(lo, line.words[0]);
      const b = Math.min(hi, line.words[line.words.length - 1]);
      if (a > b) continue;
      line.groups.push({ from: a - line.words[0], to: b - line.words[0], gloss: g.gloss, continues: hi > b, continued: lo < a });
    }
  }
  return lines;
}
