import { readFileSync } from "node:fs";
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
          if (words) return `words-${words[1]}`;
          if (/voicepacks\//.test(id)) return "voicedata";
          return undefined;
        },
        entryFileNames: "assets/app-[hash:8].js", chunkFileNames: "assets/[name]-[hash:8].js", assetFileNames: (a) => ((a.names?.[0] ?? a.name ?? "").endsWith(".musicxml") ? "assets/[name]-[hash:8].xml" : "assets/[name]-[hash:8][extname]") },
    },
  },
});
