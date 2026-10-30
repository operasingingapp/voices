import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { PlaybackEngine, type SynthPort } from "./engine";
import type { Performance } from "../../shared/timeline";
import type { PlaybackPart } from "../../shared/types";

/** What the practice screens need from a sound source, beyond the engine's SynthPort. */
export interface AudioPort extends SynthPort {
  readonly masterAnalyser: AnalyserNode;
  /** call from a user gesture: browsers only start audio after one */
  resume(): Promise<void>;
  configureParts(parts: PlaybackPart[]): void;
  /** play a channel on another instrument (when the sound source has others); resolves once it is ready */
  setInstrument?(channel: number, id: string, range?: [number, number]): Promise<void>;
  /** recordings of a channel's line (one per tempo rendered), sung when its instrument is "singer"; resolves once it can play */
  setRecording?(channel: number, recs: { tempo: number; url: string; map: { perf: number[]; audio: number[] } }[] | null): Promise<void>;
  /** the piece's notes, at the velocity they will sound: lets a sampled instrument load what the piece uses */
  prepare?(notes: { midi: number; vel: number }[]): void;
}

type PortFactory = (onProgress: (msg: string) => void) => Promise<AudioPort>;
let portFactory: PortFactory | null = null;
let portPromise: Promise<AudioPort> | null = null;
let progressListeners = new Set<(m: string) => void>();

/** Each app chooses its instrument once, at start-up (the full app: SoundFont synth; the standalone app: sampled piano). */
export function setPortFactory(f: PortFactory) {
  portFactory = f;
}

/** One audio device per page load; the AudioContext is resumed on the first user gesture. */
export function getPort(): Promise<AudioPort> {
  if (!portPromise) {
    if (!portFactory) return Promise.reject(new Error("no instrument was set up"));
    portPromise = portFactory((m) => progressListeners.forEach((l) => l(m))).catch((e) => {
      portPromise = null;
      throw e;
    });
  }
  return portPromise;
}

/**
 * A timer that keeps ticking in background tabs (worker timers are not throttled like page timers).
 * Some pages may not start workers (a Content Security Policy blocks them, often without throwing),
 * and then nothing would ever schedule the notes: if the worker has not ticked within a moment,
 * an ordinary page timer takes over.
 */
function startTicker(fn: () => void, ms: number): () => void {
  let fallback: ReturnType<typeof setInterval> | null = null;
  let heard = false;
  const useFallback = () => {
    if (!fallback && !heard) fallback = setInterval(fn, ms);
  };
  let w: Worker | null = null;
  try {
    const src = `let id=null;onmessage=e=>{if(e.data==='stop'){clearInterval(id);close();}else{id=setInterval(()=>postMessage(0),${ms});}}`;
    w = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
    w.onmessage = () => {
      heard = true;
      if (!fallback) fn();
    };
    w.onerror = useFallback;
    w.postMessage("start");
  } catch {
    useFallback();
  }
  const watchdog = setTimeout(useFallback, 250);
  return () => {
    clearTimeout(watchdog);
    if (fallback) clearInterval(fallback);
    try {
      w?.postMessage("stop");
    } catch {
      /* already gone */
    }
  };
}

export interface PlaybackHandle {
  engine: PlaybackEngine | null;
  port: AudioPort | null;
  status: "loading" | "ready" | "error";
  progress: string;
  error: string | null;
  version: number; // bumps on every engine change
}

export function usePlayback(perf: Performance | null, parts: PlaybackPart[] | undefined): PlaybackHandle {
  const [port, setPort] = useState<AudioPort | null>(null);
  const [status, setStatus] = useState<PlaybackHandle["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("Loading the piano");
  const [version, bump] = useReducer((x: number) => x + 1, 0);
  const engineRef = useRef<PlaybackEngine | null>(null);

  useEffect(() => {
    let alive = true;
    const l = (m: string) => alive && setProgress(m);
    progressListeners.add(l);
    let settled = false;
    // never leave "Loading the piano…" up forever: say so if the synthesiser does not come up
    const slow = setTimeout(() => {
      if (!alive || settled) return;
      setStatus("error");
      setError("The piano did not start on this page. Reload to try again; the words and the score still work.");
    }, 45000);
    getPort()
      .then((p) => {
        settled = true;
        if (!alive) return;
        setPort(p);
        setError(null);
        setStatus("ready");
      })
      .catch((e: Error) => {
        settled = true;
        if (!alive) return;
        setStatus("error");
        setError(`Audio could not start: ${e.message}. The score still works; playback needs a browser with Web Audio.`);
      });
    return () => {
      alive = false;
      clearTimeout(slow);
      progressListeners.delete(l);
    };
  }, []);

  const engine = useMemo(() => {
    if (!port) return null;
    const e = new PlaybackEngine(port);
    if ((window as unknown as { __cpTest?: boolean }).__cpTest) e.log = [];
    return e;
  }, [port]);
  engineRef.current = engine;

  useEffect(() => {
    if (!engine) return;
    const unsub = engine.subscribe(bump);
    const stop = startTicker(() => engine.tick(), 25);
    (window as unknown as { __cpEngine?: PlaybackEngine; __cpPort?: AudioPort }).__cpEngine = engine;
    (window as unknown as { __cpPort?: AudioPort }).__cpPort = port!;
    return () => {
      engine.stop();
      unsub();
      stop();
    };
  }, [engine, port]);

  useEffect(() => {
    if (!engine || !perf || !parts || !port) return;
    port.configureParts(parts);
    const scale = new Map(parts.map((p) => [p.key, p.velocityScale ?? 1]));
    port.prepare?.(perf.notes.map((n) => ({ midi: n.midi, vel: Math.max(1, Math.min(127, Math.round(n.vel * (scale.get(n.part) ?? 1)))) })));
    engine.setPerformance(perf, parts);
  }, [engine, perf, parts, port]);

  return { engine, port, status, progress, error, version };
}

// Avoid stale listeners across hot reloads.
if (import.meta.hot) import.meta.hot.dispose(() => (progressListeners = new Set()));
