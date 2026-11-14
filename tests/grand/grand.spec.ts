/**
 * The grand piano starts within about a second of pressing play, before most of its chunks have arrived, and the
 * recording put together in the browser (Chromium's own AAC decoder) is the master, to the sample.
 *
 * Needs a standalone build (dist-standalone) and the fixtures (scripts/audio/grand-fixture.py); skipped without
 * them. The page is served locally; the chunks come over a simulated 4 Mbit/s link with 80 ms of latency per request
 * (shared by all requests), and only once play has been pressed, so the time measured includes fetching them.
 */
import { createServer, type Server } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../..");
const DIST = join(ROOT, "dist-standalone");
const FIX = join(HERE, "fixtures");
const ready = existsSync(join(DIST, "standalone.html")) && existsSync(join(FIX, "info.json"));
const info = ready ? (JSON.parse(readFileSync(join(FIX, "info.json"), "utf8")) as { eid: string; samples: number; chunks: number; v2Bytes: number; v1Bytes: number }) : null;

const BYTES_PER_MS = 4_000_000 / 8 / 1000; // 4 Mbit/s
const LATENCY = 80;
const TYPES: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".xml": "application/xml", ".sf2": "application/octet-stream", ".woff2": "font/woff2" };

let server: Server;
let port = 0;
let gate: Promise<void> = Promise.resolve();
let open: () => void = () => undefined;
let linkFree = 0;
const served: { path: string; at: number }[] = [];
const closeGate = () => (gate = new Promise((r) => (open = r)));

test.skip(!ready, "needs dist-standalone and tests/grand/fixtures (scripts/audio/grand-fixture.py)");

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const path = decodeURIComponent((req.url ?? "/").split("?")[0]);
    const grand = path.startsWith("/grand/");
    const base = grand ? FIX : DIST;
    const rel = grand ? path.slice("/grand/".length) : path === "/" ? "standalone.html" : path.slice(1);
    const file = normalize(join(base, rel));
    if (!file.startsWith(base) || !existsSync(file) || !statSync(file).isFile()) return void res.writeHead(404).end();
    const body = readFileSync(file);
    if (grand) {
      await gate;
      // a shared link: each response waits for the ones before it to have gone through
      const now = Date.now();
      const start = Math.max(now + LATENCY, linkFree);
      linkFree = start + body.length / BYTES_PER_MS;
      await new Promise((r) => setTimeout(r, linkFree - now));
      served.push({ path: rel, at: Date.now() });
    }
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "Content-Length": body.length, "Cache-Control": "no-store" });
    res.end(body);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  port = (server.address() as { port: number }).port;
});
test.afterAll(() => new Promise<void>((r) => (server ? server.close(() => r()) : r())));

type State = { ch: number; url: string; firstSound: { ms: number; chunks: number } | null; chunks: { n: number; loaded: number[]; arrivals: { i: number; ms: number }[] } | null; cover: [number, number][] };
const singers = () => (globalThis as unknown as { __svPort?: { singerState(): State[] } }).__svPort?.singerState() ?? [];

test("the grand piano plays within a second, before its chunks are all in, and is the master to the sample", async ({ page }) => {
  const { eid, chunks } = info!;
  await page.addInitScript(([e]) => {
    (window as unknown as { __SV_GRAND_BASE__: string }).__SV_GRAND_BASE__ = "/grand/piano/";
    if (!sessionStorage.getItem("seeded")) {
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("cp:onboarded", "true");
      localStorage.setItem("cp:pieceList", "3");
      localStorage.setItem("cp:place", JSON.stringify({ screen: "listen", opera: "boheme", edition: e }));
      localStorage.setItem("cp:p:pianoSound", JSON.stringify("grand"));
    }
  }, [eid]);
  closeGate();
  await page.goto(`http://127.0.0.1:${port}/`);
  const play = page.getByTestId("play");
  await expect(play).toBeEnabled({ timeout: 60_000 });
  // nothing of the recording has come yet: press play, and let the chunks start flowing
  expect(served.length).toBe(0);
  const t0 = await page.evaluate(() => performance.now());
  await play.click();
  open();
  await page.waitForFunction(() => (globalThis as unknown as { __svPort?: { singerState(): State[] } }).__svPort?.singerState().some((s) => s.firstSound), null, { timeout: 30_000 });
  const st = (await page.evaluate(singers))[0];
  const ttfs = st.firstSound!.ms - t0;
  console.log(`time to first sound: ${Math.round(ttfs)} ms; chunks in by then: ${st.firstSound!.chunks} of ${chunks}; ` + `bytes: v2 ${info!.v2Bytes}, v1 ${info!.v1Bytes}`);
  expect(st.firstSound!.chunks).toBeLessThan(chunks);
  expect(ttfs).toBeLessThan(1500);
  // the chunks came in order, the first first
  expect(st.chunks!.arrivals[0].i).toBe(0);

  // everything in: the recording as put together equals the master (mixed to mono), to the sample
  await page.waitForFunction(() => (globalThis as unknown as { __svPort?: { singerState(): State[] } }).__svPort!.singerState()[0].chunks!.loaded.every((x) => x === 1), null, { timeout: 60_000 });
  const cmp = await page.evaluate(async () => {
    const port = (globalThis as unknown as { __svPort: { singerState(): { stitcher: { mono: Float32Array } }[] } }).__svPort;
    const y = port.singerState()[0].stitcher.mono;
    const ref = new Float32Array(await (await fetch("/grand/ref.f32")).arrayBuffer());
    const n = Math.min(ref.length, y.length);
    const snr = (lag: number, a: number, b: number) => {
      let s = 0;
      let e = 0;
      for (let i = Math.max(a, 64); i < Math.min(b, n - 64); i++) {
        s += ref[i] * ref[i];
        e += (ref[i] - y[i + lag]) ** 2;
      }
      return 10 * Math.log10(s / Math.max(e, 1e-20));
    };
    const lags = [-3, -2, -1, 0, 1, 2, 3].map((l) => ({ l, snr: snr(l, 0, n) }));
    // around every seam, as well as everywhere
    const seams = [];
    for (let i = 480000; i < n; i += 480000) seams.push(snr(0, i - 4800, i + 4800));
    return { lengthOk: y.length === ref.length, lags, seams };
  });
  console.log("SNR against the master by lag (dB):", cmp.lags.map((x) => `${x.l}:${x.snr.toFixed(1)}`).join(" "), "; at the seams:", cmp.seams.map((x) => x.toFixed(1)).join(" "));
  expect(cmp.lengthOk).toBe(true);
  const best = cmp.lags.reduce((a, b) => (b.snr > a.snr ? b : a));
  expect(best.l).toBe(0);
  expect(best.snr).toBeGreaterThan(20);
  for (const s of cmp.seams) expect(s).toBeGreaterThan(15);

  // what was scheduled to play covers the time from the first sound on without a gap
  const cover = (await page.evaluate(singers))[0].cover;
  for (let i = 1; i < cover.length; i++) expect(Math.abs(cover[i][0] - cover[i - 1][1])).toBeLessThan(0.002);

  // a second visit: the chunks come from the browser's cache, and play starts without the network
  await page.getByTestId("play").click(); // pause
  closeGate();
  const before = served.length;
  await page.reload();
  await expect(page.getByTestId("play")).toBeEnabled({ timeout: 60_000 });
  const t1 = await page.evaluate(() => performance.now());
  await page.getByTestId("play").click();
  await page.waitForFunction(() => (globalThis as unknown as { __svPort?: { singerState(): State[] } }).__svPort?.singerState().some((s) => s.firstSound), null, { timeout: 30_000 });
  const again = (await page.evaluate(singers))[0];
  console.log(`second visit, from the cache: first sound after ${Math.round(again.firstSound!.ms - t1)} ms`);
  expect(again.firstSound!.ms - t1).toBeLessThan(1500);
  expect(served.length).toBe(before); // nothing fetched (the gate is still closed)
  open();
});
