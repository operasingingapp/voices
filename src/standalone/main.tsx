import { createRoot } from "react-dom/client";
import { setPortFactory } from "../audio/usePlayback";
import { SamplerPort, warmPiano } from "../audio/samplerPort";
import "./ds.css";
import "./app.css";
import "./premium.css";
import "./engraved.css";
import "./choral.css";
import { App } from "./App";
import { installStaleReload } from "./staleReload";

// a tab left open across a deploy reloads once if a file of its build is gone (instead of a piece that will not open)
installStaleReload();

// The practice app accompanies on a sampled grand piano (Noct-Salamander, from the Salamander Grand Piano V3; CC BY 3.0).
setPortFactory((onProgress) => SamplerPort.create(onProgress));

createRoot(document.getElementById("root")!).render(<App />);

// While Home or a role page is open, fetch what every piece needs (the piano's main layers, then the score
// engine, 7 MB), so tapping a piece draws and plays sooner. Nothing is fetched twice: a piece opened meanwhile
// waits for these same downloads.
const idle = (fn: () => void, ms: number) =>
  window.setTimeout(() => ("requestIdleCallback" in window ? window.requestIdleCallback(fn, { timeout: 4000 }) : fn()), ms);
window.addEventListener("load", () => {
  idle(() => warmPiano(), 800);
  // the engine, then (when the page is idle again) one tiny engraving, so the first real score is not the slow one
  idle(() => void import("../score/vrv").then((m) => m.warmVerovio()).catch(() => undefined), 1800);
});
