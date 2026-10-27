import type { PlaybackEngine } from "../audio/engine";

export interface PassageEntry {
  key: string;
  label: string;
  startQ: number;
  endQ: number;
}

interface Props {
  engine: PlaybackEngine | null;
  audioStatus: "loading" | "ready" | "error";
  audioProgress: string;
  playDisabledReason: string | null;
  passages: PassageEntry[];
  currentPassage: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeekPassage: (idx: number) => void;
  tempo: number;
  baseBpm: number;
  onTempo: (f: number) => void;
  loopLabel: string | null;
  loopOn: boolean;
  onLoopToggle: () => void;
  loopDisabledReason: string | null;
  countIn: boolean;
  onCountIn: (v: boolean) => void;
  autoScroll: boolean;
  onAutoScroll: (v: boolean) => void;
  selectMode: boolean;
  onSelectMode: (v: boolean) => void;
}

export function Transport(p: Props) {
  const playing = p.engine?.state === "playing";
  const disabled = !p.engine || p.audioStatus !== "ready" || !!p.playDisabledReason;
  const pct = Math.round(p.tempo * 100);
  return (
    <footer className="transport" aria-label="Playback">
      <div className="t-group t-main">
        <button className="t-btn" onClick={() => p.onSeekPassage(p.currentPassage - 1)} disabled={!!p.playDisabledReason} aria-label="Previous passage" title="Previous passage">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M6 5v14M19 5l-10 7 10 7z" />
          </svg>
        </button>
        {playing ? (
          <button className="t-btn t-play on" onClick={p.onPause} aria-label="Pause" data-testid="pause">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          </button>
        ) : (
          <button className="t-btn t-play" onClick={p.onPlay} disabled={disabled} aria-label="Play" data-testid="play" title={p.playDisabledReason ?? undefined}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M7 4.5v15l12.5-7.5z" />
            </svg>
          </button>
        )}
        <button className="t-btn" onClick={p.onStop} disabled={!p.engine || !!p.playDisabledReason} aria-label="Stop" data-testid="stop">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>
        <button className="t-btn" onClick={() => p.onSeekPassage(p.currentPassage + 1)} disabled={!!p.playDisabledReason} aria-label="Next passage" title="Next passage">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M18 5v14M5 5l10 7-10 7z" />
          </svg>
        </button>
        <label className="t-passage">
          <span className="sr-only">Passage</span>
          <select value={p.currentPassage} onChange={(e) => p.onSeekPassage(Number(e.target.value))} disabled={!!p.playDisabledReason} aria-label="Go to passage">
            {p.passages.map((ps, i) => (
              <option key={ps.key} value={i}>
                {ps.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="t-group t-tempo">
        <button className="t-btn small" onClick={() => p.onTempo(Math.max(0.4, +(p.tempo - 0.05).toFixed(2)))} aria-label="Slower" disabled={!!p.playDisabledReason}>
          −
        </button>
        <label className="tempo-slider">
          <span className="tempo-readout" data-testid="tempo">
            {pct}%<span className="tempo-bpm"> ♩ ≈ {Math.round(p.baseBpm * p.tempo)}</span>
          </span>
          <input
            type="range"
            min={40}
            max={150}
            step={5}
            value={pct}
            onChange={(e) => p.onTempo(Number(e.target.value) / 100)}
            aria-label="Tempo, percent of the marked tempo"
            disabled={!!p.playDisabledReason}
          />
        </label>
        <button className="t-btn small" onClick={() => p.onTempo(Math.min(1.5, +(p.tempo + 0.05).toFixed(2)))} aria-label="Faster" disabled={!!p.playDisabledReason}>
          +
        </button>
      </div>

      <div className="t-group t-toggles">
        <button className="toggle" aria-pressed={p.loopOn} onClick={p.onLoopToggle} disabled={!!p.loopDisabledReason} title={p.loopDisabledReason ?? "Repeat a range of bars"} data-testid="loop">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M4 12a6 6 0 0 1 6-6h8m-3-3 3 3-3 3M20 12a6 6 0 0 1-6 6H6m3 3-3-3 3-3" />
          </svg>
          {p.loopOn && p.loopLabel ? p.loopLabel : "Loop"}
        </button>
        <button className="toggle" aria-pressed={p.countIn} onClick={() => p.onCountIn(!p.countIn)}>
          Count-in
        </button>
        <button className="toggle" aria-pressed={p.autoScroll} onClick={() => p.onAutoScroll(!p.autoScroll)}>
          Auto-scroll
        </button>
        <button className="toggle" aria-pressed={p.selectMode} onClick={() => p.onSelectMode(!p.selectMode)} data-testid="select-bars">
          Select bars
        </button>
      </div>
      {(p.audioStatus !== "ready" || p.playDisabledReason) && (
        <p className="t-status" role="status">
          {p.audioStatus === "loading" ? `${p.audioProgress}…` : p.audioStatus === "error" ? "Audio unavailable" : p.playDisabledReason}
        </p>
      )}
    </footer>
  );
}
