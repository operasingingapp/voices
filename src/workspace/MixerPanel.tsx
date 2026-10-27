import type { PlaybackEngine } from "../audio/engine";
import type { PlaybackPart } from "../../shared/types";

interface Props {
  engine: PlaybackEngine | null;
  parts: PlaybackPart[];
  visibleParts: Set<string>;
  myPart: string;
  disabledReason: string | null;
}

export function MixerPanel({ engine, parts, visibleParts, myPart, disabledReason }: Props) {
  if (!engine) return <p className="empty">Audio is still loading.</p>;
  const ordered = [...parts].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "voice" ? -1 : 1));
  const preset = (fn: (p: PlaybackPart) => { muted: boolean; solo: boolean }) => parts.forEach((p) => engine.setMix(p.key, fn(p)));
  return (
    <div className="mixer">
      {disabledReason && <p className="panel-note">{disabledReason} Your mix settings apply when your device plays.</p>}
      <div className="mix-presets" role="group" aria-label="Quick mixes">
        <button className="btn small" onClick={() => preset(() => ({ muted: false, solo: false }))}>
          Everyone
        </button>
        <button className="btn small" onClick={() => preset((p) => ({ muted: p.key === myPart, solo: false }))} data-testid="preset-singalong">
          Sing along (mute my line)
        </button>
        <button className="btn small" onClick={() => preset((p) => ({ muted: false, solo: p.key === myPart }))}>
          My line only
        </button>
      </div>
      <ul className="mix-list">
        {ordered.map((p) => {
          const m = engine.getMix(p.key);
          const audible = engine.effectiveGain(p.key) > 0;
          return (
            <li key={p.key} className={audible ? "" : "silent"} data-testid={`mix-${p.key}`}>
              <div className="mix-name">
                <strong>{p.label}</strong>
                <span className="fine">
                  {audible ? "Audible" : "Silent"}, {visibleParts.has(p.key) ? "shown in score" : "hidden in score"}
                  {p.kind === "voice" ? ", soft piano sound" : ""}
                </span>
              </div>
              <div className="mix-ctl">
                <button className="ms mute" aria-pressed={m.muted} onClick={() => engine.setMix(p.key, { muted: !m.muted })} aria-label={`Mute ${p.label}`} data-testid={`mute-${p.key}`}>
                  Mute
                </button>
                <button className="ms solo" aria-pressed={m.solo} onClick={() => engine.setMix(p.key, { solo: !m.solo })} aria-label={`Solo ${p.label}`} data-testid={`solo-${p.key}`}>
                  Solo
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(m.volume * 100)}
                  onChange={(e) => engine.setMix(p.key, { volume: Number(e.target.value) / 100 })}
                  aria-label={`${p.label} volume`}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="fine">What you see and what you hear are independent: hide other voices in the score and still hear them here.</p>
    </div>
  );
}
