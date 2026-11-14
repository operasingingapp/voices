/**
 * An instrumental number (an overture) with its score: no one sings it, so this is the practice screen's music and
 * playback without the words, the parts or the voice. You hear it and follow the line; tap a bar to start there.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Performance, beatInfo } from "../../shared/timeline";
import { usePlayback } from "../audio/usePlayback";
import { useLocalSetting, useTicker } from "../hooks";
import { ScoreView, stripCrop, type CursorReading, type MarkerReading } from "../score/ScoreView";
import type { ScoreLayout } from "../score/layout";
import { pieceData } from "./pieces";
import { grandPianoGain, grandPianoMap, grandPianoUrl } from "./grandPiano";
import { MAX_FACTOR, MIN_FACTOR, stepFactor } from "./metronome";
import { BeatNote, CROP_PAD, Icon, MAX_ZOOM, STANDARD_LINE_H, fmtTime } from "./Practice";

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
  // the recorded concert grand, where the piece has one (the app's piano fills in until it has loaded)
  const [pianoSound] = useLocalSetting<"grand" | "app">("p:pianoSound", "grand");
  const grandUrl = grandPianoUrl(editionId);
  const pianoCh = parts.find((p) => p.kind === "piano")?.channel;
  useEffect(() => {
    const port = pb.port;
    if (!port?.setRecording || pianoCh === undefined) return;
    if (pianoSound === "grand" && grandUrl) {
      port.keepRecordings?.([pianoCh]);
      port.setRecording(pianoCh, [{ tempo: 1, url: grandUrl, map: grandPianoMap(edition, perf), gainDb: grandPianoGain(editionId), exact: true }]).then(() => port.setInstrument?.(pianoCh, "singer")).catch(() => undefined);
    } else {
      port.setInstrument?.(pianoCh, "piano");
      port.keepRecordings?.([]);
    }
    return () => port.keepRecordings?.([]);
  }, [pb.port, perf, pianoSound, grandUrl]);
  const q = useTicker(() => Math.round((engine ? engine.displayQ() : 0) * 16) / 16, 80);

  const cursorRef = useRef<() => CursorReading | null>(() => null);
  cursorRef.current = () => (engine ? { q: engine.displayQ(), show: true, playing: engine.state === "playing", label: playing ? "Playing" : "You are here" } : null);
  const markerRef = useRef<() => MarkerReading | null>(() => null);

  // one line scrolling sideways, or the page (systems one under another): the same choice as on the practice screen
  const [pageView, setPageView] = useLocalSetting("p:pageView", false);
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
  // a piano reduction reads best at the size of a printed page: the line stays near it however tall the screen is
  const phone = typeof window !== "undefined" && window.innerWidth < 700;
  const roomCap = phone ? 0.62 : 0.8;
  const fitZoom = pageView ? (phone ? 0.5 : 0.68) : Math.max(0.5, Math.min(MAX_ZOOM, roomCap, Math.floor(fit * 40) / 40));
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
  const printedBpm = Math.round(perf.bpmAt(q) / shownQ);
  const asPrinted = Math.abs(tf - 1) < 1e-3;
  // − and + step along a metronome's marks, from the passage you are in; the whole piece moves in proportion
  const slower = () => engine?.setTempoFactor(stepFactor(perf.bpmAt(q) / shownQ, tf, -1));
  const faster = () => engine?.setTempoFactor(stepFactor(perf.bpmAt(q) / shownQ, tf, 1));
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
        <div className="cp-seg view-switch layout-switch" role="group" aria-label="How the music is laid out">
          <button type="button" aria-pressed={!pageView} onClick={() => setPageView(false)} title="One line, scrolling sideways">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M2.5 8.5h14M2.5 12h14M2.5 15.5h14" />
              <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18.5 8.5 22 12l-3.5 3.5" />
            </svg>
            <span className="label">Line</span>
          </button>
          <button type="button" aria-pressed={pageView} onClick={() => setPageView(true)} title="Page: systems one under another, scrolling down">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4.5" y="2.5" width="15" height="19" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M8 7.5h8M8 10h8M8 14.5h8M8 17h8" />
            </svg>
            <span className="label">Page</span>
          </button>
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
          strip={!pageView}
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
            <div className="cp-speed" role="group" aria-label="Tempo">
              <button type="button" className="cp-icon-btn" aria-label="Slower" onClick={slower} disabled={tf <= MIN_FACTOR + 1e-3}>
                {Icon.minus}
              </button>
              <button
                type="button"
                className={`cp-tempo__value${asPrinted ? "" : " changed"}`}
                data-testid="tempo"
                onClick={() => engine?.setTempoFactor(1)}
                aria-disabled={asPrinted}
                aria-label={asPrinted ? `Tempo ${beatBpm} beats a minute, as printed` : `Tempo ${beatBpm} beats a minute. Back to the printed ${printedBpm}`}
                title={asPrinted ? "As printed" : `Back to the printed ${beatSymbol} = ${printedBpm}`}
              >
                <BeatNote symbol={beatSymbol} />
                <span className="cp-eq">=</span>
                <b>{beatBpm}</b>
              </button>
              <button type="button" className="cp-icon-btn" aria-label="Faster" onClick={faster} disabled={tf >= MAX_FACTOR - 1e-3}>
                {Icon.plus}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
