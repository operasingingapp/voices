import type { Composer } from "./composers";
import { composerNamed } from "./composers";
import { CHORAL_WORKS, type ChoralWork } from "./choral";
import type { Tone } from "./flow";

export type Mode = "opera" | "choral";

/**
 * What you sing: Opera or Choral, the raised ivory segment on a fog track (as every switch in the app). In the top
 * bar on a phone, at the head of the rail from a tablet up.
 */
export function ModeSwitch({
  mode,
  onChange,
  className,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  className?: string;
}) {
  return (
    <div
      className={`pv-seg mode-switch${className ? ` ${className}` : ""}`}
      role="group"
      aria-label="What you sing"
    >
      {(
        [
          ["opera", "Opera"],
          ["choral", "Choral"],
        ] as const
      ).map(([m, label]) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => mode !== m && onChange(m)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** A row of composers' faces under the search's filters: one tap narrows the list to him, a second tap clears it. */
export function ComposerRow({
  composers,
  value,
  onChange,
}: {
  composers: Composer[];
  value: string | null;
  onChange: (name: string | null) => void;
}) {
  if (composers.length < 2) return null;
  return (
    <section className="cx" aria-labelledby="cx-h">
      <p className="cx-label" id="cx-h">
        Composers
      </p>
      <div className="cx-row" role="group" aria-labelledby="cx-h">
        {composers.map((c) => {
          const on = value === c.name;
          return (
            <button
              key={c.name}
              type="button"
              className="cx-item"
              aria-pressed={on}
              onClick={() => onChange(on ? null : c.name)}
            >
              <span className="cx-face">
                {c.face ? (
                  <img src={c.face} alt="" loading="lazy" decoding="async" />
                ) : (
                  <i aria-hidden="true">{c.name[0]}</i>
                )}
              </span>
              <span className="cx-name">{c.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const TONES: Tone[] = ["sky", "lilac", "mint", "butter", "peach", "pink"];
export const toneOf = (w: ChoralWork) =>
  TONES[CHORAL_WORKS.indexOf(w) % TONES.length];

/** the choral works as square covers (the composer's portrait; a title plate where there is none), as the opera grid */
export function WorksGrid({
  works = CHORAL_WORKS,
  onPick,
}: {
  works?: ChoralWork[];
  onPick: (id: string) => void;
}) {
  return (
    <div className="og">
      {works.map((w) => {
        const c = composerNamed(w.composer);
        return (
          <button
            key={w.id}
            type="button"
            className={`og-card${c.portrait ? " has-art" : ""}`}
            data-tone={toneOf(w)}
            onClick={() => onPick(w.id)}
          >
            <span className="og-pic">
              {c.portrait ? (
                <img
                  className="og-portrait"
                  src={c.portrait}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="og-plate" aria-hidden="true">
                  <i lang={w.lang}>{w.title}</i>
                  <span>{w.year}</span>
                </span>
              )}
            </span>
            <span className="og-text">
              <b lang={w.lang}>{w.title}</b>
              <span>
                {w.composer} · {w.year}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
