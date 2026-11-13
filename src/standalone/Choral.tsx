import { useEffect, useState } from "react";
import { CHORAL_WORKS, LANGUAGE_NAMES, type ChoralWork } from "./choral";
import { COMPOSERS, composerNamed } from "./composers";
import { ComposerRow, WorksGrid, toneOf } from "./choralParts";
import { CloseIcon, Crumbs, SearchIcon, type Ctx, type Tone } from "./flow";

/**
 * Choral: "Find your part", a gallery of requiems, masses and oratorios with their composers' portraits, and each
 * work's page, where you choose your part in the chorus (or a solo). No work has music here yet, and the pages say so
 * plainly where the practice would be.
 */

/** folded for matching: no accents, no case ("faure" finds Fauré, "schopfung" Die Schöpfung) */
const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** kept while you move between the choral pages, as Search keeps its own */
const prefs: { q: string; music: boolean; composer: string | null } = {
  q: "",
  music: false,
  composer: null,
};

export function ChoralHome({ ctx }: { ctx: Ctx }) {
  const [q, setQ] = useState(prefs.q);
  const [music, setMusic] = useState(prefs.music);
  const [composer, setComposer] = useState<string | null>(prefs.composer);
  useEffect(() => {
    prefs.q = q;
    prefs.music = music;
    prefs.composer = composer;
  }, [q, music, composer]);
  const t = fold(q.trim());
  const words = t.split(/\s+/).filter(Boolean);
  // a match is on the start of words, in the title, its other name, the composer or the year
  const matches = (w: ChoralWork) => {
    const ws = fold(
      [w.title, w.subtitle, w.composer, w.composerFull, w.year].join(" "),
    ).split(/[\s,.\-–()]+/);
    return words.every((x) => ws.some((v) => v.startsWith(x)));
  };
  // the composers of the works here, in the order of the works, with their portraits where we have one
  const composers = [...new Set(CHORAL_WORKS.map((w) => w.composer))]
    .map(composerNamed)
    .filter((c) => COMPOSERS.includes(c));
  const list = CHORAL_WORKS.filter((w) =>
    t
      ? matches(w)
      : (!composer || w.composer === composer) && (!music || w.music),
  );
  return (
    <main className="screen-body gutter page sx ch-home">
      <section className="sx-head">
        <h1 className="sx-h">Find your part</h1>
        <label className="sx-line">
          <SearchIcon />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="A work or a composer"
            aria-label="Search choral works and composers"
            autoComplete="off"
            spellCheck={false}
          />
          {q && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear the search"
              onClick={() => setQ("")}
            >
              <CloseIcon />
            </button>
          )}
        </label>
        {!t && (
          <>
            <div className="sx-controls">
              <button
                type="button"
                className="cp-toggle sx-music"
                aria-pressed={music}
                onClick={() => setMusic(!music)}
              >
                With music only
              </button>
            </div>
            <ComposerRow
              composers={composers}
              value={composer}
              onChange={setComposer}
            />
          </>
        )}
      </section>
      {list.length === 0 ? (
        <div className="empty-field">
          <p>
            {t
              ? `Nothing called “${q.trim()}” yet. Try a composer or the name of a work.`
              : music
                ? "No works with music yet. Turn off “With music only” to see every one."
                : "No works here yet."}
          </p>
        </div>
      ) : (
        <section
          className="block"
          aria-label={composer && !t ? `Works by ${composer}` : "Choral works"}
        >
          <WorksGrid
            works={list}
            onPick={(id) => ctx.go({ screen: "work", work: id })}
          />
        </section>
      )}
    </main>
  );
}

const LETTER: Record<string, string> = {
  Soprano: "S",
  Alto: "A",
  Tenor: "T",
  Bass: "B",
};
const PART_TONE: Record<string, Tone> = {
  Soprano: "pink",
  Alto: "lilac",
  Tenor: "sky",
  Bass: "butter",
};

/** A choral work: its composer's portrait, what it is, its credits, then the parts to choose from. */
export function WorkPage({ ctx, work: w }: { ctx: Ctx; work: ChoralWork }) {
  const c = composerNamed(w.composer);
  const [part, setPart] = useState<string | null>(null);
  useEffect(() => setPart(null), [w.id]);
  const pick = (p: string) => setPart(part === p ? null : p);
  const note = (
    <p className="part-note" role="status">
      The music for this work is being prepared.
    </p>
  );
  return (
    <main className="screen-body gutter page op-page ch-page">
      <Crumbs
        ctx={ctx}
        trail={[
          { label: "Choral", to: { screen: "choral" } },
          { label: w.title, lang: w.lang },
        ]}
      />
      <section
        className={`oh${c.portrait ? " has-art" : " no-art"}`}
        data-tone={toneOf(w)}
      >
        {c.portrait && (
          <figure className="oh-cover ch-cover">
            <img src={c.portrait} alt={c.alt ?? ""} />
          </figure>
        )}
        <div className="oh-text">
          <div className="oh-titleblock">
            <h1 className="oh-title" lang={w.lang}>
              {w.title}
            </h1>
            {w.subtitle && <p className="oh-meta">{w.subtitle}</p>}
          </div>
          <p className="oh-story">{w.about}</p>
          <div className="oh-credits" aria-label="About this work">
            <p>
              <i>Music by</i> {w.composerFull}
            </p>
            {w.credits?.map((x) => (
              <p key={x.role}>
                <i>{x.role}</i> {x.name}
              </p>
            ))}
            <p>
              <i>Sung in</i> {LANGUAGE_NAMES[w.lang] ?? w.lang}
            </p>
          </div>
        </div>
      </section>

      <section className="oh-cast" aria-labelledby="parts-h">
        <div className="pv-sec-head">
          <h2 className="pv-h2" id="parts-h">
            Choose your part
          </h2>
        </div>
        <div className="part-grid" role="group" aria-label="Chorus">
          {w.chorus.map((p) => (
            <button
              key={p}
              type="button"
              className="part-card"
              data-tone={PART_TONE[p]}
              aria-pressed={part === `chorus:${p}`}
              onClick={() => pick(`chorus:${p}`)}
            >
              <span className="part-pic" aria-hidden="true">
                {LETTER[p]}
              </span>
              <span className="part-text">
                <b>{p}</b>
                <span>Chorus</span>
              </span>
            </button>
          ))}
        </div>
        {part?.startsWith("chorus:") && !w.music && note}
        <div className="part-solo">
          <p className="cx-label" id="solo-h">
            Soloists
          </p>
          <div className="part-pills" role="group" aria-labelledby="solo-h">
            {w.soloists.map((s) => (
              <button
                key={s}
                type="button"
                className="part-pill"
                aria-pressed={part === `solo:${s}`}
                onClick={() => pick(`solo:${s}`)}
              >
                {s}
              </button>
            ))}
          </div>
          {part?.startsWith("solo:") && !w.music && note}
        </div>
      </section>
    </main>
  );
}
