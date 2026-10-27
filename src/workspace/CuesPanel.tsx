import type { Entrance } from "../../shared/cues";
import type { CompiledEdition } from "../../shared/types";
import type { Performance } from "../../shared/timeline";

interface Props {
  edition: CompiledEdition;
  perf: Performance;
  roleName: string | null;
  entrances: Entrance[];
  currentQ: number;
  onGo: (q: number) => void;
  onPlayCue: (e: Entrance) => void;
  canPlay: boolean;
}

export function CuesPanel(p: Props) {
  if (!p.roleName) return <p className="empty">Choose a vocal role to list its entrances.</p>;
  if (!p.entrances.length) return <p className="empty">No entrances found for {p.roleName} in this version.</p>;
  const nextIdx = p.entrances.findIndex((e) => e.q >= p.currentQ - 1e-6);
  return (
    <div className="cues">
      <p className="panel-note">Where {p.roleName} comes in after a rest, and what to listen for. Cut passages are left out.</p>
      <ol className="cue-list">
        {p.entrances.map((e, i) => (
          <li key={e.q} className={i === nextIdx ? "next" : ""}>
            <div>
              <p className="cue-where">
                <strong>{p.perf.describe(e.q)}</strong>
                {e.firstWord ? (
                  <>
                    {" "}
                    on <span lang="it">“{e.firstWord}”</span>
                  </>
                ) : null}
                {Number.isFinite(e.restQ) ? <span className="fine"> after {fmtRest(e.restQ, p.edition.measures[e.m].durQ)}</span> : <span className="fine"> (first entrance)</span>}
              </p>
              <p className="cue-text">{e.cue}</p>
            </div>
            <div className="row-btns">
              <button className="btn small" onClick={() => p.onGo(e.q)}>
                Go to entrance
              </button>
              <button className="btn small" onClick={() => p.onPlayCue(e)} disabled={!p.canPlay}>
                Play from cue
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function fmtRest(q: number, barQ: number) {
  const bars = q / barQ;
  if (bars >= 1.75) return `${Math.round(bars)} bars' rest`;
  if (bars >= 0.9) return "a bar's rest";
  return `${q} beats' rest`;
}
