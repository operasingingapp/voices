/**
 * Save as PDF: the score or the libretto of this piece, seen as it will print before it is saved. The libretto has
 * the reader's choices (whose lines, the translation, the IPA, word by word, repeats); the score whether your notes
 * are written on it.
 */
import { useEffect, useRef, useState } from "react";
import { openInTab, printDocument } from "../score/printScore";
import type { LibrettoOptions } from "../score/printLibretto";
import { useBackToClose } from "./nav";

export type ExportKind = "score" | "libretto";

interface Props {
  initial: ExportKind;
  title: string;
  /** the score's print document; with your notes on it or without */
  makeScore: (withNotes: boolean, parts: string[] | null) => Promise<string>;
  /** the score's lines (MusicXML parts) in their order, yours marked */
  parts: { id: string; label: string; you: boolean }[];
  makeLibretto: (o: LibrettoOptions) => string;
  hasNotes: boolean;
  /** more than one character sings in the piece */
  ensemble: boolean;
  roleName: string;
  onClose: () => void;
}

const LIB_KEY = "cp:libretto-options";
const DEFAULTS: LibrettoOptions = { everyone: true, translation: true, ipa: false, gloss: false, repeats: false };
function loadOpts(): LibrettoOptions {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(LIB_KEY) ?? "{}") };
  } catch {
    return DEFAULTS;
  }
}

/** the print document as a preview: no print bar, the pages fitted to the frame's width */
const forPreview = (html: string) =>
  html.replace(
    "</body>",
    `<style>.bar{display:none!important}body{overflow-x:hidden}</style><script>function fit(){var w=document.documentElement.clientWidth;document.documentElement.style.setProperty("--fit",String(Math.min(1.45,(w-40)/794)))}fit();addEventListener("resize",fit)</script></body>`,
  );

export function ExportSheet({ initial, title, makeScore, parts, makeLibretto, hasNotes, ensemble, roleName, onClose }: Props) {
  useBackToClose(true, onClose);
  const [kind, setKind] = useState<ExportKind>(initial);
  const [withNotes, setWithNotes] = useState(true);
  const [shown, setShown] = useState<string[]>(() => parts.map((p) => p.id));
  const mineShown = parts.some((p) => p.you && shown.includes(p.id));
  const [opts, setOpts] = useState<LibrettoOptions>(loadOpts);
  const [scoreHtml, setScoreHtml] = useState<{ key: string; html: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "tab" | "blocked" | "noTab">("idle");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  useEffect(() => {
    try {
      localStorage.setItem(LIB_KEY, JSON.stringify(opts));
    } catch {
      /* a preference only */
    }
  }, [opts]);

  // the score is engraved once per choice (it takes a moment); the libretto is made at once
  const scoreKey = `${withNotes && hasNotes && mineShown}|${shown.join()}`;
  useEffect(() => {
    if (kind !== "score" || scoreHtml?.key === scoreKey) return;
    let live = true;
    setBusy(true);
    setFailed(false);
    makeScore(withNotes && hasNotes && mineShown, shown.length === parts.length ? null : shown)
      .then((html) => live && setScoreHtml({ key: scoreKey, html }))
      .catch(() => live && setFailed(true))
      .finally(() => live && setBusy(false));
    return () => {
      live = false;
    };
  }, [kind, scoreKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // while the score is engraved again the last preview stays, marked as updating
  const stale = kind === "score" && scoreHtml?.key !== scoreKey;
  const html = kind === "score" ? (scoreHtml?.html ?? null) : makeLibretto(opts);
  useEffect(() => setState("idle"), [kind, html]);

  const save = async () => {
    if (!html) return;
    setState("saving");
    const how = await printDocument(html);
    setState(how === "dialog" ? "idle" : how);
  };

  const row = (on: boolean, flip: () => void, label: string, hint: string) => (
    <button type="button" className="ex-row" role="switch" aria-checked={on} onClick={flip}>
      <span className="ex-row-text">
        <span className="ex-row-label">{label}</span>
        {hint && <span className="ex-row-hint">{hint}</span>}
      </span>
      <span className="ex-switch" aria-hidden="true" />
    </button>
  );
  const toggle = (k: keyof LibrettoOptions, label: string, hint: string) => row(opts[k], () => setOpts((o) => ({ ...o, [k]: !o[k] })), label, hint);

  return (
    <div className="ex-sheet" role="dialog" aria-modal="true" aria-labelledby="ex-h">
      <button type="button" className="syn-scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <div className="ex-panel">
        <header className="ex-head">
          <div>
            <p className="cp-eyebrow">Save as PDF</p>
            <h2 id="ex-h">{title}</h2>
          </div>
          <button ref={closeRef} type="button" className="cp-icon-btn cp-icon-btn--ghost" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </header>
        <div className="ex-body">
          <aside className="ex-side">
            <div className="ex-group">
              <p className="ex-label">Document</p>
              <div className="cp-seg ex-seg" role="group" aria-label="What to save">
                <button type="button" aria-pressed={kind === "score"} onClick={() => setKind("score")}>
                  Score
                </button>
                <button type="button" aria-pressed={kind === "libretto"} onClick={() => setKind("libretto")}>
                  Libretto
                </button>
              </div>
              <p className="ex-hint">
                {kind === "score" ? "The music on A4 pages, with the lines you choose." : "The words of this piece, in the order they are sung."}
              </p>
            </div>
            {kind === "score" ? (
              <>
                {parts.length > 1 && (
                  <div className="ex-group">
                    <p className="ex-label">Lines</p>
                    <div className="ex-rows">
                      {parts.map((p) =>
                        row(
                          shown.includes(p.id),
                          () =>
                            setShown((s) =>
                              s.includes(p.id) ? (s.length > 1 ? s.filter((x) => x !== p.id) : s) : parts.map((x) => x.id).filter((x) => x === p.id || s.includes(x)),
                            ),
                          p.label,
                          p.you ? "Your part" : "",
                        ),
                      )}
                    </div>
                  </div>
                )}
                {hasNotes && (
                  <div className="ex-group">
                    <p className="ex-label">Include</p>
                    <div className="ex-rows">
                      {row(withNotes && mineShown, () => setWithNotes((v) => !v), "Your notes and marks", mineShown ? "Written in at their bar, listed at the end" : "Shown over your part: include it")}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {ensemble && (
                  <div className="ex-group">
                    <p className="ex-label">Lines</p>
                    <div className="cp-seg ex-seg" role="group" aria-label="Whose lines">
                      <button type="button" aria-pressed={opts.everyone} onClick={() => setOpts((o) => ({ ...o, everyone: true }))}>
                        Everyone’s
                      </button>
                      <button type="button" aria-pressed={!opts.everyone} onClick={() => setOpts((o) => ({ ...o, everyone: false }))} title={`Only ${roleName}’s lines`}>
                        Only mine
                      </button>
                    </div>
                  </div>
                )}
                <div className="ex-group">
                  <p className="ex-label">Include</p>
                  <div className="ex-rows">
                    {toggle("translation", "English translation", "Beside each line")}
                    {toggle("ipa", "IPA", "How each word is pronounced")}
                    {toggle("gloss", "Word by word", "Each word with its meaning")}
                    {toggle("repeats", "Repeated lines", "Every repetition, as sung")}
                  </div>
                </div>
              </>
            )}
            <div className="ex-actions">
              <button type="button" className="cp-btn cp-btn--ink" onClick={save} disabled={!html || stale || state === "saving"}>
                {state === "saving" ? "Opening…" : "Save as PDF"}
              </button>
              {state === "blocked" && (
                <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setState(html && openInTab(html) ? "tab" : "noTab")}>
                  Open in a new tab
                </button>
              )}
              <p className="ex-msg" role="status">
                {state === "tab"
                  ? "It opened in a new tab: print it there and choose Save as PDF."
                  : state === "blocked"
                    ? "Printing is blocked here: open it in a new tab."
                    : state === "noTab"
                      ? "Open Sottovoce in its own browser tab, then try again."
                      : "In the print window, choose Save as PDF."}
              </p>
            </div>
          </aside>
          <div className="ex-preview" aria-label="Preview" aria-busy={!html}>
            {html ? (
              <>
                <iframe title="Preview" srcDoc={forPreview(html)} className={stale ? "stale" : undefined} />
                {stale && <p className="ex-updating">{failed ? "Could not update. Try again." : "Updating…"}</p>}
              </>
            ) : (
              <p className="ex-wait">{failed ? "The score could not be prepared. Try again." : busy ? "Engraving the score…" : ""}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
