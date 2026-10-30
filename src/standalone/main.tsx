import { createRoot } from "react-dom/client";
import { setPortFactory } from "../audio/usePlayback";
import { SamplerPort } from "../audio/samplerPort";
import "./ds.css";
import "./app.css";
import { App } from "./App";

// The practice app accompanies on a sampled grand piano (Noct-Salamander, from the Salamander Grand Piano V3; CC BY 3.0).
setPortFactory((onProgress) => SamplerPort.create(onProgress));

createRoot(document.getElementById("root")!).render(<App />);
