import { readFileSync } from "node:fs";
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

/** Builds the server-free practice app (published as a claude.ai artifact). */
export default defineConfig({
  plugins: [patchSpessaProcessor(), react()],
  base: "./",
  build: {
    outDir: "dist-standalone",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 8000,
    // inline fonts as data URIs; keep JavaScript, the illustrations and the piano samples as separate
    // files, so they load in parallel and are cached on their own
    assetsInlineLimit: (file: string) => !/\.(js|webp|jpe?g|png|avif|mp3)$/.test(file),
    rollupOptions: {
      input: "standalone.html",
      output: { inlineDynamicImports: true, entryFileNames: "assets/app-[hash:8].js", assetFileNames: "assets/[name]-[hash:8][extname]" },
    },
  },
});
