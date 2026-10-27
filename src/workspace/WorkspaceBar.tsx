import { Link } from "../router";
import type { CompiledEdition } from "../../shared/types";

export interface LocationReading {
  number: string;
  beat: number;
  beats: number;
  occ: number;
  repeated: boolean;
  passage: string | null;
  source: "playback" | "cursor" | "rehearsal" | "count-in";
  countIn: number;
  sourceLabel: string;
  live: boolean;
}

export interface RoleOption {
  key: string; // part key
  label: string;
}

interface Props {
  edition: CompiledEdition;
  backTo: string;
  backLabel: string;
  context: { kind: "edition" | "version" | "draft" | "rehearsal"; label: string; detail?: string };
  roles: RoleOption[];
  roleKey: string;
  onRole: (k: string) => void;
  view: "full" | "role";
  onView: (v: "full" | "role") => void;
  roleViewLabel: string;
  location: LocationReading;
  zoom: number;
  onZoom: (z: number) => void;
}

export function WorkspaceBar(p: Props) {
  const loc = p.location;
  const beatInt = Math.floor(loc.beat + 1e-6);
  return (
    <header className="ws-bar">
      <div className="ws-id">
        <Link to={p.backTo} className="back" title={`Back to ${p.backLabel}`}>
          ‹ {p.backLabel}
        </Link>
        <h1 className="ws-title">{p.edition.title}</h1>
        <p className={`ws-context ctx-${p.context.kind}`}>
          <span className="ctx-label">{p.context.label}</span>
          {p.context.detail && <span className="ctx-detail">{p.context.detail}</span>}
        </p>
      </div>

      <div className="ws-controls">
        <label className="field-inline">
          <span>Role</span>
          <select value={p.roleKey} onChange={(e) => p.onRole(e.target.value)} aria-label="Selected role">
            {p.roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <div className="segmented" role="group" aria-label="Score view">
          <button aria-pressed={p.view === "full"} onClick={() => p.onView("full")}>
            Full score
          </button>
          <button aria-pressed={p.view === "role"} onClick={() => p.onView("role")}>
            {p.roleViewLabel}
          </button>
        </div>
        <div className="zoom" role="group" aria-label="Notation size">
          <button onClick={() => p.onZoom(Math.max(0.6, +(p.zoom - 0.1).toFixed(2)))} aria-label="Smaller notation">
            A−
          </button>
          <button onClick={() => p.onZoom(Math.min(1.8, +(p.zoom + 0.1).toFixed(2)))} aria-label="Larger notation">
            A+
          </button>
        </div>
      </div>

      <div className={`ws-location src-${loc.source}${loc.live ? "" : " stale"}`} aria-live="off" data-testid="location">
        <div className="loc-measure">
          <span className="loc-m">m.</span>
          <span className="loc-num" data-testid="loc-number">
            {loc.number}
          </span>
        </div>
        <div className="loc-detail">
          <div className="beats" aria-label={`Beat ${beatInt} of ${loc.beats}`}>
            {Array.from({ length: loc.beats }, (_, i) => (
              <span key={i} className={`pip${i + 1 === beatInt ? " on" : ""}`} />
            ))}
            <span className="loc-beat">
              beat {beatInt}
              {loc.repeated ? `, ${loc.occ === 1 ? "1st" : loc.occ === 2 ? "2nd" : `${loc.occ}th`} time` : ""}
            </span>
          </div>
          <div className="loc-source">
            {loc.countIn > 0 ? `Count-in: ${loc.countIn}` : loc.sourceLabel}
            {loc.passage ? <span className="loc-passage"> in {loc.passage}</span> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
