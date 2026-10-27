import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import editionJson from "../../data/content/puccini-o-mio-babbino-caro/edition.json";
import languageJson from "../../data/content/puccini-o-mio-babbino-caro/language.json";
import { Performance } from "../../shared/timeline";
import type { CompiledEdition, CompiledLanguage } from "../../shared/types";
import { usePlayback } from "../audio/usePlayback";
import previewScore from "./preview-score.svg?raw";
import { decorate, syllableRanges } from "./syllables";
import { ART, NUMBERS, PORTRAITS, STORIES } from "./opera-extra";
import { AUTO_NOTE, LINE_SOUNDS, type LineChoice } from "./settings";
import { OPERAS, type AvatarKind, type Character, type Opera, type Piece } from "./operas";

/** Pastel tones. A character's tone follows the voice type, so a soprano is always pink, a tenor always sky. */
export type Tone = "pink" | "lilac" | "peach" | "sky" | "mint" | "butter";
export function voiceTone(voice: string): Tone {
  const v = voice.toLowerCase();
  if (v.startsWith("mezzo")) return "lilac";
  if (v.startsWith("contralto")) return "peach";
  if (v.startsWith("soprano")) return "pink";
  if (v.startsWith("tenor")) return "sky";
  if (v.startsWith("bass") && !v.includes("baritone")) return "butter";
  return "mint";
}
const OPERA_TONES: Tone[] = ["sky", "lilac", "mint", "butter", "peach", "pink"];

/** Simple flat portraits: the body in the character's deeper tone, a white face, hair in soft ink. */
export function Avatar({ kind }: { kind: AvatarKind }) {
  const body = <path style={{ fill: "var(--tone-deep, var(--ink))" }} d="M8 64C8 49 18 42 32 42s24 7 24 22z" />;
  const face = (r = 11, cy = 28) => <circle style={{ fill: "var(--av-face, #ffffff)" }} cx="32" cy={cy} r={r} />;
  const ink = { fill: "var(--av-hair, #3a3c38)" };
  const parts: Record<AvatarKind, ReactNode> = {
    short: (
      <>
        {body}
        {face()}
        <path style={ink} d="M21 27c0-9 5-13 11-13s11 4 11 13c-2-4-6-6-11-6s-9 2-11 6z" />
      </>
    ),
    cap: (
      <>
        {body}
        {face()}
        <path style={ink} d="M20 22c0-7 5-11 12-11s12 4 12 11z" />
        <rect style={ink} x="17" y="20" width="30" height="4" />
        <rect style={ink} x="27" y="31" width="10" height="3" />
      </>
    ),
    bun: (
      <>
        <rect style={ink} x="19" y="26" width="4" height="16" />
        <rect style={ink} x="41" y="26" width="4" height="16" />
        {body}
        {face()}
        <circle style={ink} cx="32" cy="13" r="6" />
        <path style={ink} d="M21 28a11 11 0 0 1 22 0c-4-3-7-5-11-5s-7 2-11 5z" />
      </>
    ),
    long: (
      <>
        <path style={ink} d="M19 28c0-10 6-15 13-15s13 5 13 15v18H19z" />
        {body}
        {face()}
        <path style={ink} d="M21 27a11 11 0 0 1 22 0c-5-2-8-6-11-6s-6 4-11 6z" />
      </>
    ),
    curls: (
      <>
        {body}
        {face()}
        <circle style={ink} cx="24" cy="21" r="5" />
        <circle style={ink} cx="31" cy="17" r="5" />
        <circle style={ink} cx="38" cy="18" r="5" />
        <circle style={ink} cx="42" cy="24" r="4" />
      </>
    ),
    hood: (
      <>
        {body}
        <circle style={ink} cx="32" cy="28" r="15" />
        {face(10, 29)}
        <path style={ink} d="M28 41h8l-4 6z" />
      </>
    ),
    beard: (
      <>
        {body}
        {face()}
        <rect style={ink} x="19" y="24" width="3" height="7" />
        <rect style={ink} x="42" y="24" width="3" height="7" />
        <path style={ink} d="M22 30c2 10 6 13 10 13s8-3 10-13c-3 3-6 4-10 4s-7-1-10-4z" />
      </>
    ),
    hat: (
      <>
        {body}
        <path style={ink} d="M21 22h4v11h-4zM39 22h4v11h-4z" />
        {face()}
        <path style={ink} d="M23 19c0-6 4-9 9-9s9 3 9 9z" />
        <rect style={ink} x="13" y="18" width="38" height="4" />
      </>
    ),
    crown: (
      <>
        {body}
        {face()}
        <rect style={ink} x="21" y="19" width="22" height="4" />
        <path style={ink} d="M21 19l2-9 5 5 4-7 4 7 5-5 2 9z" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }}>
      {parts[kind]}
    </svg>
  );
}

/** A character's picture: the illustrated portrait when there is one, otherwise the simple avatar. */
export function Face({ opera, ch }: { opera: Opera; ch: Character }) {
  const art = PORTRAITS[`${opera.id}:${ch.id}`];
  if (art) return <img className="face-img" src={art.face} alt="" />;
  return <Avatar kind={ch.avatar} />;
}

/* ====================================================================================
   Places, state shared by every screen, and helpers
   ==================================================================================== */

/** A role you sing: a character in an opera. */
export interface RoleRef {
  opera: string;
  character: string;
}
export interface Profile {
  voices: string[];
  notSinger: boolean;
}
export type PiecePlace = { screen: "piece"; opera: string; character: string; piece: number };
export type Place =
  | { screen: "onboarding"; step: 1 | 2 | 3; role?: RoleRef; by?: "voice" | "opera"; opera?: string }
  | { screen: "role"; opera: string; character: string }
  | { screen: "opera"; opera: string }
  | { screen: "explore"; by: "opera" | "voice"; voice?: string }
  | { screen: "profile" }
  | PiecePlace;

/** Everything a screen needs: where you are, your roles, your progress, and how to move. */
export interface Ctx {
  place: Place;
  go: (p: Place) => void;
  home: () => Place;
  roles: RoleRef[];
  current: RoleRef | null;
  last: PiecePlace | null;
  learned: Record<string, string[]>;
  toggleLearned: (r: RoleRef, key: string) => void;
  toggleRole: (r: RoleRef) => void;
  chooseRole: (r: RoleRef) => void;
  removeRole: (r: RoleRef) => void;
  profile: Profile;
  setProfile: (p: Profile) => void;
  finishOnboarding: (to: Place) => void;
  /** erase everything kept on this device and begin again at the welcome */
  startOver: () => void;
}

export const VOICES = ["Soprano", "Mezzo-soprano", "Contralto", "Tenor", "Baritone", "Bass"];
const PLURAL: Record<string, string> = {
  Soprano: "sopranos",
  "Mezzo-soprano": "mezzo-sopranos",
  Contralto: "contraltos",
  Tenor: "tenors",
  Baritone: "baritones",
  Bass: "basses",
};
/** The broad voice a character's part belongs to (a bass-baritone is listed with the baritones). */
export function voiceGroup(voice: string): string {
  const v = voice.toLowerCase();
  if (v.startsWith("mezzo")) return "Mezzo-soprano";
  if (v.startsWith("contralto")) return "Contralto";
  if (v.startsWith("soprano")) return "Soprano";
  if (v.startsWith("tenor")) return "Tenor";
  if (v.startsWith("bass") && !v.includes("baritone")) return "Bass";
  return "Baritone";
}

export const same = (a: RoleRef | null, b: RoleRef | null) => !!a && !!b && a.opera === b.opera && a.character === b.character;
export const roleKey = (r: RoleRef) => `${r.opera}:${r.character}`;
export const pieceKey = (p: Piece) => p.id ?? p.title;
export const findOpera = (id: string): Opera => OPERAS.find((o) => o.id === id) ?? OPERAS[OPERAS.length - 1];
export const findCharacter = (o: Opera, id: string): Character => o.chars.find((c) => c.id === id) ?? o.chars[0];
const resolve = (r: RoleRef | null) => {
  if (!r) return null;
  const opera = OPERAS.find((o) => o.id === r.opera);
  const ch = opera?.chars.find((c) => c.id === r.character);
  return opera && ch ? { opera, ch } : null;
};
export function progressOf(ctx: Ctx, opera: Opera, ch: Character) {
  const set = new Set(ctx.learned[roleKey({ opera: opera.id, character: ch.id })] ?? []);
  const total = ch.pieces.length;
  const done = ch.pieces.filter((p) => set.has(pieceKey(p))).length;
  return { done, total, pct: total ? done / total : 0, set };
}
/** The aria to go back to for a role: the one last practised, otherwise the first that is ready. */
function continueTarget(ctx: Ctx, opera: Opera, ch: Character): { place: PiecePlace; resumed: boolean } | null {
  if (ctx.last && ctx.last.opera === opera.id && ctx.last.character === ch.id && ch.pieces[ctx.last.piece]?.editionId) return { place: ctx.last, resumed: true };
  const i = ch.pieces.findIndex((p) => p.editionId);
  return i >= 0 ? { place: { screen: "piece", opera: opera.id, character: ch.id, piece: i }, resumed: false } : null;
}
/** Every piece in the library that is ready to learn, with where it lives. */
export function readyPieces(): { opera: Opera; ch: Character; index: number }[] {
  const out: { opera: Opera; ch: Character; index: number }[] = [];
  for (const opera of OPERAS) for (const ch of opera.chars) ch.pieces.forEach((p, index) => p.editionId && out.push({ opera, ch, index }));
  return out;
}

/* ---------------- icons ---------------- */
const Play = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M7 4.5v15L19.5 12z" />
  </svg>
);
const Plus = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);
export const Check = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
  </svg>
);
const Chevron = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const LibraryIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="7" cy="7" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="17" cy="7" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="7" cy="17" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="17" cy="17" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const VoiceIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 10.5v6M12 7.2v.1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
const GearIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      d="M10.3 3.5h3.4l.5 2.4 1.7.9 2.3-.9 1.7 2.9-1.8 1.6v1.9l1.8 1.6-1.7 2.9-2.3-.9-1.7.9-.5 2.4h-3.4l-.5-2.4-1.7-.9-2.3.9-1.7-2.9 1.8-1.6v-1.9L4.1 8.8l1.7-2.9 2.3.9 1.7-.9z"
    />
  </svg>
);
const PersonIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const RestartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

/** Start the whole experience again. A second tap confirms, so it never happens by accident. */
export function StartOver({ ctx, big }: { ctx: Ctx; big?: boolean }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      className={`start-over${armed ? " armed" : ""}${big ? " big" : ""}`}
      aria-live="polite"
      onClick={() => (armed ? ctx.startOver() : setArmed(true))}
    >
      <RestartIcon />
      <span>{armed ? "Tap again to erase everything" : "Start over"}</span>
    </button>
  );
}

/** A ring that fills as a role is learned, with the portrait inside. */
export function ProgressRing({ value, size, stroke = 4, children }: { value: number; size: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="ring-track" />
        {value > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="ring-fill"
          strokeDasharray={`${c * value} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeLinecap="round"
        />
        )}
      </svg>
      <span className="ring-in" style={{ inset: stroke + 3 }}>
        {children}
      </span>
    </span>
  );
}

/* ====================================================================================
   The shell: the sidebar (what you are learning, then everything else), and the page
   ==================================================================================== */

function Sidebar({ ctx }: { ctx: Ctx }) {
  const { place, go } = ctx;
  const cur = resolve(ctx.current);
  const all = ctx.roles.map(resolve).filter((x): x is NonNullable<typeof x> => !!x);
  const on = (test: boolean) => (test ? "page" : undefined);
  return (
    <aside className="sidebar" aria-label="Your roles and the library">
      <button type="button" className="sb-mark" onClick={() => go(ctx.home())}>
        Counterpart
      </button>

      {/* my roles: one face each to switch between them, then the chosen role's card */}
      {cur && (
        <div className="sb-roles">
          <div className="sb-roles-head">
            <p className="sb-label" id="sb-roles-h">
              My roles
            </p>
            <button type="button" className="sb-add" aria-label="Add a role" title="Add a role" onClick={() => go({ screen: "explore", by: "opera" })}>
              <Plus />
            </button>
          </div>
          {all.length > 1 && (
            <div className="sb-faces" role="radiogroup" aria-labelledby="sb-roles-h">
              {all.map(({ opera, ch }) => {
                const r = { opera: opera.id, character: ch.id };
                const picked = same(r, ctx.current);
                return (
                  <button
                    key={`${opera.id}:${ch.id}`}
                    type="button"
                    role="radio"
                    aria-checked={picked}
                    className="sb-face"
                    data-tone={voiceTone(ch.voice)}
                    title={`${ch.name} · ${opera.title}`}
                    aria-label={`${ch.name}, ${opera.title}`}
                    onClick={() => ctx.chooseRole(r)}
                  >
                    <span className="sb-face-pic">
                      <ProgressRing value={progressOf(ctx, opera, ch).pct} size={46} stroke={3}>
                        <Face opera={opera} ch={ch} />
                      </ProgressRing>
                    </span>
                    <span className="sb-face-name">{ch.name.replace(/^The /, "")}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {cur ? (
        (() => {
          const { opera, ch } = cur;
          const pr = progressOf(ctx, opera, ch);
          const target = continueTarget(ctx, opera, ch);
          // the role's other pieces, in the order of the opera, under the one to continue (those without music yet quieter)
          const more = ch.pieces.map((p, i) => ({ p, i })).filter(({ i }) => i !== target?.place.piece);
          return (
            <section className="sb-now" data-tone={voiceTone(ch.voice)} aria-label="What you are learning" key={`${opera.id}:${ch.id}`}>
              <button
                type="button"
                className="sb-role"
                aria-current={on(place.screen === "role" && place.opera === opera.id && place.character === ch.id)}
                onClick={() => go({ screen: "role", opera: opera.id, character: ch.id })}
              >
                <ProgressRing value={pr.pct} size={60} stroke={4}>
                  <Face opera={opera} ch={ch} />
                </ProgressRing>
                <span className="sb-role-text">
                  <b>{ch.name}</b>
                  <small>
                    {pr.done} of {pr.total} learned
                  </small>
                </span>
              </button>
              {target && (
                <button type="button" className="sb-continue" onClick={() => go(target.place)}>
                  <span className="sb-play">
                    <Play />
                  </span>
                  <span>
                    <small>{target.resumed ? "Continue" : "Start"}</small>
                    <b lang={opera.lang}>{ch.pieces[target.place.piece].title}</b>
                  </span>
                </button>
              )}
              {more.length > 0 && (
                <div className="sb-pieces">
                  {more.map(({ p, i }) => (
                    <button
                      key={pieceKey(p)}
                      type="button"
                      title={p.editionId ? p.title : `${p.title}: music not here yet`}
                      className={`sb-piece${p.editionId ? "" : " soon"}`}
                      aria-current={on(place.screen === "piece" && place.opera === opera.id && place.character === ch.id && place.piece === i)}
                      onClick={() => go(p.editionId ? { screen: "piece", opera: opera.id, character: ch.id, piece: i } : { screen: "role", opera: opera.id, character: ch.id })}
                      aria-label={p.editionId ? undefined : `${p.title}: music not here yet`}
                    >
                      <span className="sb-piece-play" aria-hidden="true">
                        {p.editionId ? <Play /> : null}
                      </span>
                      <span lang={opera.lang}>{p.title}</span>
                      {pr.set.has(pieceKey(p)) && (
                        <span className="sb-piece-done" aria-label="learned">
                          <Check />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <button type="button" className="sb-opera" aria-current={on(place.screen === "opera" && place.opera === opera.id)} onClick={() => go({ screen: "opera", opera: opera.id })}>
                {ART[opera.id] ? <img className="sb-art" src={ART[opera.id].square} alt="" /> : <Chevron />}
                <span lang={opera.lang}>{opera.title}</span>
              </button>
            </section>
          );
        })()
      ) : (
        <section className="sb-now sb-none">
          <b>No role yet</b>
          <span>Find the character you sing.</span>
          <button type="button" className="cp-btn cp-btn--ink" onClick={() => go({ screen: "explore", by: "opera" })}>
            Find your role
          </button>
        </section>
      )}

      <nav className="sb-group" aria-label="Explore">
        <p className="sb-label">Explore</p>
        <button type="button" className="sb-link" aria-current={on(place.screen === "explore" && place.by === "opera")} onClick={() => go({ screen: "explore", by: "opera" })}>
          <LibraryIcon />
          <span>By opera</span>
        </button>
        <button type="button" className="sb-link" aria-current={on(place.screen === "explore" && place.by === "voice")} onClick={() => go({ screen: "explore", by: "voice" })}>
          <VoiceIcon />
          <span>By voice</span>
        </button>
      </nav>

      <span className="sb-spacer" />
      <button type="button" className="sb-link sb-settings" aria-current={on(place.screen === "profile")} onClick={() => go({ screen: "profile" })}>
        <GearIcon />
        <span>Settings</span>
      </button>
    </aside>
  );
}

/**
 * The side panel over a full-screen page (the practice screen): it slides in from the left over the music,
 * so you can switch to another piece or role; a tap outside, Escape or going somewhere closes it.
 */
export function SideDrawer({ ctx, open, onClose }: { ctx: Ctx; open: boolean; onClose: () => void }) {
  const key = JSON.stringify(ctx.place);
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  return (
    <div className={`side-drawer${open ? " open" : ""}`} aria-hidden={!open}>
      <button type="button" className="sd-scrim" aria-label="Close the menu" tabIndex={open ? 0 : -1} onClick={onClose} />
      {/* closed: out of reach for keyboards and screen readers (inert; React 18 has no type for it) */}
      <div className="sd-panel" {...(open ? {} : ({ inert: "" } as object))}>
        <Sidebar ctx={ctx} />
      </div>
    </div>
  );
}

/** On narrower screens the sidebar slides in; the role you are learning stays in the top bar. */
function NowPill({ ctx }: { ctx: Ctx }) {
  const cur = resolve(ctx.current);
  if (!cur) return null;
  const { opera, ch } = cur;
  const target = continueTarget(ctx, opera, ch);
  return (
    <div className="now-pill" data-tone={voiceTone(ch.voice)}>
      <button type="button" className="np-role" onClick={() => ctx.go({ screen: "role", opera: opera.id, character: ch.id })}>
        <span className="np-face">
          <Face opera={opera} ch={ch} />
        </span>
        <span>{ch.name}</span>
      </button>
      {target && (
        <button type="button" className="np-play" aria-label={`${target.resumed ? "Continue" : "Start"} ${ch.pieces[target.place.piece].title}`} onClick={() => ctx.go(target.place)}>
          <Play />
        </button>
      )}
    </div>
  );
}

export function Shell({ ctx, children }: { ctx: Ctx; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(ctx.place);
  useEffect(() => {
    setOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [key]);
  return (
    <div className={`shell${open ? " open" : ""}`}>
      <Sidebar ctx={ctx} />
      <div className="shell-main">
        <header className="topbar gutter">
          <button type="button" className="cp-icon-btn cp-icon-btn--ghost" aria-label="Open the menu" onClick={() => setOpen(true)}>
            <MenuIcon />
          </button>
          <button type="button" className="topbar-mark" onClick={() => ctx.go(ctx.home())}>
            Counterpart
          </button>
          <NowPill ctx={ctx} />
        </header>
        <div className="screen" ref={mainRef}>
          {children}
        </div>
      </div>
      <button type="button" className="scrim" aria-label="Close the menu" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
        <CloseIcon />
      </button>
    </div>
  );
}

function BackTo({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="back-to" onClick={onClick}>
      <BackIcon />
      <span>{label}</span>
    </button>
  );
}

/* ====================================================================================
   A role: everything the character sings, checked off as you learn it
   ==================================================================================== */

export function RolePage({ ctx, opera, ch }: { ctx: Ctx; opera: Opera; ch: Character }) {
  const r = { opera: opera.id, character: ch.id };
  const mine = ctx.roles.some((x) => same(x, r));
  const pr = progressOf(ctx, opera, ch);
  // one piece's scene open at a time, inside its own row
  const [open, setOpen] = useState<string | null>(null);
  return (
    <main className="screen-body gutter page">
      <section className={`rp-head${ART[opera.id] ? " has-art" : ""}`} data-tone={voiceTone(ch.voice)}>
        {ART[opera.id] && <div className="art-band" role="img" aria-label={ART[opera.id].alt} style={{ backgroundImage: `url(${ART[opera.id].cover})` }} />}
        <ProgressRing value={pr.pct} size={152} stroke={7}>
          <Face opera={opera} ch={ch} />
        </ProgressRing>
        <div className="rp-id">
          <h1>{ch.name}</h1>
          <button type="button" className="rp-opera" onClick={() => ctx.go({ screen: "opera", opera: opera.id })}>
            <span lang={opera.lang}>{opera.title}</span> · {opera.composer}
            <Chevron />
          </button>
          <p className="rp-desc">{ch.desc}</p>
          <div className="rp-actions">
            <button type="button" className="cp-btn mine-toggle" aria-pressed={mine} onClick={() => ctx.toggleRole(r)}>
              {mine ? <Check /> : <Plus />}
              {mine ? "In my roles" : "Add to my roles"}
            </button>
          </div>
        </div>
        {pr.total > 0 && (
          <div className="rp-progress" aria-label={`${pr.done} of ${pr.total} learned`}>
            <p>
              <b>{pr.done}</b> of {pr.total} learned
            </p>
            <div className="rp-bar" aria-hidden="true">
              {ch.pieces.map((p) => (
                <i key={pieceKey(p)} className={pr.set.has(pieceKey(p)) ? "on" : ""} />
              ))}
            </div>
            <small>{pr.done === pr.total ? "The whole role is learned." : `${Math.round(pr.pct * 100)}% of the role`}</small>
          </div>
        )}
      </section>

      <section className="block" aria-labelledby="music-h">
        <p className="cp-eyebrow" id="music-h">
          {ch.name}'s music, in the order of the opera
        </p>
        {ch.pieces.length ? (
          <ol className="checklist">
            {ch.pieces.map((p, i) => {
              const k = pieceKey(p);
              const done = pr.set.has(k);
              const ready = !!p.editionId;
              const isOpen = open === k;
              const panelId = `scene-${k}`;
              const toggle = () => setOpen(isOpen ? null : k);
              return (
                <li key={k} className={`ck${ready ? " ready" : " soon"}${done ? " done" : ""}${isOpen ? " open" : ""}`}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    className="ck-box"
                    aria-label={`${p.title}: learned`}
                    onClick={() => ctx.toggleLearned(r, k)}
                  >
                    <Check />
                  </button>
                  {ready || p.context ? (
                    <button
                      type="button"
                      className="ck-text"
                      aria-label={ready ? `Practise ${p.title}` : undefined}
                      aria-expanded={ready ? undefined : isOpen}
                      aria-controls={ready ? undefined : panelId}
                      onClick={ready ? () => ctx.go({ screen: "piece", opera: opera.id, character: ch.id, piece: i }) : toggle}
                    >
                      <b lang={opera.lang}>{p.title}</b>
                      <span>{p.kind}</span>
                    </button>
                  ) : (
                    <span className="ck-text">
                      <b lang={opera.lang}>{p.title}</b>
                      <span>{p.kind}</span>
                    </span>
                  )}
                  {p.context && (
                    <button type="button" className="ck-scene" aria-expanded={isOpen} aria-controls={panelId} onClick={toggle}>
                      <span className="ck-scene-label">Scene</span>
                      <ChevronDown />
                      <span className="sr-only">: {p.title}</span>
                    </button>
                  )}
                  {ready && (
                    <button type="button" className="ck-play" aria-label={`Practise ${p.title}`} onClick={() => ctx.go({ screen: "piece", opera: opera.id, character: ch.id, piece: i })}>
                      <Play />
                    </button>
                  )}
                  {p.context && (
                    <div className="ck-panel" id={panelId} role="region" aria-label={`The scene: ${p.title}`}>
                      <div>
                        <p className="ck-panel-eyebrow">The scene</p>
                        <p className="ck-panel-text">{p.context}</p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="empty-field">
            <p>{ch.name} sings in the ensembles. No solo pieces are listed yet.</p>
          </div>
        )}
        <p className="ck-note">
          {(() => {
            const canPlay = ch.pieces.some((p) => p.editionId);
            const canRead = ch.pieces.some((p) => p.context);
            const how = canPlay && canRead ? "Tap a piece to practise it, or Scene to read what happens in it. " : canPlay ? "Tap a piece to practise it. " : canRead ? "Tap Scene to read what happens in a piece. " : "";
            return `${how}Tick a piece when you know it.`;
          })()}
        </p>
      </section>
    </main>
  );
}

/* ====================================================================================
   An opera: the story, its characters, and its music in order
   ==================================================================================== */

interface Row {
  title: string;
  kind: string;
  who: string[];
  piece?: { character: string; index: number };
}
function rowsFor(opera: Opera): Row[] {
  if (NUMBERS[opera.id]) return NUMBERS[opera.id];
  const byTitle = new Map<string, Row & { act: number; order: number }>();
  let order = 0;
  for (const c of opera.chars)
    c.pieces.forEach((p, index) => {
      const key = p.title;
      const act = Number(/Act (\d)/.exec(p.kind)?.[1] ?? 9);
      const known = byTitle.get(key);
      if (known) known.who.push(c.id);
      else byTitle.set(key, { title: p.title, kind: p.kind.split(" · ")[0], who: [c.id], piece: { character: c.id, index }, act, order: order++ });
    });
  return [...byTitle.values()].sort((a, b) => a.act - b.act || a.order - b.order);
}

export function OperaPage({ ctx, opera }: { ctx: Ctx; opera: Opera }) {
  const tone = OPERA_TONES[OPERAS.indexOf(opera) % OPERA_TONES.length];
  const mineHere = opera.chars.filter((c) => ctx.roles.some((r) => same(r, { opera: opera.id, character: c.id })));
  const rows = rowsFor(opera);
  const name = (id: string) => opera.chars.find((c) => c.id === id)?.name ?? id;
  const ordered = !!NUMBERS[opera.id];
  const [open, setOpen] = useState<number | null>(null);
  return (
    <main className="screen-body gutter page">
      <BackTo label="All operas" onClick={() => ctx.go({ screen: "explore", by: "opera" })} />
      <section className={`op-head${ART[opera.id] ? " has-art" : ""}`} data-tone={tone}>
        {ART[opera.id] && (
          <figure className="op-cover">
            <img src={ART[opera.id].cover} alt={ART[opera.id].alt} />
          </figure>
        )}
        <p className="cp-eyebrow">
          {opera.composerFull} · {opera.year} · libretto by {opera.librettist}
        </p>
        <h1 lang={opera.lang}>{opera.title}</h1>
        {STORIES[opera.id] && <p className="op-story">{STORIES[opera.id]}</p>}
        {mineHere.length > 0 && (
          <p className="op-yours">
            Your role: <b>{mineHere.map((c) => c.name).join(", ")}</b>
          </p>
        )}
      </section>

      <section className="block" aria-labelledby="chars-h">
        <p className="cp-eyebrow" id="chars-h">
          Characters
        </p>
        <div className="showcase cast">
          {opera.chars.map((c) => {
            const ready = c.pieces.some((p) => p.editionId);
            const yours = ctx.roles.some((r) => same(r, { opera: opera.id, character: c.id }));
            const art = PORTRAITS[`${opera.id}:${c.id}`];
            return (
              <button
                key={c.id}
                type="button"
                className={`sc-card${art ? " has-art" : ""}${ready ? "" : " soon"}`}
                data-tone={voiceTone(c.voice)}
                onClick={() => ctx.go({ screen: "role", opera: opera.id, character: c.id })}
              >
                <span className="sc-pic">
                  {art ? (
                    <img src={art.portrait} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="sc-bust" aria-hidden="true">
                      <Avatar kind={c.avatar} />
                    </span>
                  )}
                  {yours && <span className="cp-tag cp-tag--now sc-tag">Your role</span>}
                </span>
                <span className="sc-text">
                  <b>{c.name}</b>
                  <span>{c.voice}</span>
                  <em>{c.desc}</em>
                  <small>{c.pieces.length === 0 ? "Ensembles only" : c.pieces.length === 1 ? "1 piece" : `${c.pieces.length} pieces`}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="block" aria-labelledby="numbers-h">
        <p className="cp-eyebrow" id="numbers-h">
          {ordered ? "The opera, in order" : "Arias and ensembles"}
        </p>
        <ol className="numbers">
          {rows.map((row, i) => {
            const ch = row.piece ? opera.chars.find((c) => c.id === row.piece!.character) : undefined;
            const p = ch && row.piece ? ch.pieces[row.piece.index] : undefined;
            const ready = !!p?.editionId;
            const yours = row.who.some((id) => mineHere.some((c) => c.id === id));
            const isOpen = open === i;
            const toggle = () => setOpen(isOpen ? null : i);
            return (
              <li
                key={i}
                className={`num${ready ? " ready" : " soon"}${yours ? " yours" : ""}${p?.context ? " linked" : ""}${isOpen ? " open" : ""}`}
                onClick={p?.context ? toggle : undefined}
              >
                <span className="num-i">{i + 1}</span>
                <div className="num-text">
                  <b lang={opera.lang}>{row.title}</b>
                  <span>
                    {row.kind} ·{" "}
                    {row.who.map((id, k) => (
                      <span key={id}>
                        {k > 0 && ", "}
                        {mineHere.some((c) => c.id === id) ? <strong>{name(id)}</strong> : name(id)}
                      </span>
                    ))}
                  </span>
                </div>
                {p?.context && (
                  <button
                    type="button"
                    className="ck-scene"
                    aria-expanded={isOpen}
                    aria-controls={`num-scene-${i}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle();
                    }}
                  >
                    <span className="ck-scene-label">Scene</span>
                    <ChevronDown />
                    <span className="sr-only">: {row.title}</span>
                  </button>
                )}
                {ready && ch && row.piece && (
                  <button
                    type="button"
                    className="cp-btn cp-btn--ink num-go"
                    onClick={(e) => {
                      e.stopPropagation();
                      ctx.go({ screen: "piece", opera: opera.id, character: ch.id, piece: row.piece!.index });
                    }}
                  >
                    <Play />
                    Practise
                  </button>
                )}
                {p?.context && (
                  <div className="ck-panel" id={`num-scene-${i}`} role="region" aria-label={`The scene: ${row.title}`} onClick={(e) => e.stopPropagation()}>
                    <div>
                      <p className="ck-panel-eyebrow">The scene</p>
                      <p className="ck-panel-text">{p.context}</p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

/* ====================================================================================
   Explore: by opera, by voice
   ==================================================================================== */

function ReadyCard({ ctx, opera, ch, index }: { ctx: Ctx; opera: Opera; ch: Character; index: number }) {
  const piece = ch.pieces[index];
  return (
    <button type="button" className="ready-card" data-tone={voiceTone(ch.voice)} onClick={() => ctx.go({ screen: "piece", opera: opera.id, character: ch.id, piece: index })}>
      <span className="ready-face">
        <Face opera={opera} ch={ch} />
      </span>
      <span className="ready-text">
        <b lang={opera.lang}>{piece.title}</b>
        <span>
          {piece.kind.split(" · ")[0]} · {ch.name} · {opera.title}
        </span>
      </span>
      <span className="cp-btn cp-btn--ink ready-go">Start</span>
    </button>
  );
}

export function ExploreOperas({ ctx }: { ctx: Ctx }) {
  return (
    <main className="screen-body gutter page">
      <section className="hero compact">
        <h1>Operas</h1>
        <p className="lede">Choose an opera to see its story, its characters and its music. In the order of their first performance.</p>
      </section>
      <section className="block" aria-label="All operas">
        <p className="cp-eyebrow">All operas</p>
        <div className="showcase tiles">
          {OPERAS.map((o, i) => {
            const art = ART[o.id];
            const yours = o.chars.filter((c) => ctx.roles.some((r) => same(r, { opera: o.id, character: c.id })));
            return (
              <button
                key={o.id}
                type="button"
                className={`sc-card${art ? " has-art" : ""}`}
                data-tone={OPERA_TONES[i % OPERA_TONES.length]}
                onClick={() => ctx.go({ screen: "opera", opera: o.id })}
              >
                <span className="sc-pic">
                  {art ? <img src={art.square} alt="" loading="lazy" decoding="async" /> : <span className="sc-year">{o.year}</span>}
                </span>
                <span className="sc-text">
                  <b lang={o.lang}>{o.title}</b>
                  <span>
                    {o.composer} · {o.year}
                  </span>
                  {yours.length > 0 && <small className="sc-yours">Your role: {yours.map((c) => c.name).join(", ")}</small>}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function RoleCard({ ctx, opera, ch }: { ctx: Ctx; opera: Opera; ch: Character }) {
  const ready = ch.pieces.filter((p) => p.editionId).length;
  const yours = ctx.roles.some((r) => same(r, { opera: opera.id, character: ch.id }));
  return (
    <button type="button" className={`vrole${ready ? " ready" : " soon"}`} data-tone={voiceTone(ch.voice)} onClick={() => ctx.go({ screen: "role", opera: opera.id, character: ch.id })}>
      <span className="vrole-face">
        <Face opera={opera} ch={ch} />
      </span>
      <span className="vrole-text">
        <b>{ch.name}</b>
        <span lang={opera.lang}>{opera.title}</span>
        <em>{ch.desc}</em>
        <small>{ch.pieces.length === 0 ? "Ensembles only" : ch.pieces.length === 1 ? "1 piece" : `${ch.pieces.length} pieces`}</small>
      </span>
      {yours && <span className="cp-tag cp-tag--now">Yours</span>}
    </button>
  );
}

function rolesForVoice(voice: string, readyOnly: boolean) {
  const out: { opera: Opera; ch: Character }[] = [];
  for (const opera of OPERAS) for (const ch of opera.chars) if (voiceGroup(ch.voice) === voice && (!readyOnly || ch.pieces.some((p) => p.editionId))) out.push({ opera, ch });
  // ready roles first, then in the order of the operas
  return out.sort((a, b) => Number(b.ch.pieces.some((p) => p.editionId)) - Number(a.ch.pieces.some((p) => p.editionId)));
}

export function ExploreVoices({ ctx, voice: asked }: { ctx: Ctx; voice?: string }) {
  const voice = asked ?? ctx.profile.voices[0] ?? "Soprano";
  const [readyOnly, setReadyOnly] = useState(false);
  const list = rolesForVoice(voice, readyOnly);
  return (
    <main className="screen-body gutter page">
      <section className="hero compact">
        <h1>By voice</h1>
        <p className="lede">Every role for a voice, across all the operas. Roles with music ready come first.</p>
      </section>
      <div className="voice-bar">
        <div className="voice-chips" role="group" aria-label="Voice">
          {VOICES.map((v) => (
            <button key={v} type="button" className="voice-chip" data-tone={voiceTone(v)} aria-pressed={v === voice} onClick={() => ctx.go({ screen: "explore", by: "voice", voice: v })}>
              {v}
              {ctx.profile.voices.includes(v) && <small> · you</small>}
            </button>
          ))}
        </div>
        <button type="button" className="cp-toggle" aria-pressed={readyOnly} onClick={() => setReadyOnly(!readyOnly)}>
          Ready only
        </button>
      </div>
      {list.length ? (
        <div className="vroles">
          {list.map(({ opera, ch }) => (
            <RoleCard key={`${opera.id}:${ch.id}`} ctx={ctx} opera={opera} ch={ch} />
          ))}
        </div>
      ) : (
        <div className="empty-field">
          <h2>No {PLURAL[voice]} roles have music ready yet.</h2>
          <p>Turn off “Ready only” to see every {voice.toLowerCase()} role, and tick off what you learn from your own scores.</p>
        </div>
      )}
    </main>
  );
}

/* ====================================================================================
   You
   ==================================================================================== */

/** A setting kept in this browser, read and written under the same key the practice screen uses. */
function useStored<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`cp:${key}`);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });
  return [
    v,
    (nv: T) => {
      setV(nv);
      try {
        localStorage.setItem(`cp:${key}`, JSON.stringify(nv));
      } catch {
        /* storage unavailable */
      }
    },
  ];
}

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" className="st-row" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="st-text">
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      <span className="st-switch" aria-hidden="true">
        <i />
      </span>
    </button>
  );
}

/** Settings: how practice sounds and looks by default, and the data kept on this device. */
export function ProfilePage({ ctx }: { ctx: Ctx }) {
  const [line, setLine] = useStored<LineChoice>("p:lineSound", "auto");
  const [ipa, setIpa] = useStored("p:ipa", true);
  const [tr, setTr] = useStored("p:tr", true);
  const [tips, setTips] = useStored("p:tipsBar", true);
  const [steady, setSteady] = useStored("p:steady", true);
  const [countIn, setCountIn] = useStored("p:countin", true);
  const choice = line === "auto" || LINE_SOUNDS.some((o) => o.id === line) ? line : "auto";
  return (
    <main className="screen-body gutter page settings">
      <section className="hero compact">
        <h1>Settings</h1>
        <p className="lede">How practice sounds and looks when you open a piece. You can still change each one while you practise.</p>
      </section>

      <section className="block" aria-labelledby="st-line">
        <p className="cp-eyebrow" id="st-line">
          Your line is played on
        </p>
        <div className="st-chips" role="radiogroup" aria-labelledby="st-line">
          {[{ id: "auto", label: "Automatic" } as const, ...LINE_SOUNDS].map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={choice === o.id} className="st-chip" onClick={() => setLine(o.id)}>
              {choice === o.id && <Check />}
              {o.label}
            </button>
          ))}
        </div>
        <p className="st-note">{choice === "auto" ? `Automatic: ${AUTO_NOTE.charAt(0).toLowerCase()}${AUTO_NOTE.slice(1)}` : "The same instrument for every role."}</p>
      </section>

      <section className="block" aria-labelledby="st-words">
        <p className="cp-eyebrow" id="st-words">
          Under the words
        </p>
        <div className="st-list">
          <Toggle on={ipa} onChange={setIpa} label="IPA" hint="How each word is pronounced, in phonetic letters" />
          <Toggle on={tr} onChange={setTr} label="English translation" />
          <Toggle on={tips} onChange={setTips} label="Pronunciation tips" hint="In the Words view: doubled consonants, open and closed vowels, joined words" />
        </div>
      </section>

      <section className="block" aria-labelledby="st-play">
        <p className="cp-eyebrow" id="st-play">
          Playing
        </p>
        <div className="st-list">
          <Toggle on={steady} onChange={setSteady} label="Steady tempo" hint="A steady pulse at the written tempo; off plays the edition's own changes of speed" />
          <Toggle on={countIn} onChange={setCountIn} label="Count-in" hint="A bar of clicks before the music starts" />
        </div>
      </section>

      <section className="block" aria-labelledby="st-data">
        <p className="cp-eyebrow" id="st-data">
          Your data
        </p>
        <p className="st-note">
          Your roles, what you have ticked off, your notes and these settings stay in this browser on this device. There is no account.
        </p>
        <div className="st-actions">
          <StartOver ctx={ctx} big />
          <button type="button" className="cp-btn" onClick={() => ctx.go({ screen: "onboarding", step: 1 })}>
            See the welcome again
          </button>
        </div>
      </section>
    </main>
  );
}

/* ====================================================================================
   A piece without music yet (reached from elsewhere)
   ==================================================================================== */

/** A piece's own page: the scene, where it falls in the opera, who sings with you; then practise or tick it off. */
export function PiecePage({ ctx, opera, ch, index }: { ctx: Ctx; opera: Opera; ch: Character; index: number }) {
  const p = ch.pieces[index];
  const r = { opera: opera.id, character: ch.id };
  const k = p ? pieceKey(p) : "";
  const done = (ctx.learned[roleKey(r)] ?? []).includes(k);
  const ready = !!p?.editionId;
  const prev = index > 0 ? ch.pieces[index - 1] : null;
  const next = index < ch.pieces.length - 1 ? ch.pieces[index + 1] : null;
  if (!p) return null;
  return (
    <main className="screen-body gutter page piece-page">
      <BackTo label={ch.name} onClick={() => ctx.go({ screen: "role", ...r })} />
      <section className="pp-head" data-tone={voiceTone(ch.voice)}>
        <p className="cp-eyebrow">
          {p.kind} · <span lang={opera.lang}>{opera.title}</span>
        </p>
        <h1 lang={opera.lang}>{p.title}</h1>
        {p.when && <p className="pp-when">{p.when}</p>}
        <div className="pp-actions">
          {ready ? (
            <button type="button" className="cp-btn cp-btn--ink cp-btn--stand" onClick={() => ctx.go({ screen: "piece", ...r, piece: index })}>
              <Play />
              Practise
            </button>
          ) : (
            <span className="pp-soon">The music for this piece isn't added yet. Learn it from your own score and tick it off here.</span>
          )}
          <button type="button" className="cp-btn pp-learned" role="checkbox" aria-checked={done} onClick={() => ctx.toggleLearned(r, k)}>
            <span className="pp-box">
              <Check />
            </span>
            {done ? "Learned" : "Mark as learned"}
          </button>
        </div>
      </section>

      {p.context && (
        <section className="block pp-section">
          <p className="cp-eyebrow">The scene</p>
          <p className="pp-text">{p.context}</p>
        </section>
      )}

      <nav className="pp-nav" aria-label={`${ch.name}'s other pieces`}>
        {prev ? (
          <button type="button" className="pp-step" onClick={() => ctx.go({ screen: "piece", ...r, piece: index - 1 })}>
            <BackIcon />
            <span>
              <small>Before</small>
              <b lang={opera.lang}>{prev.title}</b>
            </span>
          </button>
        ) : (
          <span />
        )}
        {next && (
          <button type="button" className="pp-step next" onClick={() => ctx.go({ screen: "piece", ...r, piece: index + 1 })}>
            <span>
              <small>Next</small>
              <b lang={opera.lang}>{next.title}</b>
            </span>
            <Chevron />
          </button>
        )}
      </nav>
    </main>
  );
}

/* ====================================================================================
   Onboarding: welcome, your voice, your first role. Three steps, centred, skippable.
   ==================================================================================== */

/* The welcome screen: one real line of the app. The real practice card and the real engraving of bars 6–9
   (cut from the app's own score). Tapping Play plays bars 7–8 with the piano and the voice, and the cursor,
   the note and the sung syllable move together, exactly as in practice. Nothing here pretends to work. */
const demoEdition = editionJson as unknown as CompiledEdition;
const demoLine = (languageJson as unknown as CompiledLanguage).phrases[1];
const demoVoice = demoEdition.parts.find((p) => p.kind === "voice")!;
const demoNoteIds = [...new Set((demoLine.syllables ?? []).map((s) => s.noteId))];
const demoSyl = syllableRanges(demoLine);

function Preview() {
  const perf = useMemo(() => new Performance(demoEdition, [], { tempo: "steady", pedal: true }), []);
  const pb = usePlayback(perf, demoEdition.parts);
  const engine = pb.engine;
  const span = useMemo(
    () => ({
      start: perf.toPerfQ({ m: demoLine.startM, q: demoLine.startQ, occ: demoLine.occurrence }),
      end: perf.toPerfQ({ m: demoLine.endM, q: demoLine.endQ, occ: demoLine.occurrence }),
    }),
    [perf],
  );
  const voiceNotes = useMemo(() => perf.notes.filter((n) => n.part === demoVoice.key), [perf]);
  const onsets = useMemo(() => demoNoteIds.map((id) => voiceNotes.find((n) => n.ids.includes(id))?.onQ ?? 0), [voiceNotes]);

  const [q, setQ] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }[]>([]);
  const [view, setView] = useState({ w: 0, strip: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  // where each note of the line sits in the strip
  useLayoutEffect(() => {
    const measure = () => {
      const strip = stripRef.current;
      const box = boxRef.current;
      if (!strip || !box) return;
      const sr = strip.getBoundingClientRect();
      setPos(
        demoNoteIds.map((_, n) => {
          const h = strip.querySelector(`[data-n="${n}"] .vf-notehead`) ?? strip.querySelector(`[data-n="${n}"]`);
          const r = h?.getBoundingClientRect();
          return r ? { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top } : { x: 0, y: 0 };
        }),
      );
      setView({ w: box.clientWidth, strip: strip.scrollWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (boxRef.current) ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, []);

  // follow the audible position while it plays; stop a moment after the line ends
  const playing = q !== null;
  useEffect(() => {
    if (!playing || !engine) return;
    let raf = 0;
    const tick = () => {
      const now = engine.displayQ();
      if (engine.state !== "playing" || now >= span.end + 0.75) {
        if (engine.state === "playing") engine.pause();
        setQ(null);
        setFinished(true);
        return;
      }
      setQ(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, engine, span]);

  const play = async () => {
    if (!engine || !pb.port) return;
    if (playing) {
      engine.pause();
      setQ(null);
      return;
    }
    setFinished(false);
    await pb.port.resume();
    engine.setCountIn(false);
    engine.play(span.start - 0.001);
    setQ(span.start);
  };

  // the note being sung, the syllable(s) on it, and the cursor between notes
  const cur = q === null ? -1 : onsets.reduce((best, on, n) => (on <= q + 1e-6 ? n : best), -1);
  const sounding = q === null ? null : voiceNotes.find((n) => n.onQ <= q + 1e-6 && n.offQ > q + 1e-6);
  const litSyl = new Set<number>();
  if (sounding) (demoLine.syllables ?? []).forEach((s, k) => sounding.ids.includes(s.noteId) && litSyl.add(k));
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.querySelectorAll(".cp-now-note").forEach((e) => e.classList.remove("cp-now-note"));
    if (cur >= 0 && sounding) strip.querySelector(`[data-n="${cur}"]`)?.classList.add("cp-now-note");
  }, [cur, sounding]);
  let x = pos[0]?.x ?? 0;
  if (q !== null && pos.length) {
    const a = Math.max(0, cur);
    const b = Math.min(pos.length - 1, a + 1);
    const t = cur < 0 || b === a ? 0 : Math.min(1, Math.max(0, (q - onsets[a]) / Math.max(0.001, onsets[b] - onsets[a])));
    x = pos[a].x + (pos[b].x - pos[a].x) * t;
  }
  const shift = view.w ? Math.max(Math.min(0, view.w - view.strip), Math.min(0, view.w * 0.36 - x)) : 0;
  const halo = cur >= 0 && sounding ? pos[cur] : null;

  return (
    <div className={`ob-preview${playing ? " is-playing" : ""}`}>
      <div className="obp-card" aria-hidden="true">
        <p className="obp-it" lang="it">
          {demoLine.words.map((w, k) => (
            <span key={k}>
              {k > 0 && " "}
              {decorate(w.text, [...litSyl].filter((n) => demoSyl[n]?.word === k).map((n) => ({ from: demoSyl[n].from, to: demoSyl[n].to, cls: "syl-now" })))}
            </span>
          ))}
        </p>
        <p className="obp-ipa">[{demoLine.ipa}]</p>
        <p className="obp-tr">{demoLine.translation}</p>
      </div>
      <div className="obp-music" ref={boxRef} aria-hidden="true">
        <div className="obp-strip" ref={stripRef} style={{ transform: `translateX(${shift.toFixed(1)}px)` }}>
          <div className="obp-score" dangerouslySetInnerHTML={{ __html: previewScore }} />
          {halo && <span className="obp-halo" style={{ left: halo.x, top: halo.y }} />}
          {pos.length > 0 && <span className="obp-cursor" style={{ left: x }} />}
        </div>
      </div>
      <div className="obp-foot">
        <button type="button" className="obp-play" onClick={play} disabled={pb.status !== "ready"}>
          <span className="obp-play-icon" aria-hidden="true">
            {playing ? (
              <svg viewBox="0 0 24 24">
                <rect x="7" y="6" width="3.5" height="12" rx="1" fill="currentColor" />
                <rect x="13.5" y="6" width="3.5" height="12" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
              </svg>
            )}
          </span>
          {pb.status === "loading" ? "Loading the piano…" : playing ? "Stop" : finished ? "Play it again" : "Play this line"}
        </button>
        <span className="obp-hint">
          {pb.status === "error"
            ? "Sound isn’t available in this browser. Everything else works."
            : finished
              ? "No sound? Check your volume and that the device isn’t on silent."
              : "Piano and voice, as in practice"}
        </span>
      </div>
    </div>
  );
}

/** Characters with a portrait, for the welcome gallery. */
function portraitRoles(): { opera: Opera; ch: Character }[] {
  const out: { opera: Opera; ch: Character }[] = [];
  for (const opera of OPERAS) for (const ch of opera.chars) if (PORTRAITS[`${opera.id}:${ch.id}`]) out.push({ opera, ch });
  return out;
}

/**
 * Two rows of character cards drifting slowly in opposite directions, like programmes laid out on a table.
 * Each row holds its cards four times and moves by half its width (two sets, wider than any screen), so it loops
 * without a seam; it pauses under the
 * pointer or keyboard focus, and stands still (scrollable by hand) for people who prefer less motion.
 */
function CastReel({ onPick }: { onPick: (opera: Opera, ch: Character) => void }) {
  const all = portraitRoles();
  const rows = [all.filter((_, i) => i % 2 === 0), all.filter((_, i) => i % 2 === 1)];
  return (
    <div className="reel" role="group" aria-label="Characters">
      {rows.map((row, r) => (
        <div key={r} className={`reel-row${r === 1 ? " rev" : ""}`}>
          {[0, 1, 2, 3].map((copy) =>
            row.map(({ opera, ch }) => {
              const art = PORTRAITS[`${opera.id}:${ch.id}`];
              const ready = ch.pieces.some((p) => p.editionId);
              return (
                <button
                  key={`${copy}-${opera.id}:${ch.id}`}
                  type="button"
                  className="reel-card"
                  data-tone={voiceTone(ch.voice)}
                  aria-hidden={copy > 0 || undefined}
                  tabIndex={copy > 0 ? -1 : undefined}
                  onClick={() => onPick(opera, ch)}
                >
                  <span className="reel-pic">
                    <img src={art.portrait} alt="" decoding="async" draggable={false} />
                    {ready && <span className="reel-ready">Ready to sing</span>}
                  </span>
                  <span className="reel-name">{ch.name}</span>
                  <span className="reel-opera" lang={opera.lang}>
                    {opera.title}
                  </span>
                </button>
              );
            }),
          )}
        </div>
      ))}
    </div>
  );
}

export function Onboarding({
  ctx,
  step: stepAsked,
  role,
  opera: operaId,
}: {
  ctx: Ctx;
  step: 1 | 2 | 3;
  role?: RoleRef;
  by?: "voice" | "opera";
  opera?: string;
}) {
  // two steps: a character (or an opera) on the welcome screen, then that opera's cast to confirm
  const chosenOpera = operaId ? OPERAS.find((o) => o.id === operaId) : undefined;
  const at = (step: 1 | 2 | 3, extra: { role?: RoleRef; opera?: string } = {}): Place => ({
    screen: "onboarding",
    step,
    by: "opera",
    opera: operaId,
    ...extra,
  });
  const skip = () => ctx.finishOnboarding({ screen: "explore", by: "opera" });
  const pick = (opera: Opera, ch: Character) => {
    ctx.chooseRole({ opera: opera.id, character: ch.id });
    ctx.finishOnboarding({ screen: "role", opera: opera.id, character: ch.id });
  };
  const roles = chosenOpera ? chosenOpera.chars.map((ch) => ({ opera: chosenOpera, ch })) : [];
  // 1: the gallery of characters; 2: the list of operas (a quieter way in); 3: the chosen opera's cast.
  // A cast with no opera goes back to the gallery.
  const step = stepAsked === 3 ? (roles.length ? 3 : 1) : stepAsked;
  const scroller = useRef<HTMLDivElement>(null);
  const roleKeyNow = role ? roleKey(role) : "";
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [step, operaId]);
  // in the cast a tap only selects; "Continue with …" then starts with that role
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    setSelected(role ? roleKey(role) : null);
  }, [roleKeyNow, operaId]);
  const selectedRole = roles.find(({ opera, ch }) => `${opera.id}:${ch.id}` === selected) ?? null;
  return (
    <div className={`screen onboarding step-${step}`} ref={scroller}>
      <div className="ob-top gutter">
        <span className="wordmark-lg">Counterpart</span>
        <div className="ob-steps" aria-label={`Step ${step === 3 ? 2 : 1} of 2`}>
          <span>Step {step === 3 ? 2 : 1} of 2</span>
          <div className="ob-track" aria-hidden="true">
            {[1, 3].map((n) => (
              <i key={n} className={n <= step ? "on" : ""} />
            ))}
          </div>
        </div>
        <button type="button" className="cp-btn cp-btn--ghost ob-skip" onClick={skip}>
          Skip
        </button>
      </div>

      {step === 1 && (
        <main className="ob-body ob-welcome" key="s1">
          <div className="ob-hero gutter">
            <h1>Which role is yours?</h1>
            <p className="lede">Choose a character to begin, or start from an opera.</p>
          </div>
          <CastReel onPick={(opera, ch) => ctx.go(at(3, { opera: opera.id, role: { opera: opera.id, character: ch.id } }))} />
          <button type="button" className="cp-btn cp-btn--ghost ob-by-opera" onClick={() => ctx.go(at(2, { opera: undefined }))}>
            Or start from an opera
            <span className="obs-go" aria-hidden="true">
              <BackIcon />
            </span>
          </button>
        </main>
      )}

      {step === 2 && (
        <main className="ob-body gutter wide ob-opera-list" key="s2">
          <h1 id="ob-operas-h">Choose an opera</h1>
          <p className="lede">Then the role you will sing.</p>
          <section className="ob-from-opera" aria-labelledby="ob-operas-h">
                        <div className="obs-operas">
              {OPERAS.map((o, n) => {
                const art = ART[o.id];
                const letter = o.title.replace(/^(Il|La|Le|Les|L’|L'|Die|Der|Das|Don)\s*/u, "").charAt(0).toUpperCase();
                return (
                  <button
                    key={o.id}
                    type="button"
                    className="obs-opera"
                    data-tone={OPERA_TONES[n % OPERA_TONES.length]}
                    onClick={() => ctx.go(at(3, { opera: o.id, role: undefined }))}
                  >
                    <span className="obs-thumb" aria-hidden="true">
                      {art ? <img src={art.square} alt="" loading="lazy" decoding="async" /> : <span lang={o.lang}>{letter}</span>}
                    </span>
                    <span className="obs-vtext">
                      <b lang={o.lang}>{o.title}</b>
                      <small>
                        {o.composer} · {o.year} · {o.chars.length} roles
                      </small>
                    </span>
                    <span className="obs-go" aria-hidden="true">
                      <BackIcon />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          <div className="ob-sticky">
            <button type="button" className="back-to inline" onClick={() => ctx.go(at(1, { opera: undefined }))}>
              <BackIcon />
              <span>Characters</span>
            </button>
          </div>
        </main>
      )}

      {step === 3 && chosenOpera && (
        <main className="ob-body gutter wide xwide" key={`s3-${chosenOpera.id}`}>
          <h1 lang={chosenOpera.lang}>{chosenOpera.title}</h1>
          <p className="lede">
            {chosenOpera.composer}, {chosenOpera.year}. Select your role; you can add more later.
          </p>
          <div className="showcase" role="radiogroup" aria-label="Roles">
            {roles.map(({ opera, ch }) => {
              const key = `${opera.id}:${ch.id}`;
              const art = PORTRAITS[key];
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected === key}
                  className={`sc-card${art ? " has-art" : ""}${selected === key ? " picked" : ""}`}
                  data-tone={voiceTone(ch.voice)}
                  onClick={() => setSelected(key)}
                >
                  <span className="sc-pic">
                    {art ? (
                      <img src={art.portrait} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <span className="sc-bust" aria-hidden="true">
                        <Avatar kind={ch.avatar} />
                      </span>
                    )}
                    <span className="sc-check" aria-hidden="true">
                      <Check />
                    </span>
                  </span>
                  <span className="sc-text">
                    <b>{ch.name}</b>
                    <span>{ch.voice}</span>
                    <em>{ch.desc}</em>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="ob-sticky">
            <button type="button" className="back-to inline" onClick={() => ctx.go(at(role ? 1 : 2, { opera: role ? undefined : operaId, role: undefined }))}>
              <BackIcon />
              <span>{role ? "Characters" : "Operas"}</span>
            </button>
            <button
              type="button"
              className="cp-btn cp-btn--ink cp-btn--stand ob-go"
              disabled={!selectedRole}
              onClick={() => selectedRole && pick(selectedRole.opera, selectedRole.ch)}
            >
              {selectedRole ? `Continue with ${selectedRole.ch.name}` : "Select a role"}
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
