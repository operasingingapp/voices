import { composerNamed } from "./composers";
import { SONG_GROUPS, songLanguage, type Song } from "./songs";

/**
 * The songs as a list, grouped as a singer thinks of them (arie antiche, Lieder, mélodies…): the composer's face (his
 * initial where there is no portrait), the title in its own language, then who wrote it, its language and its level.
 */
export function SongList({
  songs,
  onPick,
  grouped = true,
}: {
  songs: Song[];
  onPick: (id: string) => void;
  grouped?: boolean;
}) {
  const groups = grouped
    ? SONG_GROUPS.map((g) => [g, songs.filter((s) => s.group === g)] as const).filter(([, l]) => l.length)
    : ([["", songs]] as const);
  return (
    <div className="sg-list">
      {groups.map(([g, list]) => (
        <section key={g || "all"} className="sg-group" aria-label={g || "Songs"}>
          {g && (
            <h2 className="sg-group-h">
              {g} <span>{list.length}</span>
            </h2>
          )}
          <ul className="sg-rows">
            {list.map((s) => {
              const c = composerNamed(s.composer);
              return (
                <li key={s.id}>
                  <button type="button" className="sg-row" onClick={() => onPick(s.id)}>
                    <span className="sg-face" aria-hidden="true">
                      {c.face ? <img src={c.face} alt="" loading="lazy" decoding="async" /> : <i>{s.composer[0]}</i>}
                    </span>
                    <span className="sg-text">
                      <b lang={s.lang === "zxx" ? undefined : s.lang}>{s.title}</b>
                      <span>
                        {s.composer} · {songLanguage(s.lang)} · {s.level}
                      </span>
                    </span>
                    {s.editionId ? <span className="sg-ready">Ready to sing</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
