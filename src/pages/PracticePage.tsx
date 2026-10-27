import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, fetchJson, fetchText } from "../api";
import { useAuth } from "../App";
import { Link, navigate } from "../router";
import { Performance, beatInfo } from "../../shared/timeline";
import { entrances as computeEntrances, type Entrance } from "../../shared/cues";
import type { CompiledEdition, CompiledLanguage, Cut, LoopRange, PassageComment, Permission } from "../../shared/types";
import { usePlayback } from "../audio/usePlayback";
import { useRehearsal } from "../rehearsal/useRehearsal";
import { useLocalSetting, useTicker } from "../hooks";
import { ScoreView, type CursorReading, type Flag, type MarkerReading } from "../score/ScoreView";
import type { ScoreLayout } from "../score/layout";
import { WorkspaceBar, type LocationReading } from "../workspace/WorkspaceBar";
import { Transport, type PassageEntry } from "../workspace/Transport";
import { MixerPanel } from "../workspace/MixerPanel";
import { LanguagePanel } from "../workspace/LanguagePanel";
import { NotesPanel, type PrivateNote } from "../workspace/NotesPanel";
import { CommentsPanel } from "../workspace/CommentsPanel";
import { CuesPanel } from "../workspace/CuesPanel";
import { RehearsalPanel, connectionText } from "../workspace/RehearsalPanel";

interface Props {
  editionId?: string;
  productionId?: string;
  version?: string;
  sessionId?: string;
}

interface Loaded {
  edition: CompiledEdition;
  language: CompiledLanguage;
  xml: string;
  cuts: Cut[];
  comments: PassageComment[];
  corrections: PassageComment[];
  production: { id: string; name: string; editionId: string } | null;
  version: { number: number | null; label: string; summary: string; publishedAt: string | null } | null;
  membership: { permission: Permission; roles: string[] } | null;
  latestVersion: number;
  session: { id: string; name: string; versionNumber: number; endedAt: string | null; createdBy: string } | null;
}

interface VersionPayload {
  production: { id: string; name: string; editionId: string };
  version: Loaded["version"];
  cuts: Cut[];
  comments: PassageComment[];
  corrections: PassageComment[];
  me: { permission: Permission; roles: string[] };
  latestVersion: number;
}

type PanelKey = "language" | "mixer" | "cues" | "notes" | "comments" | "rehearsal";

const ord = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

export function PracticePage(props: Props) {
  const { me } = useAuth();
  const [ctx, setCtx] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<PrivateNote[]>([]);

  const loadVersion = useCallback(async (pid: string, v: string): Promise<VersionPayload> => api<VersionPayload>(`/api/productions/${pid}/versions/${v}`), []);

  // ---------- load ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let session: Loaded["session"] = null;
        let vp: VersionPayload | null = null;
        if (props.sessionId) {
          const s = await api<{ id: string; productionId: string; versionNumber: number; name: string; endedAt: string | null; createdBy: string }>(`/api/rehearsals/${props.sessionId}`);
          session = { id: s.id, name: s.name, versionNumber: s.versionNumber, endedAt: s.endedAt, createdBy: s.createdBy };
          vp = await loadVersion(s.productionId, String(s.versionNumber));
        } else if (props.productionId) {
          vp = await loadVersion(props.productionId, props.version ?? "draft");
        }
        const editionId = vp?.production.editionId ?? props.editionId!;
        const [edition, language, xml, myNotes] = await Promise.all([
          fetchJson<CompiledEdition>(`/content/${editionId}/edition.json`),
          fetchJson<CompiledLanguage>(`/content/${editionId}/language.json`),
          fetchText(`/content/${editionId}/score.musicxml`),
          api<PrivateNote[]>(`/api/notes?editionId=${encodeURIComponent(editionId)}${vp ? `&productionId=${vp.production.id}` : ""}`),
        ]);
        if (!alive) return;
        setNotes(myNotes);
        setCtx({
          edition,
          language,
          xml,
          cuts: vp?.cuts ?? [],
          comments: vp?.comments ?? [],
          corrections: vp?.corrections ?? [],
          production: vp?.production ?? null,
          version: vp?.version ?? null,
          membership: vp?.me ?? null,
          latestVersion: vp?.latestVersion ?? 0,
          session,
        });
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [props.editionId, props.productionId, props.version, props.sessionId, loadVersion]);

  const reloadProduction = useCallback(async () => {
    if (!ctx?.production) return;
    const v = ctx.session ? String(ctx.session.versionNumber) : props.version ?? "draft";
    const vp = await loadVersion(ctx.production.id, v);
    setCtx((c) => (c ? { ...c, cuts: vp.cuts, comments: vp.comments, corrections: vp.corrections, latestVersion: vp.latestVersion } : c));
  }, [ctx?.production, ctx?.session, props.version, loadVersion]);

  // ---------- core models ----------
  const edition = ctx?.edition;
  const perf = useMemo(() => (edition ? new Performance(edition, ctx!.cuts.filter((c) => c.status === "ok")) : null), [edition, ctx?.cuts]);
  const pb = usePlayback(perf, edition?.parts);
  const engine = pb.engine;
  const isRehearsal = !!props.sessionId;
  const rh = useRehearsal({ sessionId: props.sessionId, productionIds: ctx?.production ? [ctx.production.id] : [], enabled: !!ctx?.production });
  const s = rh.state;

  // ---------- role & view ----------
  const roleOptions = useMemo(() => {
    if (!edition) return [];
    return [
      ...edition.roles.map((r) => ({ key: r.partKey, label: `${r.name} (${r.voiceType.toLowerCase()})` })),
      { key: "piano", label: "Piano (accompanist)" },
    ];
  }, [edition]);
  const [roleKey, setRoleKey] = useState<string>("");
  const [view, setView] = useState<"full" | "role">("full");
  useEffect(() => {
    if (!edition || roleKey) return;
    const myRoles = ctx?.membership?.roles ?? [];
    const vocal = edition.roles.find((r) => myRoles.includes(r.id));
    if (vocal) {
      setRoleKey(vocal.partKey);
      setView("role");
    } else if (myRoles.includes("accompanist")) setRoleKey("piano");
    else setRoleKey(edition.roles[0]?.partKey ?? "piano");
  }, [edition, ctx?.membership, roleKey]);
  const role = edition?.roles.find((r) => r.partKey === roleKey) ?? null;
  const rolePart = edition?.parts.find((p) => p.key === roleKey);
  const visibleXmlParts = useMemo(() => {
    if (view === "full" || !rolePart || rolePart.kind === "piano") return null;
    return [rolePart.source.xmlPartId];
  }, [view, rolePart]);
  const visiblePartKeys = useMemo(
    () => new Set(edition?.parts.filter((p) => !visibleXmlParts || visibleXmlParts.includes(p.source.xmlPartId)).map((p) => p.key) ?? []),
    [edition, visibleXmlParts],
  );

  // ---------- per-viewer settings ----------
  const [zoom, setZoom] = useLocalSetting("zoom", 0.85);
  const [autoScroll, setAutoScroll] = useLocalSetting("autoscroll", true);
  const [countIn, setCountIn] = useLocalSetting("countin", false);
  const [panel, setPanel] = useLocalSetting<PanelKey | null>("panel", "language");
  const [panelOpen, setPanelOpen] = useLocalSetting("panelOpen", true);
  const [selectMode, setSelectMode] = useState(false);
  const [selection, setSelection] = useState<{ startM: number; endM: number } | null>(null);
  const [loopRange, setLoopRange] = useState<LoopRange | null>(null);
  const [loopOn, setLoopOn] = useState(false);
  const [following, setFollowing] = useState(true);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [fixtureDismissed, setFixtureDismissed] = useState(false);
  const layoutRef = useRef<ScoreLayout | null>(null);

  useEffect(() => {
    if (isRehearsal) setPanel("rehearsal");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRehearsal]);

  // ---------- rehearsal roles ----------
  const leader = s?.participants.find((x) => x.userId === s.leaderId);
  const leaderOnline = !!leader?.connected;
  const iLead = !!s && !!me && s.leaderId === me.id;
  const isLeaderDevice = isRehearsal && iLead && !!rh.connId && rh.audioConnId === rh.connId && rh.connection === "live";
  const leaderElsewhere = iLead && rh.audioConnId !== rh.connId;
  const ended = !!ctx?.session?.endedAt || !!s?.endedAt;
  const playDisabledReason = !isRehearsal
    ? null
    : ended
      ? "This rehearsal has ended."
      : isLeaderDevice
        ? null
        : iLead
          ? "You lead from another device."
          : `Sound comes from ${s?.audioDevice ?? "the leader’s device"}; this device follows.`;

  // count-in & tempo settings into the engine
  useEffect(() => {
    engine?.setCountIn(countIn);
  }, [engine, countIn]);

  // effective loop: shared in rehearsal, personal otherwise
  const effectiveLoop: LoopRange | null = isRehearsal ? (s?.loop ?? null) : loopOn ? loopRange : null;
  const loopKey = JSON.stringify(effectiveLoop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loopQ = useMemo(() => (perf ? perf.loopToQ(effectiveLoop) : null), [perf, loopKey]);
  useEffect(() => {
    engine?.setLoop(loopQ);
  }, [engine, loopQ]);

  // leadership changes: the new leader's engine starts from the shared position; others go quiet
  const wasLeaderDevice = useRef(false);
  useEffect(() => {
    if (!engine || !perf) return;
    if (isLeaderDevice && !wasLeaderDevice.current && s) engine.seek(perf.toPerfQ(s.marker));
    if (!isLeaderDevice && isRehearsal && engine.state === "playing") engine.pause();
    wasLeaderDevice.current = isLeaderDevice;
  }, [isLeaderDevice, isRehearsal, engine, perf, s]);

  // leader device reports playback; paused positions are reported once
  const lastReport = useRef("");
  const reportPlayback = rh.reportPlayback; // stable callback: the interval must not restart on every render
  useEffect(() => {
    if (!isLeaderDevice || !engine || !perf) return;
    const id = setInterval(() => {
      const playing = engine.state === "playing";
      const pos = perf.toPos(engine.displayQ());
      const key = `${engine.state}|${pos.m}|${pos.q}|${pos.occ}|${engine.tempo}`;
      if (!playing && key === lastReport.current) return;
      lastReport.current = key;
      reportPlayback(playing ? "playing" : engine.state === "stopped" ? "stopped" : "paused", pos, engine.tempo, engine.qPerSec());
    }, 150);
    return () => clearInterval(id);
  }, [isLeaderDevice, engine, perf, reportPlayback]);

  // ---------- positions ----------
  const markerInfo = useCallback((): { q: number; live: boolean; moving: boolean } | null => {
    if (!isRehearsal || !perf || !s) return null;
    const mq = rh.markerQ(perf);
    if (!mq) return null;
    return { q: mq.q, live: rh.connection === "live" && leaderOnline, moving: mq.moving };
  }, [isRehearsal, perf, s, rh, leaderOnline]);

  const showMarker = isRehearsal && !isLeaderDevice;
  const readFromMarker = showMarker && following;
  const currentQ = useCallback((): number => {
    if (readFromMarker) return markerInfo()?.q ?? 0;
    return engine ? engine.displayQ() : 0;
  }, [readFromMarker, markerInfo, engine]);

  const cursorRef = useRef<() => CursorReading | null>(() => null);
  cursorRef.current = () => {
    if (!engine) return null;
    const playing = engine.state === "playing";
    // followers hide their own cursor while following; it reappears when they browse
    if (showMarker && following) return null;
    const label = playing ? (isLeaderDevice ? "Playback (shared)" : "Playback") : showMarker ? "You are browsing" : isLeaderDevice ? "Rehearsal position" : "You are here";
    return { q: engine.displayQ(), show: true, playing, label };
  };
  const markerRef = useRef<() => MarkerReading | null>(() => null);
  const leaderFirst = s?.leaderName?.split(" ")[0] ?? "Leader";
  markerRef.current = () => {
    if (!showMarker) return null;
    const mi = markerInfo();
    if (!mi) return null;
    return { q: mi.q, live: mi.live, label: mi.live ? `Rehearsal (${leaderFirst}${mi.moving ? " playing" : ""})` : "Rehearsal: not live" };
  };

  const passages: PassageEntry[] = useMemo(() => {
    if (!perf || !edition) return [];
    const out: PassageEntry[] = [];
    const seen = new Map<string, number>();
    let lastM = -2;
    for (const pm of perf.measures) {
      const ps = edition.passages.find((x) => pm.m >= x.startM && pm.m <= x.endM);
      const id = ps?.id ?? "other";
      const last = out[out.length - 1];
      // extend only through consecutive written measures (a repeat jump starts a new pass)
      if (last && last.key.startsWith(`${id}#`) && Math.abs(last.endQ - pm.startQ) < 1e-6 && lastM === pm.m - 1) {
        last.endQ = pm.startQ + pm.durQ;
        lastM = pm.m;
        continue;
      }
      lastM = pm.m;
      const n = (seen.get(id) ?? 0) + 1;
      seen.set(id, n);
      const letter = ps ? edition.measures[ps.startM].rehearsal : undefined;
      out.push({ key: `${id}#${n}`, label: `${ps?.label ?? "Passage"}${letter ? ` (${letter})` : ""}`, startQ: pm.startQ, endQ: pm.startQ + pm.durQ });
    }
    const counts = new Map<string, number>();
    for (const p of out) counts.set(p.key.split("#")[0], (counts.get(p.key.split("#")[0]) ?? 0) + 1);
    for (const p of out) {
      const [id, n] = p.key.split("#");
      if ((counts.get(id) ?? 0) > 1) p.label += `, ${ord(Number(n))} time`;
    }
    return out;
  }, [perf, edition]);

  const location: LocationReading = useTicker(
    () => {
      if (!perf || !edition) return { number: "1", beat: 1, beats: 4, occ: 1, repeated: false, passage: null, source: "cursor", countIn: 0, sourceLabel: "", live: true };
      const q = currentQ();
      const l = perf.locate(q);
      const pidx = passages.reduce((acc, p, i) => (p.startQ <= q + 1e-6 ? i : acc), 0);
      const playing = engine?.state === "playing";
      const countInLeft = !readFromMarker && engine ? engine.countInRemaining() : 0;
      const mi = readFromMarker ? markerInfo() : null;
      const source: LocationReading["source"] = readFromMarker ? "rehearsal" : countInLeft ? "count-in" : playing ? "playback" : "cursor";
      const sourceLabel = readFromMarker
        ? mi?.live
          ? `Rehearsal position, ${leaderFirst} leads`
          : "Last known rehearsal position, not live"
        : isLeaderDevice
          ? playing
            ? "Playback, shared with the rehearsal"
            : "Rehearsal position, you lead"
          : playing
            ? "Playback"
            : "Your position";
      return {
        number: l.number,
        beat: l.beat,
        beats: beatInfo(edition.measures[l.m].time).beats,
        occ: l.occ,
        repeated: perf.occurrences(l.m).length > 1,
        passage: passages[pidx]?.label ?? null,
        source,
        countIn: countInLeft,
        sourceLabel,
        live: readFromMarker ? !!mi?.live : true,
      };
    },
    90,
    (a, b) => JSON.stringify(a) === JSON.stringify(b),
  );
  const slowQ = useTicker(() => (perf ? Math.round(currentQ() * 8) / 8 : 0), 120);
  const currentPassage = passages.reduce((acc, p, i) => (p.startQ <= slowQ + 1e-6 ? i : acc), 0);

  // ---------- actions ----------
  const goTo = useCallback(
    (q: number) => {
      if (!engine || !perf) return;
      if (isRehearsal && !isLeaderDevice) {
        engine.seek(q);
        setFollowing(false);
        return;
      }
      engine.seek(q);
      if (isLeaderDevice && engine.state !== "playing") rh.setMarker(perf.toPos(q));
    },
    [engine, perf, isRehearsal, isLeaderDevice, rh],
  );

  const play = async () => {
    if (!engine || !pb.port || playDisabledReason) return;
    await pb.port.resume();
    engine.play();
  };
  const togglePlay = () => (engine?.state === "playing" ? engine.pause() : play());

  const seekPassage = (i: number) => {
    if (!passages.length) return;
    const q = currentQ();
    let idx = Math.max(0, Math.min(passages.length - 1, i));
    // "previous" from inside a passage first returns to its start
    if (i === currentPassage - 1 && q - passages[currentPassage].startQ > 1.01) idx = currentPassage;
    goTo(passages[idx].startQ);
  };

  const onTap = (pos: { m: number; q: number }, ev: { shift: boolean }) => {
    if (!perf) return;
    if (selectMode || ev.shift) {
      setSelection((sel) => {
        if (!sel || sel.startM !== sel.endM || !selectMode) return { startM: pos.m, endM: pos.m };
        return { startM: Math.min(sel.startM, pos.m), endM: Math.max(sel.endM, pos.m) };
      });
      return;
    }
    const here = currentQ();
    const occs = perf.occurrences(pos.m);
    if (!occs.length) return; // cut measure
    // inside a repeated passage, a tap means the same pass you are in; otherwise the nearest occurrence
    const herePass = perf.measures[perf.locate(here).p]?.pass ?? 1;
    const samePass = herePass > 1 || perf.occurrences(perf.locate(here).m).length > 1 ? occs.find((o) => o.pass === herePass) : undefined;
    const occ = samePass ?? occs.reduce((a, b) => (Math.abs(b.startQ - here) < Math.abs(a.startQ - here) ? b : a));
    goTo(perf.toPerfQ({ m: pos.m, q: pos.q, occ: occ.occ }));
  };

  const loopFromSelection = () => {
    if (!perf || !selection) return;
    const here = perf.locate(currentQ());
    const pick = (m: number) => {
      const occs = perf.occurrences(m);
      return (occs.find((o) => o.occ === here.occ) ?? occs[0])?.occ ?? 1;
    };
    const range: LoopRange = { start: { m: selection.startM, occ: pick(selection.startM) }, end: { m: selection.endM, occ: pick(selection.endM) } };
    if (!perf.loopToQ(range)) return;
    if (isRehearsal) {
      if (isLeaderDevice) rh.setLoop(range);
    } else {
      setLoopRange(range);
      setLoopOn(true);
    }
    setSelection(null);
    setSelectMode(false);
  };

  const toggleLoop = () => {
    if (!perf) return;
    if (isRehearsal) {
      if (!isLeaderDevice) return;
      if (s?.loop) rh.setLoop(null);
      else {
        const p = passages[currentPassage];
        if (p) {
          const a = perf.locate(p.startQ);
          const b = perf.locate(p.endQ - 1e-3);
          rh.setLoop({ start: { m: a.m, occ: a.occ }, end: { m: b.m, occ: b.occ } });
        }
      }
      return;
    }
    if (loopOn) return setLoopOn(false);
    if (!loopRange) {
      const p = passages[currentPassage];
      if (!p) return;
      const a = perf.locate(p.startQ);
      const b = perf.locate(p.endQ - 1e-3);
      setLoopRange({ start: { m: a.m, occ: a.occ }, end: { m: b.m, occ: b.occ } });
    }
    setLoopOn(true);
  };

  const cutSelection = async () => {
    if (!ctx?.production || !selection) return;
    try {
      await api(`/api/productions/${ctx.production.id}/cuts`, { body: { startM: selection.startM, endM: selection.endM } });
      setSelection(null);
      setSelectMode(false);
      reloadProduction();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // keyboard: space toggles playback
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.code !== "Space" || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(t.tagName)) return;
      e.preventDefault();
      togglePlay();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });

  // ---------- derived UI ----------
  const entrances: Entrance[] = useMemo(() => (perf && role ? computeEntrances(perf, role.partKey) : []), [perf, role]);
  const flags: Flag[] = useMemo(() => {
    if (!edition) return [];
    const f: Flag[] = [];
    for (const c of ctx?.comments ?? []) if (c.status === "open") f.push({ id: c.id, m: c.startM, q: c.startQ, kind: "comment", label: c.body });
    for (const c of ctx?.corrections ?? []) if (c.status === "open") f.push({ id: c.id, m: c.startM, q: c.startQ, kind: "correction", label: c.body });
    for (const n of notes) f.push({ id: n.id, m: n.startM, q: n.startQ, kind: "note", label: n.body });
    if (view === "role" && role) for (const e of entrances) f.push({ id: `cue-${e.q}`, m: e.m, q: e.noteQ, kind: "cue", label: e.cue });
    return f;
  }, [edition, ctx?.comments, ctx?.corrections, notes, view, role, entrances]);

  const scrollTarget: "cursor" | "marker" | "none" = showMarker && following ? "marker" : autoScroll && engine?.state === "playing" ? "cursor" : "none";

  // test/diagnostic handle
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__cp = {
      perf,
      currentQ,
      markerQ: () => (perf ? rh.markerQ(perf) : null),
      layout: () => layoutRef.current,
      engine,
      following,
      isLeaderDevice,
      connection: rh.connection,
    };
  });

  if (error && !ctx)
    return (
      <div className="page">
        <main className="prod-page">
          <p className="banner error">{error}</p>
          <Link to="/">Back to the library</Link>
        </main>
      </div>
    );
  if (!ctx || !edition || !perf) return <div className="boot">Opening the score…</div>;

  const context = ctx.session
    ? { kind: "rehearsal" as const, label: `${ctx.production!.name}, version ${ctx.session.versionNumber}`, detail: `Rehearsal: ${ctx.session.name}` }
    : ctx.production
      ? ctx.version?.number === null
        ? { kind: "draft" as const, label: `${ctx.production.name}, unpublished draft`, detail: "Changes here are not visible to performers until published" }
        : { kind: "version" as const, label: `${ctx.production.name}, version ${ctx.version?.number}`, detail: ctx.version?.summary }
      : { kind: "edition" as const, label: `Original edition ${edition.editionVersion}`, detail: "Independent practice" };

  const selLabel = selection ? `m. ${edition.measures[selection.startM].number}${selection.endM !== selection.startM ? `–${edition.measures[selection.endM].number}` : ""}` : "";
  const anchor = perf.locate(currentQ());
  const versionNotices = rh.notices.filter((n) => n.kind === "version-published" && n.productionId === ctx.production?.id);
  const thisVersion = ctx.session?.versionNumber ?? ctx.version?.number ?? null;
  const newerVersion = Math.max(ctx.latestVersion, ...versionNotices.map((n) => n.versionNumber ?? 0));
  const isEditorDraft = ctx.production && ctx.version?.number === null && ctx.membership?.permission === "editor";
  const conn = isRehearsal ? connectionText(rh, leaderOnline) : null;
  const loopLabel = (() => {
    if (!loopQ) return null;
    const a = perf.locate(loopQ.startQ);
    const b = perf.locate(loopQ.endQ - 1e-3);
    const repeated = perf.occurrences(a.m).length > 1;
    return `Loop m. ${a.number}–${b.number}${repeated ? `, ${ord(a.occ)} time` : ""}`;
  })();

  const tabs: { key: PanelKey; label: string }[] = [
    ...(isRehearsal ? [{ key: "rehearsal" as const, label: "Rehearsal" }] : []),
    { key: "language", label: "Language" },
    { key: "mixer", label: "Mixer" },
    { key: "cues", label: "Cues" },
    { key: "notes", label: "My notes" },
    ...(ctx.production ? [{ key: "comments" as const, label: "Comments" }] : []),
  ];
  const activePanel = tabs.some((t) => t.key === panel) ? panel : tabs[0].key;

  return (
    <div className={`workspace${panelOpen ? " panel-open" : ""}`}>
      <WorkspaceBar
        edition={edition}
        backTo={ctx.production ? `/p/${ctx.production.id}` : "/"}
        backLabel={ctx.production ? "Production" : "Library"}
        context={context}
        roles={roleOptions}
        roleKey={roleKey}
        onRole={setRoleKey}
        view={view}
        onView={setView}
        roleViewLabel={rolePart?.kind === "piano" ? "Vocal score" : `${role?.name ?? "My"} only`}
        location={location}
        zoom={zoom}
        onZoom={setZoom}
      />

      <div className="ws-banners">
        {edition.fixture && !fixtureDismissed && (
          <p className="strip fixture">
            Development fixture: original music and text written for this MVP, not genuine repertoire.
            <button className="link" onClick={() => setFixtureDismissed(true)}>
              Hide
            </button>
          </p>
        )}
        {conn && conn.tone !== "live" && (
          <p className={`strip conn-${conn.tone}`} role="status" data-testid="conn-strip">
            {conn.text}
          </p>
        )}
        {ended && <p className="strip conn-down">This rehearsal has ended. The score stays open for your own practice.</p>}
        {thisVersion !== null && newerVersion > thisVersion && (
          <p className="strip blue" data-testid="version-notice">
            Version {newerVersion} has been published
            {versionNotices.length ? `: “${versionNotices[versionNotices.length - 1].summary}”` : ""}.{" "}
            {isRehearsal ? `This rehearsal stays on version ${thisVersion}.` : `You are viewing version ${thisVersion}.`}{" "}
            <Link to={`/p/${ctx.production!.id}/v/${newerVersion}`}>Practise version {newerVersion}</Link>
          </p>
        )}
        {error && (
          <p className="strip conn-down" onClick={() => setError(null)}>
            {error}
          </p>
        )}
        {pb.error && <p className="strip conn-down">{pb.error}</p>}
      </div>

      <div className="ws-body">
        <div className="ws-score">
          <ScoreView
            xml={ctx.xml}
            edition={edition}
            perf={perf}
            visibleXmlParts={visibleXmlParts}
            zoom={zoom}
            cursor={cursorRef}
            marker={markerRef}
            scrollTarget={scrollTarget}
            loop={loopQ}
            selection={selection}
            cuts={ctx.cuts}
            flags={flags}
            onTap={onTap}
            onFlag={(f) => {
              setFocusId(f.id);
              setPanelOpen(true);
              setPanel(f.kind === "note" ? "notes" : f.kind === "cue" ? "cues" : "comments");
            }}
            onUserScroll={() => showMarker && setFollowing(false)}
            onLayout={(l) => (layoutRef.current = l)}
          />
          {showMarker && !following && (
            <button className="float-back btn red" onClick={() => setFollowing(true)} data-testid="back-float">
              Back to rehearsal position
            </button>
          )}
          {selection && (
            <div className="selection-bar" role="toolbar" aria-label="Selected bars">
              <span>{selLabel} selected</span>
              {(!isRehearsal || isLeaderDevice) && (
                <button className="btn small" onClick={loopFromSelection} data-testid="loop-selection">
                  {isRehearsal ? "Loop for everyone" : "Loop these bars"}
                </button>
              )}
              <button
                className="btn small graphite"
                onClick={() => {
                  setPanel("notes");
                  setPanelOpen(true);
                  const q = perf.toPerfQ({ m: selection.startM, q: 0, occ: perf.locate(currentQ()).occ });
                  if (!isRehearsal || isLeaderDevice) goTo(q);
                }}
              >
                Add a private note
              </button>
              {ctx.production && (
                <button
                  className="btn small blue"
                  onClick={() => {
                    setPanel("comments");
                    setPanelOpen(true);
                  }}
                >
                  {isEditorDraft ? "Comment" : "Request a correction"}
                </button>
              )}
              {isEditorDraft && (
                <button className="btn small blue" onClick={cutSelection} data-testid="cut-selection">
                  Cut {selLabel}
                </button>
              )}
              <button className="btn small quiet" onClick={() => setSelection(null)}>
                Clear
              </button>
            </div>
          )}
        </div>

        <aside className={`ws-panel${panelOpen ? "" : " closed"}`} aria-label="Practice tools">
          <nav className="panel-tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={panelOpen && activePanel === t.key}
                onClick={() => {
                  if (panelOpen && activePanel === t.key) setPanelOpen(false);
                  else {
                    setPanel(t.key);
                    setPanelOpen(true);
                  }
                }}
                data-testid={`tab-${t.key}`}
              >
                {t.label}
                {t.key === "rehearsal" && conn && <span className={`tab-dot conn-${conn.tone}`} aria-hidden />}
              </button>
            ))}
            <button className="panel-collapse" onClick={() => setPanelOpen(!panelOpen)} aria-label={panelOpen ? "Hide panel" : "Show panel"}>
              {panelOpen ? "Hide" : "Show"}
            </button>
          </nav>
          {panelOpen && (
            <div className="panel-body" role="tabpanel">
              {activePanel === "rehearsal" && isRehearsal && (
                <RehearsalPanel
                  rh={rh}
                  meId={me!.id}
                  perf={perf}
                  following={following}
                  onFollow={setFollowing}
                  onBack={() => setFollowing(true)}
                  isLeaderDevice={isLeaderDevice}
                  leaderElsewhere={leaderElsewhere}
                  onEnd={
                    ctx.membership?.permission === "editor" || ctx.session?.createdBy === me?.id
                      ? async () => {
                          await api(`/api/rehearsals/${ctx.session!.id}/end`, { body: {} });
                          navigate(`/p/${ctx.production!.id}`);
                        }
                      : null
                  }
                />
              )}
              {activePanel === "language" && (
                <LanguagePanel
                  edition={edition}
                  language={ctx.language}
                  perf={perf}
                  roleId={role?.id ?? null}
                  q={slowQ}
                  onSeek={goTo}
                  onBeforeSpeak={() => {
                    if (engine?.state === "playing" && !playDisabledReason) engine.pause();
                  }}
                />
              )}
              {activePanel === "mixer" && (
                <MixerPanel engine={engine} parts={edition.parts} visibleParts={visiblePartKeys} myPart={roleKey} disabledReason={playDisabledReason} />
              )}
              {activePanel === "cues" && (
                <CuesPanel
                  edition={edition}
                  perf={perf}
                  roleName={role?.name ?? null}
                  entrances={entrances}
                  currentQ={slowQ}
                  onGo={goTo}
                  canPlay={!playDisabledReason && pb.status === "ready"}
                  onPlayCue={async (e) => {
                    if (!engine || !pb.port) return;
                    await pb.port.resume();
                    engine.pause();
                    goTo(e.cueFromQ);
                    engine.play(e.cueFromQ);
                  }}
                />
              )}
              {activePanel === "notes" && (
                <NotesPanel
                  edition={edition}
                  productionId={ctx.production?.id ?? null}
                  notes={notes}
                  anchor={{ m: anchor.m, q: Math.round(anchor.q * 4) / 4 }}
                  anchorLabel={`m. ${anchor.number}, beat ${Math.round(anchor.beat * 4) / 4}`}
                  onChanged={setNotes}
                  onGo={(m, q) => {
                    const occs = perf.occurrences(m);
                    if (occs.length) goTo(occs[0].startQ + q);
                  }}
                  focusId={focusId}
                />
              )}
              {activePanel === "comments" && ctx.production && ctx.membership && (
                <CommentsPanel
                  edition={edition}
                  productionId={ctx.production.id}
                  versionNumber={ctx.session?.versionNumber ?? ctx.version?.number ?? null}
                  permission={ctx.membership.permission}
                  comments={ctx.comments}
                  corrections={ctx.corrections}
                  range={selection ?? { startM: anchor.m, endM: anchor.m }}
                  onChanged={reloadProduction}
                  onGo={(m) => {
                    const occs = perf.occurrences(m);
                    if (occs.length) goTo(occs[0].startQ);
                  }}
                  focusId={focusId}
                />
              )}
            </div>
          )}
        </aside>
      </div>

      <Transport
        engine={engine}
        audioStatus={pb.status}
        audioProgress={pb.progress}
        playDisabledReason={playDisabledReason}
        passages={passages}
        currentPassage={currentPassage}
        onPlay={play}
        onPause={() => engine?.pause()}
        onStop={() => {
          engine?.stop();
          if (isLeaderDevice && perf) rh.setMarker(perf.toPos(engine?.displayQ() ?? 0));
        }}
        onSeekPassage={seekPassage}
        tempo={engine?.tempo ?? 1}
        baseBpm={perf.bpmAt(slowQ)}
        onTempo={(f) => engine?.setTempoFactor(f)}
        loopLabel={loopLabel}
        loopOn={!!loopQ}
        onLoopToggle={toggleLoop}
        loopDisabledReason={isRehearsal && !isLeaderDevice ? "Only the leader sets the shared loop" : null}
        countIn={countIn}
        onCountIn={setCountIn}
        autoScroll={autoScroll}
        onAutoScroll={setAutoScroll}
        selectMode={selectMode}
        onSelectMode={(v) => {
          setSelectMode(v);
          if (!v) setSelection(null);
        }}
      />
    </div>
  );
}
