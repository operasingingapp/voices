import { useEffect, useState } from "react";
import { composerNamed } from "./composers";
import { SongList } from "./songParts";
import { ComposerRow } from "./choralParts";
import { SONGS, SONG_LANGUAGES, SONG_LEVELS, songLanguage, type Song, type SongLevel } from "./songs";
import { SONG_CONTEXT, SONG_CYCLES, rangeText } from "./songContext";
import { SONG_META } from "./songInfo";
import { CloseIcon, Crumbs, SearchIcon, type Ctx } from "./flow";

/**
 * Songs: "Find your song", every song whose music is in the app, by its title, composer, language or level, grouped
 * as a singer thinks of them; and each song's page.
 */

/** folded for matching: no accents, no case ("faure" finds Fauré, "standchen" Ständchen) */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** kept while you move between the song pages, as Search keeps its own */
const prefs: { q: string; lang: string | null; level: SongLevel | null; composer: string | null } = {
  q: "",
  lang: null,
  level: null,
  composer: null,
};

export function SongsHome({ ctx }: { ctx: Ctx }) {
  const [q, setQ] = useState(prefs.q);
  const [lang, setLang] = useState<string | null>(prefs.lang);
  const [level, setLevel] = useState<SongLevel | null>(prefs.level);
  const [composer, setComposer] = useState<string | null>(prefs.composer);
  useEffect(() => {
    Object.assign(prefs, { q, lang, level, composer });
  }, [q, lang, level, composer]);
  const t = fold(q.trim());
  const words = t.split(/\s+/).filter(Boolean);
  // a match is on the start of words, in the title, the composer (short or in full) or the language
  const matches = (s: Song) => {
    const ws = fold([s.title, s.composer, s.composerFull, songLanguage(s.lang), s.group].join(" ")).split(/[\s,.'’\-–()!]+/);
    return words.every((x) => ws.some((v) => v.startsWith(x)));
  };
  // only the songs whose music is in the app are listed; the languages offered are the ones they are sung in, so a
  // new language appears by itself when its first song arrives
  const ready = SONGS.filter((s) => !!s.editionId);
  const langs = SONG_LANGUAGES.filter(([l]) => ready.some((s) => s.lang === l));
  // the composers whose songs are here, most songs first, with their faces where we have one
  const counts = new Map<string, number>();
  for (const s of ready) counts.set(s.composer, (counts.get(s.composer) ?? 0) + 1);
  const composers = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b)).map(composerNamed);
  const by = composer && counts.has(composer) ? composer : null;
  const list = ready.filter(
    (s) => (!t || matches(s)) && (!lang || s.lang === lang) && (!level || s.level === level) && (!by || s.composer === by),
  );
  return (
    <main className="screen-body gutter page sx sg-home">
      <section className="sx-head">
        <h1 className="sx-h">Find your song</h1>
        <label className="sx-line">
          <SearchIcon />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="A song, a composer or a language"
            aria-label="Search songs, composers and languages"
            autoComplete="off"
            spellCheck={false}
          />
          {q && (
            <button type="button" className="search-clear" aria-label="Clear the search" onClick={() => setQ("")}>
              <CloseIcon />
            </button>
          )}
        </label>
        <div className="sg-filters">
          <div className="sg-chips" role="group" aria-label="Language">
            {langs.map(([l, name]) => (
              <button
                key={l}
                type="button"
                className="part-pill sg-chip"
                aria-pressed={lang === l}
                onClick={() => setLang(lang === l ? null : l)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="sg-chips" role="group" aria-label="Level">
            {SONG_LEVELS.map((v) => (
              <button
                key={v}
                type="button"
                className="part-pill sg-chip"
                aria-pressed={level === v}
                onClick={() => setLevel(level === v ? null : v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <ComposerRow composers={composers} value={by} onChange={setComposer} />
      </section>
      {list.length === 0 ? (
        <div className="empty-field">
          <p>
            {t
                ? `Nothing called “${q.trim()}” yet. Try a composer, a language or the first words of a song.`
                : "No songs match these filters."}
          </p>
        </div>
      ) : (
        <SongList songs={list} grouped={!t} onPick={(id) => ctx.go({ screen: "song", song: id })} />
      )}
    </main>
  );
}

/**
 * A song: its composer's portrait, what it is about and when it was written, the way into its practice, then where
 * its words come from, what to listen for, and the cycle it belongs to with its other songs in the app.
 */
export function SongPage({ ctx, song: s }: { ctx: Ctx; song: Song }) {
  const c = composerNamed(s.composer);
  const x = SONG_CONTEXT[s.id];
  const poet = SONG_META[s.id]?.poet;
  const cycle = x?.cycle ? SONG_CYCLES[x.cycle] : undefined;
  const siblings = x?.cycle
    ? SONGS.filter((o) => o.id !== s.id && SONG_CONTEXT[o.id]?.cycle === x.cycle).sort(
        (a, b) => (SONG_CONTEXT[a.id].no ?? 0) - (SONG_CONTEXT[b.id].no ?? 0),
      )
    : [];
  const sungIn = s.lang === "zxx" ? "No words: sung on a vowel" : songLanguage(s.lang);
  return (
    <main className="screen-body gutter page op-page ch-page sg-page">
      <Crumbs
        ctx={ctx}
        trail={[
          { label: "Songs", to: { screen: "songs" } },
          { label: s.title, lang: s.lang === "zxx" ? undefined : s.lang },
        ]}
      />
      <section className={`oh${c.portrait ? " has-art" : " no-art"}`}>
        {c.portrait && (
          <figure className="oh-cover ch-cover">
            <img src={c.portrait} alt={c.alt ?? ""} />
          </figure>
        )}
        <div className="oh-text">
          <div className="oh-titleblock">
            <h1 className="oh-title" lang={s.lang === "zxx" ? undefined : s.lang}>
              {s.title}
            </h1>
            <p className="oh-meta">
              {[s.group, x?.year, s.level].filter(Boolean).join(" · ")}
            </p>
          </div>
          {x ? <p className="oh-story">{x.story}</p> : s.note && <p className="oh-story">{s.note}.</p>}
          <div className="oh-credits" aria-label="About this song">
            <p>
              <i>Music by</i> {s.composerFull}
            </p>
            {poet && (
              <p>
                <i>Words by</i> {poet}
              </p>
            )}
            {cycle && (
              <p>
                <i>From</i> {cycle.title}, No. {x!.no} of {cycle.count}
              </p>
            )}
            <p>
              <i>Sung in</i> {sungIn}
            </p>
            {x && (
              <p>
                <i>Range</i> {rangeText(x.range)}
              </p>
            )}
          </div>
          {s.editionId ? (
            <button type="button" className="cp-btn cp-btn--ink sg-practise" onClick={() => ctx.go({ screen: "sing", song: s.id })}>
              Practise this song
            </button>
          ) : (
            <p className="part-note" role="status">
              The music for this song is being prepared.
            </p>
          )}
        </div>
      </section>
      {x && (
        <section className="oh-cast sg-about" aria-labelledby="sg-about-h">
          <div className="pv-sec-head">
            <h2 className="pv-h2" id="sg-about-h">
              About the song
            </h2>
          </div>
          <div className="sg-facts">
            <div>
              <h3>Written</h3>
              <p>{x.written}.</p>
            </div>
            <div>
              <h3>The words</h3>
              <p>{x.poem}</p>
            </div>
            <div>
              <h3>The music</h3>
              <p>{x.music}</p>
            </div>
          </div>
        </section>
      )}
      {cycle && (
        <section className="oh-cast sg-cycle" aria-labelledby="sg-cycle-h">
          <div className="pv-sec-head">
            <h2 className="pv-h2" id="sg-cycle-h">
              {cycle.title}
            </h2>
          </div>
          <p className="sg-cycle-text">{cycle.overview}</p>
          {siblings.length > 0 && (
            <>
              <p className="cx-label">Also from {cycle.title} in the app</p>
              <SongList songs={siblings} grouped={false} onPick={(id) => ctx.go({ screen: "song", song: id })} />
            </>
          )}
        </section>
      )}
    </main>
  );
}
