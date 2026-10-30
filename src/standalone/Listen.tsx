/**
 * An instrumental number (an overture) with its score: no one sings it, so this is the practice screen's music and
 * playback without the words, the parts or the voice. You hear it and follow the line; tap a bar to start there.
 */
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Performance, beatInfo } from "../../shared/timeline";
import { usePlayback } from "../audio/usePlayback";
import { useTicker } from "../hooks";
import { ScoreView, stripCrop, type CursorReading, type MarkerReading } from "../score/ScoreView";
import type { ScoreLayout } from "../score/layout";
import { pieceData } from "./pieces";
import { CROP_PAD, Icon, MAX_ZOOM, STANDARD_LINE_H, fmtTime } from "./Practice";

/** The score as drawn: the playback-only tempo number and the piano's pedal brackets stay off the line. */
function forDisplay(xml: string): string {
  try {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) return xml;
    for (const dir of Array.from(doc.getElementsByTagName("direction"))) {
      const types = Array.from(dir.children).filter((c) => c.nodeName === "direction-type");
      const only = (names: string[]) => types.length > 0 && types.every((dt) => Array.from(dt.children).every((c) => names.includes(c.nodeName)));
      if (only(["metronome", "pedal"])) dir.parentNode?.removeChild(dir);
    }
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return xml;
  }
}
const displayCache = new Map<string, string>();

export function Listen({ editionId, onBack, onOpera, operaTitle }: { editionId: string; onBack: () => void; onOpera: () => void; operaTitle: string }) {
  const d = useMemo(() => pieceData(editionId), [editionId]);
  const { edition, info } = d;
  if (!displayCache.has(editionId)) displayCache.set(editionId, forDisplay(d.scoreXml));
  const xml = displayCache.get(editionId)!;
  // played as written: steady, and no sustain pedal (an orchestra's quick, detached strings, reduced for piano)
  const perf = useMemo(() => new Performance(edition, [], { tempo: "steady", pedal: false }), [edition]);
  const parts = useMemo(() => edition.parts, [edition]);
  const pb = usePlayback(perf, parts);
  const engine = pb.engine;
  const playing = engine?.state === "playing";
  const q = useTicker(() => Math.round((engine ? engine.displayQ() : 0) * 16) / 16, 80);

  const cursorRef = useRef<() => CursorReading | null>(() => null);
  cursorRef.current = () => (engine ? { q: engine.displayQ(), show: true, playing: engine.state === "playing", label: playing ? "Playing" : "You are here" } : null);
  const markerRef = useRef<() => MarkerReading | null>(() => null);

  // the line of music fits the stage's height, as on the practice screen
  const stageRef = useRef<HTMLElement>(null);
  const [stageH, setStageH] = useState(0);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageH(el.clientHeight));
    ro.observe(el);
    setStageH(el.clientHeight);
    return () => ro.disconnect();
  }, []);
  const [natural, setNatural] = useState(0);
  // a piano line is lower than the standard sung line, so it may grow a little more; on a phone it stays small
  // enough to show a few bars
  const fit = natural && stageH ? (stageH - 24 - CROP_PAD) / Math.max(natural, STANDARD_LINE_H * 0.6) : Infinity;
  const roomCap = typeof window !== "undefined" && window.innerWidth < 700 ? 0.8 : 1.1;
  const fitZoom = Math.max(0.55, Math.min(MAX_ZOOM, roomCap, Math.floor(fit * 40) / 40));
  const heldZoom = useRef<number | null>(null);
  if (!playing) heldZoom.current = null;
  else if (heldZoom.current === null) heldZoom.current = fitZoom;
  const zoom = heldZoom.current ?? fitZoom;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const onLayout = (l: ScoreLayout) => {
    const c = stripCrop(l);
    if (!c) return;
    const n = (c.h - CROP_PAD) / zoomRef.current;
    setNatural((o) => (Math.abs(o - n) > 3 ? n : o));
  };

  const play = async () => {
    if (!engine || !pb.port) return;
    await pb.port.resume();
    engine.play();
  };
  const goTo = (pq: number) => engine?.seek(pq);
  const onTap = (pos: { m: number; q: number }) => {
    const pm = perf.occurrences(pos.m)[0];
    if (pm) goTo(pm.startQ + pos.q);
  };

  // where you are, and how fast
  const loc = perf.locate(q);
  const bi = beatInfo(edition.measures[loc.m].time);
  const shownQ = bi.unitQ === 2 ? 1 : bi.unitQ;
  const beatSymbol = shownQ === 1.5 ? "♩." : shownQ === 0.5 ? "♪" : "♩";
  const tf = engine?.tempo ?? 1;
  const beatBpm = Math.round((perf.bpmAt(q) / shownQ) * tf);
  const tempoPct = Math.round(tf * 100);
  const slower = () => engine?.setTempoFactor(Math.max(0.4, +(tf - 0.05).toFixed(2)));
  const faster = () => engine?.setTempoFactor(Math.min(1.5, +(tf + 0.05).toFixed(2)));
  const tempoWord = useMemo(() => {
    let cur = "";
    return edition.measures.map((m) => {
      for (const t of m.tempos) if (t.text) cur = t.text.trim();
      return cur;
    });
  }, [edition]);

  const total = perf.totalSec;
  const pct = Math.min(100, Math.max(0, (perf.qToSec(Math.max(0, q)) / total) * 100));
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const seekAt = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    goTo(perf.secToQ(Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * total));
  };
  const status = pb.status === "loading" ? pb.progress : pb.status === "error" ? pb.error : null;

  return (
    <div className="practice is-music listen" style={{ gridTemplateRows: "auto minmax(0, 1fr) auto auto" } as CSSProperties}>
      <header className="p-head gutter" style={{ gridRow: 1 }}>
        <button type="button" className="cp-icon-btn" onClick={onBack} aria-label={`Back to ${operaTitle}`}>
          {Icon.back}
        </button>
        <div className="p-title">
          <h1 lang="it">{edition.title}</h1>
          <p className="p-sub">
            <span className="p-kind">{info.kind} · piano · </span>
            <a href="#" className="p-sub-link" onClick={(e) => (e.preventDefault(), onOpera())} lang="it">
              <i>{info.opera}</i>
            </a>
          </p>
        </div>
      </header>

      <main className="p-stage" ref={stageRef} style={{ gridRow: 2 }}>
        <ScoreView
          xml={xml}
          edition={edition}
          perf={perf}
          visibleXmlParts={null}
          zoom={zoom}
          cursor={cursorRef}
          marker={markerRef}
          scrollTarget={playing ? "cursor" : "none"}
          loop={null}
          selection={null}
          cuts={[]}
          flags={[]}
          onTap={onTap}
          onUserScroll={() => undefined}
          onLayout={onLayout}
          strip
          ink="#0b0b0b"
          nowNoteParts={[parts[0].source.xmlPartId]}
        />
      </main>

      <div className="p-timeline gutter" style={{ gridRow: 3 }}>
        <div className="tl-label" data-testid="location">
          <b className="tl-bar">{status ?? `Bar ${loc.number}`}</b>
          <span>{tempoWord[loc.m] || " "}</span>
        </div>
        <div
          className="tl-track"
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={`Where you are in the ${info.kind.toLowerCase()}`}
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(perf.qToSec(q))}
          aria-valuetext={`Bar ${loc.number}`}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            seekAt(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && seekAt(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              goTo(perf.secToQ(Math.min(total, Math.max(0, perf.qToSec(q) + (e.key === "ArrowLeft" ? -5 : 5)))));
            }
          }}
        >
          <span className="tl-line" />
          <span className="tl-line done" style={{ width: `${pct}%` }} />
          <span className="tl-head" style={{ left: `${pct}%` }} />
        </div>
        <div className="tl-time">
          {fmtTime(perf.qToSec(q) / tf)} <span>/ {fmtTime(total / tf)}</span>
        </div>
      </div>

      <footer className="p-bar gutter" style={{ gridRow: 4 }}>
        <div className="bar-transport">
          <button
            type="button"
            className="cp-icon-btn bar-start"
            onClick={async () => {
              if (!engine) return;
              engine.seek(0);
              if (engine.state !== "playing") await play();
            }}
            disabled={pb.status !== "ready"}
            aria-label="Play from the start"
            title="From the start"
          >
            {Icon.fromStart}
          </button>
          <button type="button" className="cp-icon-btn bar-stop" onClick={() => engine?.stop()} aria-label="Stop and go back to the start" title="Stop">
            {Icon.stop}
          </button>
          {playing ? (
            <button type="button" className="cp-icon-btn cp-icon-btn--ink cp-icon-btn--stand" onClick={() => engine?.pause()} aria-label="Pause" data-testid="pause">
              {Icon.pause}
            </button>
          ) : (
            <button type="button" className="cp-icon-btn cp-icon-btn--ink cp-icon-btn--stand" onClick={play} disabled={pb.status !== "ready"} aria-label="Play" data-testid="play">
              {Icon.play}
            </button>
          )}
        </div>
        <div className="bar-right">
          <div className="cp-tempo">
            <span className="cp-tempo__beat" aria-label={`About ${beatBpm} beats a minute`}>
              <span className="cp-beat">{beatSymbol}</span> = {beatBpm}
            </span>
            <div className="cp-speed" role="group" aria-label="Speed">
              <button type="button" className="cp-icon-btn" aria-label="Slower" onClick={slower} disabled={tf <= 0.4 + 1e-3}>
                {Icon.minus}
              </button>
              <div className="cp-tempo__value" data-testid="tempo">
                <b>{tempoPct}%</b>
              </div>
              <button type="button" className="cp-icon-btn" aria-label="Faster" onClick={faster} disabled={tf >= 1.5 - 1e-3}>
                {Icon.plus}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
