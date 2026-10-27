/**
 * Realtime rehearsal sessions over WebSockets.
 *
 * The server is authoritative for: who is in the session, who leads, which device produces sound,
 * the shared marker (a musical position), the shared loop and the pinned production version.
 * Positions are validated against the pinned version's performance timeline; screen layout never
 * enters the protocol.
 */
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import type { DB } from "./db";
import { now } from "./db";
import { parseCookies, SESSION_COOKIE, userFromToken, type User } from "./auth";
import type { ContentStore } from "./content";
import { getMembership, getProduction, getVersion, listMembers } from "./productions";
import { Performance } from "../shared/timeline";
import type { LoopRange, MusicalPos, RehearsalState } from "../shared/types";

const HEARTBEAT_MS = Number(process.env.CP_HEARTBEAT_MS ?? 5000);
const CLAIM_GRACE_MS = Number(process.env.CP_CLAIM_GRACE_MS ?? 5000);

interface Conn {
  id: string;
  ws: WebSocket;
  user: User;
  sessionId?: string;
  productions: Set<string>;
  alive: boolean;
}

interface LiveSession {
  state: RehearsalState;
  participantIds: string[];
  conns: Set<Conn>;
  audioConnId?: string;
  perf: Performance;
  leaderOfflineSince?: number;
  persistTimer?: NodeJS.Timeout;
}

export class Realtime {
  private wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
  private conns = new Set<Conn>();
  private sessions = new Map<string, LiveSession>();
  private heartbeat: NodeJS.Timeout;

  constructor(
    private db: DB,
    private content: ContentStore,
  ) {
    this.heartbeat = setInterval(() => this.beat(), HEARTBEAT_MS);
  }

  close() {
    clearInterval(this.heartbeat);
    for (const c of this.conns) c.ws.terminate();
    for (const s of this.sessions.values()) if (s.persistTimer) clearTimeout(s.persistTimer);
    this.wss.close();
  }

  handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
    const user = userFromToken(this.db, parseCookies(req.headers.cookie)[SESSION_COOKIE]);
    if (!user) {
      socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }
    this.wss.handleUpgrade(req, socket, head, (ws) => this.onConnection(ws, user));
  }

  private onConnection(ws: WebSocket, user: User) {
    const conn: Conn = { id: randomUUID(), ws, user, productions: new Set(), alive: true };
    this.conns.add(conn);
    ws.on("pong", () => (conn.alive = true));
    ws.on("message", (raw) => {
      conn.alive = true;
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return this.send(conn, { type: "error", message: "Malformed message" });
      }
      try {
        this.onMessage(conn, msg);
      } catch (e) {
        this.send(conn, { type: "error", message: (e as Error).message });
      }
    });
    ws.on("close", () => this.onClose(conn));
    ws.on("error", () => this.onClose(conn));
    this.send(conn, { type: "hello", connId: conn.id, user: { id: user.id, displayName: user.displayName }, serverNow: Date.now() });
  }

  private onMessage(conn: Conn, msg: Record<string, unknown>) {
    switch (msg.type) {
      case "ping":
        return this.send(conn, { type: "pong", t: msg.t, serverNow: Date.now() });
      case "subscribe": {
        const ids = Array.isArray(msg.productionIds) ? (msg.productionIds as unknown[]).filter((x) => typeof x === "string") : [];
        for (const pid of ids as string[]) if (getMembership(this.db, pid, conn.user.id)) conn.productions.add(pid);
        return;
      }
      case "join":
        return this.join(conn, String(msg.sessionId ?? ""));
      case "leave":
        return this.detach(conn);
    }
    const s = conn.sessionId ? this.sessions.get(conn.sessionId) : undefined;
    if (!s) throw new Error("Not in a rehearsal session");
    if (s.state.endedAt) throw new Error("This rehearsal session has ended");
    const isLeader = s.state.leaderId === conn.user.id;
    const isAudio = s.audioConnId === conn.id;

    switch (msg.type) {
      case "marker": {
        if (!isLeader || !isAudio) throw new Error("Only the leader's device can move the shared marker");
        const pos = this.validPos(s, msg.pos);
        s.state.marker = pos;
        s.state.markerSource = "manual";
        s.state.playback = { ...s.state.playback, pos, perfQ: s.perf.toPerfQ(pos), sentAt: Date.now() };
        s.state.seq++;
        this.broadcastMarker(s);
        break;
      }
      case "playback": {
        if (!isLeader || !isAudio) throw new Error("Only the leader's device can report playback");
        const pos = this.validPos(s, msg.pos);
        const state = msg.state === "playing" || msg.state === "paused" || msg.state === "stopped" ? msg.state : "paused";
        const tempoFactor = clampNum(msg.tempoFactor, 0.25, 2, 1);
        const qPerSec = clampNum(msg.qPerSec, 0, 20, 0);
        s.state.marker = pos;
        s.state.markerSource = state === "playing" ? "playback" : "manual";
        s.state.playback = { state, pos, perfQ: s.perf.toPerfQ(pos), qPerSec: state === "playing" ? qPerSec : 0, tempoFactor, sentAt: Date.now() };
        s.state.seq++;
        this.broadcastMarker(s);
        break;
      }
      case "loop": {
        if (!isLeader || !isAudio) throw new Error("Only the leader's device can set the shared loop");
        s.state.loop = msg.loop ? this.validLoop(s, msg.loop) : null;
        s.state.seq++;
        this.broadcastState(s);
        break;
      }
      case "transfer": {
        if (!isLeader) throw new Error("Only the leader can hand over control");
        const to = String(msg.toUserId ?? "");
        const target = [...s.conns].filter((c) => c.user.id === to);
        if (!s.participantIds.includes(to) || !target.length) throw new Error("That participant is not connected");
        this.setLeader(s, to, target[target.length - 1].id);
        break;
      }
      case "claim": {
        const leaderOnline = [...s.conns].some((c) => c.user.id === s.state.leaderId);
        if (isLeader) {
          // leader moving audio to this device (e.g. second tab)
          this.setLeader(s, conn.user.id, conn.id);
          break;
        }
        if (leaderOnline) throw new Error("The leader is connected; ask them to hand over control");
        if (s.leaderOfflineSince && Date.now() - s.leaderOfflineSince < CLAIM_GRACE_MS) throw new Error("The leader only just disconnected; try again in a moment");
        this.setLeader(s, conn.user.id, conn.id);
        break;
      }
      default:
        throw new Error(`Unknown message ${String(msg.type)}`);
    }
    this.schedulePersist(s);
  }

  private setLeader(s: LiveSession, userId: string, connId: string) {
    const name = s.state.participants.find((p) => p.userId === userId)?.name ?? "Unknown";
    s.state.leaderId = userId;
    s.state.leaderName = name;
    s.audioConnId = connId;
    s.state.audioDevice = `${name}’s device`;
    s.leaderOfflineSince = undefined;
    // the sounding device changed: playback stops until the new leader presses play
    if (s.state.playback.state === "playing") s.state.playback = { ...s.state.playback, state: "paused", qPerSec: 0, sentAt: Date.now() };
    s.state.seq++;
    this.broadcastState(s);
  }

  private loadSession(sessionId: string): LiveSession | undefined {
    const existing = this.sessions.get(sessionId);
    if (existing) return existing;
    const row = this.db
      .prepare("select id, production_id as productionId, version_number as versionNumber, name, created_by as createdBy, ended_at as endedAt, participant_ids as participantIds, state from rehearsal_sessions where id = ?")
      .get(sessionId) as
      | { id: string; productionId: string; versionNumber: number; name: string; createdBy: string; endedAt: string | null; participantIds: string; state: string }
      | undefined;
    if (!row) return undefined;
    const prod = getProduction(this.db, row.productionId)!;
    const edition = this.content.edition(prod.editionId)!;
    const version = getVersion(this.db, row.productionId, row.versionNumber)!;
    const perf = new Performance(edition, version.snapshot.cuts);
    const state = JSON.parse(row.state) as RehearsalState;
    state.endedAt = row.endedAt;
    const participantIds: string[] = JSON.parse(row.participantIds);
    const members = listMembers(this.db, row.productionId);
    state.participants = participantIds.map((id) => {
      const m = members.find((x) => x.userId === id);
      return { userId: id, name: m?.displayName ?? "Former member", roles: m?.roles ?? [], permission: m?.permission ?? "performer", connected: false, lastSeen: 0 };
    });
    if (state.playback.state === "playing") state.playback = { ...state.playback, state: "paused", qPerSec: 0 };
    const live: LiveSession = { state, participantIds, conns: new Set(), perf };
    this.sessions.set(sessionId, live);
    return live;
  }

  private join(conn: Conn, sessionId: string) {
    this.detach(conn);
    const s = this.loadSession(sessionId);
    // Unknown session and "not invited" look the same to the client.
    if (!s || !s.participantIds.includes(conn.user.id) || !getMembership(this.db, s.state.productionId, conn.user.id)) {
      return this.send(conn, { type: "error", code: "forbidden", message: "You are not a participant of this rehearsal session" });
    }
    conn.sessionId = sessionId;
    conn.productions.add(s.state.productionId);
    s.conns.add(conn);
    const p = s.state.participants.find((x) => x.userId === conn.user.id)!;
    p.connected = true;
    p.lastSeen = Date.now();
    if (s.state.leaderId === conn.user.id) {
      const audioAlive = [...s.conns].some((c) => c.id === s.audioConnId);
      if (!audioAlive) {
        s.audioConnId = conn.id;
        s.state.audioDevice = `${p.name}’s device`;
      }
      s.leaderOfflineSince = undefined;
    }
    s.state.seq++;
    this.send(conn, { type: "welcome", connId: conn.id, state: s.state, audioConnId: s.audioConnId, serverNow: Date.now() });
    this.broadcastState(s, conn);
  }

  private detach(conn: Conn) {
    if (!conn.sessionId) return;
    const s = this.sessions.get(conn.sessionId);
    conn.sessionId = undefined;
    if (!s) return;
    s.conns.delete(conn);
    const stillThere = [...s.conns].some((c) => c.user.id === conn.user.id);
    const p = s.state.participants.find((x) => x.userId === conn.user.id);
    if (p && !stillThere) {
      p.connected = false;
      p.lastSeen = Date.now();
    }
    if (s.audioConnId === conn.id) {
      s.audioConnId = undefined;
      s.state.audioDevice = "No device is producing sound";
      if (s.state.playback.state === "playing") s.state.playback = { ...s.state.playback, state: "paused", qPerSec: 0, sentAt: Date.now() };
    }
    if (s.state.leaderId === conn.user.id && !stillThere) s.leaderOfflineSince = Date.now();
    s.state.seq++;
    this.broadcastState(s);
    this.schedulePersist(s);
  }

  private onClose(conn: Conn) {
    if (!this.conns.has(conn)) return;
    this.conns.delete(conn);
    this.detach(conn);
  }

  private beat() {
    for (const c of this.conns) {
      if (!c.alive) {
        c.ws.terminate();
        this.onClose(c);
        continue;
      }
      c.alive = false;
      try {
        c.ws.ping();
      } catch {
        /* closed */
      }
    }
  }

  /** Called after a version is published. Active sessions keep their pinned version. */
  notifyProduction(productionId: string, payload: Record<string, unknown>) {
    for (const c of this.conns) if (c.productions.has(productionId)) this.send(c, { type: "notice", productionId, ...payload });
  }

  /** Session ended over REST. */
  endSession(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    s.state.endedAt = now();
    s.state.playback = { ...s.state.playback, state: "stopped", qPerSec: 0 };
    s.state.seq++;
    this.broadcastState(s);
  }

  /** Remove a user's live connections from a production's sessions (membership revoked). */
  revoke(productionId: string, userId: string) {
    for (const c of this.conns) {
      if (c.user.id !== userId) continue;
      c.productions.delete(productionId);
      const s = c.sessionId ? this.sessions.get(c.sessionId) : undefined;
      if (s?.state.productionId === productionId) {
        this.detach(c);
        this.send(c, { type: "error", code: "forbidden", message: "Your access to this production was removed" });
      }
    }
  }

  private validPos(s: LiveSession, raw: unknown): MusicalPos {
    const p = raw as Partial<MusicalPos> | undefined;
    const M = s.perf.edition.measures;
    if (!p || !Number.isInteger(p.m) || p.m! < 0 || p.m! >= M.length) throw new Error("Invalid musical position");
    const q = Number(p.q);
    if (!Number.isFinite(q) || q < 0 || q > M[p.m!].durQ + 1e-6) throw new Error("Invalid beat position");
    const occs = s.perf.occurrences(p.m!).length;
    const occ = p.occ === undefined ? 1 : Number(p.occ);
    if (!Number.isInteger(occ) || occ < 1 || (occs > 0 && occ > occs)) throw new Error("Invalid occurrence");
    const out: MusicalPos = { m: p.m!, q: Math.round(q * 10000) / 10000, occ };
    if (typeof p.noteId === "string" && p.noteId.length < 100 && s.perf.edition.notes.some((n) => n.id === p.noteId)) out.noteId = p.noteId;
    return out;
  }

  private validLoop(s: LiveSession, raw: unknown): LoopRange {
    const l = raw as LoopRange;
    const a = this.validPos(s, { m: l?.start?.m, q: 0, occ: l?.start?.occ });
    const b = this.validPos(s, { m: l?.end?.m, q: 0, occ: l?.end?.occ });
    const loop = { start: { m: a.m, occ: a.occ ?? 1 }, end: { m: b.m, occ: b.occ ?? 1 } };
    if (!s.perf.loopToQ(loop)) throw new Error("Loop end must come after its start");
    return loop;
  }

  private broadcastState(s: LiveSession, except?: Conn) {
    for (const c of s.conns) if (c !== except) this.send(c, { type: "state", state: s.state, audioConnId: s.audioConnId, serverNow: Date.now() });
  }

  private broadcastMarker(s: LiveSession) {
    const payload = { type: "marker", marker: s.state.marker, markerSource: s.state.markerSource, playback: s.state.playback, seq: s.state.seq, serverNow: Date.now() };
    for (const c of s.conns) this.send(c, payload);
  }

  private schedulePersist(s: LiveSession) {
    if (s.persistTimer) return;
    s.persistTimer = setTimeout(() => {
      s.persistTimer = undefined;
      const { participants: _p, ...rest } = s.state;
      this.db.prepare("update rehearsal_sessions set state = ? where id = ?").run(JSON.stringify({ ...rest, participants: [] }), s.state.sessionId);
    }, 1000);
  }

  private send(conn: Conn, payload: Record<string, unknown>) {
    if (conn.ws.readyState === WebSocket.OPEN) conn.ws.send(JSON.stringify(payload));
  }
}

function clampNum(v: unknown, lo: number, hi: number, d: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return d;
  return Math.max(lo, Math.min(hi, n));
}

export function initialRehearsalState(opts: {
  sessionId: string;
  productionId: string;
  versionNumber: number;
  name: string;
  leaderId: string;
  leaderName: string;
}): RehearsalState {
  return {
    sessionId: opts.sessionId,
    productionId: opts.productionId,
    versionNumber: opts.versionNumber,
    name: opts.name,
    leaderId: opts.leaderId,
    leaderName: opts.leaderName,
    audioDevice: "No device is producing sound",
    marker: { m: 0, q: 0, occ: 1 },
    markerSource: "manual",
    playback: { state: "stopped", pos: { m: 0, q: 0, occ: 1 }, perfQ: 0, qPerSec: 0, tempoFactor: 1, sentAt: Date.now() },
    loop: null,
    participants: [],
    seq: 0,
    endedAt: null,
  };
}
