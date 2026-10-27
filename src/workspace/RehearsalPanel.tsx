import type { RehearsalHandle } from "../rehearsal/useRehearsal";
import type { Performance } from "../../shared/timeline";

interface Props {
  rh: RehearsalHandle;
  meId: string;
  perf: Performance;
  following: boolean;
  onFollow: (v: boolean) => void;
  onBack: () => void;
  isLeaderDevice: boolean;
  leaderElsewhere: boolean;
  onEnd: (() => void) | null;
}

export function connectionText(rh: RehearsalHandle, leaderOnline: boolean): { text: string; tone: "live" | "warn" | "down" } {
  switch (rh.connection) {
    case "live":
      return leaderOnline ? { text: "Live", tone: "live" } : { text: "Live, but the leader is offline", tone: "warn" };
    case "connecting":
      return { text: "Connecting…", tone: "warn" };
    case "reconnecting":
      return { text: "Connection lost, reconnecting. The position shown is not live.", tone: "down" };
    case "offline":
      return { text: "Offline. The position shown is the last one received, not live.", tone: "down" };
    case "forbidden":
      return { text: "You are not a participant of this rehearsal.", tone: "down" };
  }
}

export function RehearsalPanel(p: Props) {
  const s = p.rh.state;
  if (!s) return <p className="empty">{p.rh.connection === "forbidden" ? "You are not a participant of this rehearsal." : "Joining the rehearsal…"}</p>;
  const leader = s.participants.find((x) => x.userId === s.leaderId);
  const leaderOnline = !!leader?.connected;
  const conn = connectionText(p.rh, leaderOnline);
  const iLead = s.leaderId === p.meId;
  const markerDesc = p.perf.describe(p.perf.toPerfQ(s.marker));

  return (
    <div className="rehearsal">
      <p className={`conn conn-${conn.tone}`} data-testid="connection" role="status">
        <span className="conn-dot" aria-hidden />
        {conn.text}
      </p>
      <dl className="facts">
        <dt>Session</dt>
        <dd>
          {s.name}, version {s.versionNumber}
        </dd>
        <dt>Leader</dt>
        <dd data-testid="leader">
          {iLead ? "You" : s.leaderName}
          {!leaderOnline && " (offline)"}
        </dd>
        <dt>Sound from</dt>
        <dd>{s.audioDevice}</dd>
        <dt>Shared position</dt>
        <dd data-testid="marker-desc">
          {markerDesc}
          {s.playback.state === "playing" ? ", playing" : ""}
        </dd>
        <dt>Shared loop</dt>
        <dd>
          {s.loop
            ? `m. ${p.perf.edition.measures[s.loop.start.m].number}–${p.perf.edition.measures[s.loop.end.m].number}`
            : "None"}
        </dd>
      </dl>

      {!iLead && (
        <div className="follow-row">
          <label className="switch">
            <input type="checkbox" checked={p.following} onChange={(e) => p.onFollow(e.target.checked)} data-testid="follow-toggle" />
            Follow rehearsal
          </label>
          {!p.following && (
            <button className="btn red" onClick={p.onBack} data-testid="back-to-rehearsal">
              Back to rehearsal position
            </button>
          )}
        </div>
      )}
      {iLead && p.leaderElsewhere && (
        <p className="panel-note">
          You lead from another device. <button className="btn small" onClick={p.rh.claim}>Use this device instead</button>
        </p>
      )}
      {iLead && !p.leaderElsewhere && <p className="panel-note">You lead. Tap the score to move everyone’s position; when you play, the position follows your playback.</p>}

      <h3 className="sub-title">Participants</h3>
      <ul className="participants">
        {s.participants.map((x) => (
          <li key={x.userId} data-testid={`participant-${x.userId}`}>
            <span className={`pdot ${x.connected ? "on" : "off"}`} aria-hidden />
            <span>
              {x.name}
              {x.userId === p.meId ? " (you)" : ""}
            </span>
            <span className="fine">
              {x.connected ? "connected" : "not connected"}
              {x.userId === s.leaderId ? ", leading" : ""}
            </span>
            {iLead && x.userId !== p.meId && x.connected && (
              <button className="btn small" onClick={() => p.rh.transfer(x.userId)} data-testid={`handover-${x.userId}`}>
                Hand control to {x.name.split(" ")[0]}
              </button>
            )}
          </li>
        ))}
      </ul>
      {!iLead && !leaderOnline && (
        <button className="btn red" onClick={p.rh.claim}>
          Take control
        </button>
      )}
      {p.rh.lastError && (
        <p className="form-error" onClick={p.rh.clearError}>
          {p.rh.lastError}
        </p>
      )}
      {p.onEnd && (
        <button className="btn quiet" onClick={p.onEnd}>
          End session for everyone
        </button>
      )}
    </div>
  );
}
