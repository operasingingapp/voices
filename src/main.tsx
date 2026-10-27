import { createRoot } from "react-dom/client";
import "@fontsource/charis-sil/400.css";
import "@fontsource/charis-sil/400-italic.css";
import "@fontsource/charis-sil/700.css";
import "@fontsource/atkinson-hyperlegible-next/400.css";
import "@fontsource/atkinson-hyperlegible-next/600.css";
import "@fontsource/atkinson-hyperlegible-next/700.css";
import "./styles.css";
import { App } from "./App";
import { setPortFactory } from "./audio/usePlayback";
import { SpessaPort } from "./audio/spessaPort";

// the full app plays every part through the General MIDI SoundFont synthesiser
setPortFactory((onProgress) => SpessaPort.create(onProgress));

createRoot(document.getElementById("root")!).render(<App />);
