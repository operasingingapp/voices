import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { createRequire } from "node:module";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const PROCESSOR = "spessasynth_lib/dist/spessasynth_processor.min.js";

/**
 * The published page may run under a Content Security Policy that forbids WebAssembly. SpessaSynth's
 * AudioWorklet waits for its (optional) Ogg Vorbis decoder, which is WebAssembly, before it reports ready,
 * so without this the piano never starts. Our sound bank is plain SF2 and never needs that decoder:
 * let its start-up failure pass quietly. The patched processor is emitted as its own fingerprinted file.
 */
function patchSpessaProcessor(): Plugin {
  const ID = "\0spessa-processor-url";
  return {
    name: "patch-spessa-processor",
    apply: "build",
    enforce: "pre",
    resolveId(source) {
      return source === `${PROCESSOR}?url` ? ID : null;
    },
    load(id) {
      if (id !== ID) return null;
      const file = createRequire(import.meta.url).resolve(PROCESSOR);
      const code = readFileSync(file, "utf8");
      const pattern = /(static ready=\(async\(\)=>\{.*?WebAssembly\.instantiate\(.*?\}\)\(\))/s;
      if (!pattern.test(code)) this.error("SpessaSynth processor changed: the Vorbis decoder start-up could not be patched");
      const ref = this.emitFile({ type: "asset", name: "spessasynth_processor.min.js", source: code.replace(pattern, "$1.catch(()=>{})") });
      return `export default import.meta.ROLLUP_FILE_URL_${ref};`;
    },
  };
}


/**
 * A piece's score and data imported with "?z" arrive gzip-compressed and base64-encoded (inflated in the browser by
 * pieces.tsx). MusicXML and the compiled data compress about tenfold: without this the published app outgrew the
 * artifact's size limit as operas were added.
 */
function gzipData(): Plugin {
  return {
    name: "gzip-piece-data",
    enforce: "pre",
    load(id) {
      if (!id.endsWith("?z")) return null;
      const file = id.slice(0, -2);
      const b64 = gzipSync(readFileSync(file), { level: 9 }).toString("base64");
      return `export default ${JSON.stringify(b64)};`;
    },
  };
}

/** Builds the server-free practice app (published as a claude.ai artifact). */
/** Songs travel eight to a file, by composer (words-songs-schubert-3): one file per song would pass the published
 *  app's file limit as the song list grows, and a song's words, score and timings are small (about 40 kB). */
const SONG_BUNDLE = (() => {
  const ids = readdirSync(resolve(import.meta.dirname, "content/pieces")).filter((d) => d.startsWith("song-")).sort();
  const byComposer = new Map<string, string[]>();
  for (const id of ids) {
    const c = id.slice(5).split("-")[0];
    byComposer.set(c, [...(byComposer.get(c) ?? []), id]);
  }
  const out = new Map<string, string>();
  for (const [c, list] of byComposer) list.forEach((id, k) => out.set(id, `words-songs-${c}-${Math.floor(k / 8) + 1}`));
  return out;
})();

/** Opera numbers travel five to a file, by opera and in the opera's order (words-giovanni-3): one file per number
 *  passed the published app's file limit once the composer portraits were added. */
const OPERA_BUNDLE = (() => {
  const src = readFileSync(resolve(import.meta.dirname, "src/standalone/operas.ts"), "utf8");
  const starts = [...src.matchAll(/\n  "id": "([a-z0-9-]+)",\n  "title": "/g)];
  const out = new Map<string, string>();
  starts.forEach((m, i) => {
    const seg = src.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : src.length);
    const ids = [...new Set([...seg.matchAll(/"editionId": "([^"]+)"/g)].map((x) => x[1]))];
    ids.forEach((id, k) => out.has(id) || out.set(id, `words-${m[1]}-${Math.floor(k / 5) + 1}`));
  });
  return out;
})();

export default defineConfig({
  plugins: [gzipData(), patchSpessaProcessor(), react()],
  base: "./",
  build: {
    outDir: "dist-standalone",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 8000,
    // inline fonts as data URIs; keep JavaScript, the illustrations and the piano samples as separate
    // files, so they load in parallel and are cached on their own
    assetsInlineLimit: (file: string) => !/\.(js|webp|jpe?g|png|avif|mp3|mp4|musicxml|wav)$/.test(file),
    rollupOptions: {
      input: "standalone.html",
      output: {
        // each piece's data is its own small file (loaded when the piece opens); the voice packs' indexes stay together
        manualChunks(id: string) {
          // the dynamic-import helper in a file of its own: the score engine (7 MB) imports it, and taking it from
          // the app file gave the engine a new name (so a fresh download) whenever the app changed
          if (id.includes("vite/preload-helper")) return "preload";
          // a piece's words and its recorded voices' timings travel together, loaded when the piece opens
          // (one file per piece: its words, data, score and voice timings, so the published file count stays low as pieces are added)
          const words =
            /\/content\/pieces\/([^/]+)\/voice\/[^/]+\/manifest\.json$/.exec(id) ??
            /\/data\/content\/([^/]+)\/(?:language|edition)\.json(?:\?z)?$/.exec(id) ??
            /\/data\/content\/([^/]+)\/score\.musicxml\?(?:raw|z)$/.exec(id);
          if (words) return SONG_BUNDLE.get(words[1]) ?? OPERA_BUNDLE.get(words[1]) ?? `words-${words[1]}`;
          // the voice packs' index and the module that reads it, loaded together with the first recording asked for
          if (/voicepacks\/|\/voiceIndex\.ts$/.test(id)) return "voicedata";
          return undefined;
        },
        entryFileNames: "assets/app-[hash:8].js", chunkFileNames: "assets/[name]-[hash:8].js", assetFileNames: (a) => ((a.names?.[0] ?? a.name ?? "").endsWith(".musicxml") ? "assets/[name]-[hash:8].xml" : "assets/[name]-[hash:8][extname]") },
    },
  },
});
