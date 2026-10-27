import { useCallback, useEffect, useRef, useState } from "react";
import type { LoopRange, MusicalPos, RehearsalState } from "../../shared/types";
import type { Performance } from "../../shared/timeline";

export type Connection = "connecting" | "live" | "reconnecting" | "offline" | "forbidden";

export interface Notice {
  kind: string;
  versionNumber?: number;
  summary?: string;
  publishedBy?: string;
  productionId: string;
  at: number;
}

const STALE_MS = 6000;
const PING_MS = 2000;
const MAX_EXTRAPOLATE_S = 1.2;

function wsUrl() {
  return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
}

/**
 * Connects to a rehearsal session (or, without a session, only listens for production notices).
 * Connection state is derived from actual traffic: if nothing arrives for a few seconds the
 * session is no longer presented as live.
 */
export function useRehearsal(opts: { sessionId?: string; productionIds: string[]; enabled: boolean }) {
  const { sessionId, enabled } = opts;
  const prodKey = opts.productionIds.join(",");
  const [connection, setConnection] = useState<Connection>("connecting");
  const [state, setState] = useState<RehearsalState | null>(null);
  const [connId, setConnId] = useState<string | null>(null);
  const [audioConnId, setAudioConnId] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const offsetRef = useRef(0); // serverNow - Date.now()
  const lastMsgRef = useRef(0);
  const stateRef = useRef<RehearsalState | null>(null);
  const markerRecvRef = useRef(0);
  stateRef.current = state;

  useEffect(() => {
    if (!enabled) return;
    let closed = false;
    let retry = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;

    const connect = () => {
      setConnection((c) => (c === "live" ? "reconnecting" : c === "forbidden" ? c : retry ? "reconnecting" : "connecting"));
      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;
      ws.onopen = () => {
        retry = 0;
        lastMsgRef.current = Date.now();
        if (prodKey) ws.send(JSON.stringify({ type: "subscribe", productionIds: prodKey.split(",") }));
        if (sessionId) ws.send(JSON.stringify({ type: "join", sessionId }));
        else setConnection("live");
      };
      ws.onmessage = (ev) => {
        lastMsgRef.current = Date.now();
        const msg = JSON.parse(ev.data);
        if (typeof msg.serverNow === "number" && msg.type !== "pong") offsetRef.current = offsetRef.current * 0.8 + (msg.serverNow - Date.now()) * 0.2;
        switch (msg.type) {
          case "pong":
            offsetRef.current = msg.serverNow - (Date.now() + Number(msg.t)) / 2;
            break;
          case "welcome":
            setConnId(msg.connId);
            setAudioConnId(msg.audioConnId ?? null);
            setState(msg.state);
            markerRecvRef.current = Date.now();
            setConnection("live");
            break;
          case "state":
            setAudioConnId(msg.audioConnId ?? null);
            setState(msg.state);
            markerRecvRef.current = Date.now();
            break;
          case "marker":
            markerRecvRef.current = Date.now();
            setState((s) => (s ? { ...s, marker: msg.marker, markerSource: msg.markerSource, playback: msg.playback, seq: msg.seq } : s));
            break;
          case "notice":
            setNotices((n) => [...n, { ...msg, at: Date.now() }]);
            break;
          case "error":
            if (msg.code === "forbidden") {
              setConnection("forbidden");
              closed = true;
              ws.close();
            }
            setLastError(msg.message);
            break;
        }
      };
      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
        if (closed) return;
        setConnection("reconnecting");
        retry++;
        retryTimer = setTimeout(connect, Math.min(8000, 500 * 2 ** Math.min(retry, 4)));
        if (retry > 3) setConnection("offline");
      };
      ws.onerror = () => ws.close();
    };
    connect();

    pingTimer = setInterval(() => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping", t: Date.now() }));
      if (lastMsgRef.current && Date.now() - lastMsgRef.current > STALE_MS) {
        // nothing heard: treat as disconnected and reconnect
        setConnection((c) => (c === "forbidden" ? c : "reconnecting"));
        ws?.close();
      }
    }, PING_MS);

    return () => {
      closed = true;
      clearTimeout(retryTimer);
      clearInterval(pingTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, sessionId, prodKey]);

  const send = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const setMarker = useCallback((pos: MusicalPos) => send({ type: "marker", pos }), [send]);
  const reportPlayback = useCallback(
    (s: "playing" | "paused" | "stopped", pos: MusicalPos, tempoFactor: number, qPerSec: number) => send({ type: "playback", state: s, pos, tempoFactor, qPerSec }),
    [send],
  );
  const setLoop = useCallback((loop: LoopRange | null) => send({ type: "loop", loop }), [send]);
  const transfer = useCallback((toUserId: string) => send({ type: "transfer", toUserId }), [send]);
  const claim = useCallback(() => send({ type: "claim" }), [send]);

  /** The shared position on this client's copy of the pinned version's timeline, extrapolated briefly while the leader plays. */
  const markerQ = useCallback((perf: Performance): { q: number; moving: boolean } | null => {
    const s = stateRef.current;
    if (!s) return null;
    const base = perf.toPerfQ(s.marker);
    const pb = s.playback;
    if (pb.state !== "playing" || !pb.qPerSec) return { q: base, moving: false };
    const serverNow = Date.now() + offsetRef.current;
    const dt = Math.min(MAX_EXTRAPOLATE_S, Math.max(0, (serverNow - pb.sentAt) / 1000));
    return { q: Math.min(perf.totalQ, base + pb.qPerSec * dt), moving: true };
  }, []);

  const isLive = connection === "live" && Date.now() - lastMsgRef.current < STALE_MS;

  return {
    connection,
    isLive,
    state,
    connId,
    audioConnId,
    notices,
    lastError,
    clearError: () => setLastError(null),
    dismissNotice: (at: number) => setNotices((n) => n.filter((x) => x.at !== at)),
    setMarker,
    reportPlayback,
    setLoop,
    transfer,
    claim,
    markerQ,
  };
}

export type RehearsalHandle = ReturnType<typeof useRehearsal>;
