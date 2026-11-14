import { useEffect, useState } from "react";
import { composerNamed } from "./composers";
import { SongList } from "./songParts";
import { SONGS, SONG_LANGUAGES, SONG_LEVELS, songLanguage, type Song, type SongLevel } from "./songs";
import { CloseIcon, Crumbs, SearchIcon, type Ctx } from "./flow";

/**
 * Songs: "Find your song", every song by its title, composer, language or level, grouped as a singer thinks of them;
 * and each song's page. No song has music here yet, and its page says so plainly where the practice will be.
 */

/** folded for matching: no accents, no case ("faure" finds Fauré, "standchen" Ständchen) */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** kept while you move between the song pages, as Search keeps its own */
const prefs: { q: string; lang: string | null; level: SongLevel | null; music: boolean } = {
  q: "",
  lang: null,
  level: null,
  music: false,
};

export function SongsHome({ ctx }: { ctx: Ctx }) {
  const [q, setQ] = useState(prefs.q);
  const [lang, setLang] = useState<string | null>(prefs.lang);
  const [level, setLevel] = useState<SongLevel | null>(prefs.level);
  const [music, setMusic] = useState(prefs.music);
  useEffect(() => {
    Object.assign(prefs, { q, lang, level, music });
  }, [q, lang, level, music]);
  const t = fold(q.trim());
  const words = t.split(/\s+/).filter(Boolean);
  // a match is on the start of words, in the title, the composer (short or in full) or the language
  const matches = (s: Song) => {
    const ws = fold([s.title, s.composer, s.composerFull, songLanguage(s.lang), s.group].join(" ")).split(/[\s,.'’\-–()!]+/);
    return words.every((x) => ws.some((v) => v.startsWith(x)));
  };
  const langs = SONG_LANGUAGES.filter(([l]) => SONGS.some((s) => s.lang === l));
  const list = SONGS.filter(
    (s) => (!t || matches(s)) && (!lang || s.lang === lang) && (!level || s.level === level) && (!music || !!s.editionId),
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
            <button type="button" className="cp-toggle sx-music" aria-pressed={music} onClick={() => setMusic(!music)}>
              With music only
            </button>
          </div>
        </div>
      </section>
      {list.length === 0 ? (
        <div className="empty-field">
          <p>
            {music
              ? "No songs with music yet. Turn off “With music only” to see every one."
              : t
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

/** A song: its composer's portrait, what it is, then where its practice will be. */
export function SongPage({ ctx, song: s }: { ctx: Ctx; song: Song }) {
  const c = composerNamed(s.composer);
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
              {s.group} · {s.level}
            </p>
          </div>
          {s.note && <p className="oh-story">{s.note}.</p>}
          <div className="oh-credits" aria-label="About this song">
            <p>
              <i>Music by</i> {s.composerFull}
            </p>
            <p>
              <i>Sung in</i> {sungIn}
            </p>
            <p>
              <i>For</i> one voice and piano
            </p>
          </div>
        </div>
      </section>
      <section className="oh-cast" aria-labelledby="sg-practice-h">
        <div className="pv-sec-head">
          <h2 className="pv-h2" id="sg-practice-h">
            Practise
          </h2>
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
      </section>
    </main>
  );
}
