/**
 * Independent practice in a real browser with the real synthesiser (headless Chromium, no speakers).
 * Audio is verified by measuring the synthesised signal with Web Audio analysers.
 */
import { expect, test } from "@playwright/test";
import { openTab, channelLevel, choosePassage, engineState, masterLevel, setTempo, tapMeasure, userPage, voiceCount, waitWorkspace } from "./helpers";

const AUDIBLE = 0.0003; // a soft vocal line on the dry channel output is around 0.001–0.01
const SILENT = 0.00003;

test("each part can be muted or soloed independently, and what is shown is independent of what is heard", async ({ browser }) => {
  const { page, errors } = await userPage(browser, "sofia");
  await page.goto("/practice/cp-fx-terzetto-alba");
  await waitWorkspace(page);
  // channels come from the explicit mapping: piano 0, baritone 2, soprano 4, tenor 5
  const ch = { piano: 0, baritone: 2, soprano: 4, tenor: 5 };

  // loop the terzetto (m. 13–15), where all four parts sound
  await page.getByTestId("select-bars").click();
  await tapMeasure(page, 12);
  await tapMeasure(page, 14);
  await page.getByTestId("loop-selection").click();
  await page.getByTestId("play").click();
  await page.waitForTimeout(800);

  const levels = async () => {
    const out: Record<string, number> = {};
    for (const [k, c] of Object.entries(ch)) out[k] = await channelLevel(page, c, 600);
    return out;
  };
  const all = await levels();
  for (const k of Object.keys(ch)) expect(all[k], `${k} audible`).toBeGreaterThan(AUDIBLE);

  await openTab(page, "mixer");
  await page.getByTestId("mute-tenor").click();
  await page.waitForTimeout(150);
  const muted = await levels();
  expect(muted.tenor).toBeLessThan(SILENT);
  for (const k of ["piano", "baritone", "soprano"]) expect(muted[k], `${k} still audible`).toBeGreaterThan(AUDIBLE);

  await page.getByTestId("solo-soprano").click();
  await page.waitForTimeout(150);
  const solo = await levels();
  expect(solo.soprano).toBeGreaterThan(AUDIBLE);
  for (const k of ["piano", "baritone", "tenor"]) expect(solo[k], `${k} silent under solo`).toBeLessThan(SILENT);

  // show only Clara's line: the other parts stay audible when un-soloed
  await page.getByTestId("solo-soprano").click();
  await page.getByTestId("mute-tenor").click();
  await page.getByRole("button", { name: "Clara only" }).click();
  await page.waitForFunction(() => (window as unknown as { __cp: { layout: () => { systems: unknown[] } } }).__cp.layout().systems.length > 0);
  await page.waitForTimeout(300);
  const hidden = await levels();
  for (const k of Object.keys(ch)) expect(hidden[k], `${k} audible while hidden`).toBeGreaterThan(AUDIBLE);
  await expect(page.getByTestId("mix-tenor")).toContainText("hidden in score");

  await page.getByTestId("pause").click();
  expect(errors).toEqual([]);
  test.info().annotations.push({ type: "levels", description: JSON.stringify({ all, muted, solo, hidden }) });
});

test("tempo changes keep pitch and keep every part on one clock", async ({ browser }) => {
  const { page } = await userPage(browser, "sofia");
  await page.goto("/practice/cp-fx-terzetto-alba");
  await waitWorkspace(page);

  // measure the tenor's held B♭3 (m. 6) at 100% and at 50%
  await openTab(page, "mixer");
  await page.getByTestId("solo-tenor").click();
  await page.getByTestId("select-bars").click();
  await tapMeasure(page, 5);
  await page.getByTestId("loop-selection").click();

  const peakHz = () =>
    page.evaluate(async () => {
      const port = (window as unknown as { __cpPort: { channelAnalyser: (c: number) => AnalyserNode; ctx: AudioContext } }).__cpPort;
      const an = port.channelAnalyser(5);
      an.fftSize = 32768;
      an.smoothingTimeConstant = 0;
      await new Promise((r) => setTimeout(r, 400));
      const data = new Float32Array(an.frequencyBinCount);
      an.getFloatFrequencyData(data);
      const hz = (i: number) => (i * port.ctx.sampleRate) / an.fftSize;
      let best = 0;
      for (let i = 1; i < data.length; i++) if (hz(i) > 80 && hz(i) < 1200 && data[i] > data[best]) best = i;
      return hz(best);
    });

  await page.getByTestId("play").click();
  await page.waitForTimeout(250);
  const atFull = await peakHz();
  await page.getByTestId("pause").click();
  await setTempo(page, 50);
  await page.getByTestId("play").click();
  await page.waitForTimeout(500);
  const atHalf = await peakHz();
  await page.getByTestId("pause").click();
  // B♭3 = 233.08 Hz (or its octave if the piano sample's 2nd harmonic dominates); same pitch at both tempos
  expect(Math.abs(atFull - atHalf)).toBeLessThan(2);
  expect([233.08, 466.16].some((f) => Math.abs(atFull - f) < 3)).toBe(true);

  // synchronisation through a live tempo change: all parts at one musical position start together
  await page.getByTestId("solo-tenor").click();
  await page.getByTestId("loop").click(); // loop off
  await setTempo(page, 100);
  await choosePassage(page, "Clara: Resta");
  await page.evaluate(() => ((window as unknown as { __cpEngine: { log: unknown[] } }).__cpEngine.log = []));
  await page.getByTestId("play").click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Slower" }).click();
  await page.getByRole("button", { name: "Slower" }).click();
  await page.getByRole("button", { name: "Slower" }).click();
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: "Faster" }).click();
  await page.waitForTimeout(1500);
  await page.getByTestId("pause").click();
  const sync = await page.evaluate(() => {
    const log = (window as unknown as { __cpEngine: { log: { kind: string; q: number; time: number; part: string }[] } }).__cpEngine.log;
    const byQ = new Map<string, Set<string>>();
    const parts = new Map<string, Set<string>>();
    for (const e of log.filter((x) => x.kind === "on")) {
      const k = e.q.toFixed(4);
      (byQ.get(k) ?? byQ.set(k, new Set()).get(k)!).add(e.time.toFixed(6));
      (parts.get(k) ?? parts.set(k, new Set()).get(k)!).add(e.part);
    }
    const multi = [...byQ.entries()].filter(([k]) => parts.get(k)!.size > 1);
    return { positions: byQ.size, multiPart: multi.length, mismatched: multi.filter(([, t]) => t.size > 1).length };
  });
  expect(sync.multiPart).toBeGreaterThan(5);
  expect(sync.mismatched).toBe(0);
  test.info().annotations.push({ type: "pitch", description: `100%: ${atFull.toFixed(2)} Hz, 50%: ${atHalf.toFixed(2)} Hz` });
  test.info().annotations.push({ type: "sync", description: JSON.stringify(sync) });
});

test("the highlight follows audible playback", async ({ browser }) => {
  const { page } = await userPage(browser, "sofia");
  await page.goto("/practice/cp-fx-aria-lume");
  await waitWorkspace(page);
  await page.evaluate(() => ((window as unknown as { __cpEngine: { log: unknown[] } }).__cpEngine.log = []));
  await page.getByTestId("play").click();
  const samples: { ok: boolean; q: number; last: number; next: number; inBox: boolean }[] = [];
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(450);
    samples.push(
      await page.evaluate(() => {
        const w = window as unknown as {
          __cpEngine: { displayQ: () => number; log: { kind: string; q: number; time: number }[] };
          __cpPort: { outputTime: () => number };
          __cp: { perf: { locate: (q: number) => { m: number } }; layout: () => { measures: Map<number, { x: number; w: number }> } };
        };
        const t = w.__cpPort.outputTime();
        const q = w.__cpEngine.displayQ();
        const ons = w.__cpEngine.log.filter((e) => e.kind === "on");
        const last = Math.max(-1, ...ons.filter((e) => e.time <= t).map((e) => e.q));
        const nextCandidates = ons.filter((e) => e.time > t).map((e) => e.q);
        const next = nextCandidates.length ? Math.min(...nextCandidates) : Infinity;
        const cursor = document.querySelector(".ov-cursor") as HTMLElement;
        const x = Number(/translate\(([\d.-]+)px/.exec(cursor.style.transform)?.[1]);
        const box = w.__cp.layout().measures.get(w.__cp.perf.locate(q).m)!;
        return { ok: last <= q + 1e-6 && q <= next + 1e-6, q, last, next, inBox: x >= box.x - 2 && x <= box.x + box.w + 2 };
      }),
    );
  }
  await page.getByTestId("pause").click();
  for (const s of samples) {
    expect(s.ok, JSON.stringify(s)).toBe(true);
    expect(s.inBox, JSON.stringify(s)).toBe(true);
  }
  expect(samples[samples.length - 1].q).toBeGreaterThan(samples[0].q);
});

test("stop, seek and loops leave no stuck notes", async ({ browser }) => {
  const { page } = await userPage(browser, "sofia");
  await page.goto("/practice/cp-fx-aria-lume");
  await waitWorkspace(page);

  await choosePassage(page, "Lume di sera / Vento d'aprile (A), 1st time");
  await page.getByTestId("play").click();
  await page.waitForTimeout(2200);
  expect(await voiceCount(page)).toBeGreaterThan(0);
  await page.getByTestId("stop").click();
  await page.waitForTimeout(800);
  expect(await voiceCount(page)).toBe(0);
  expect(await masterLevel(page)).toBeLessThan(SILENT);

  // seek while playing, then pause
  await page.getByTestId("play").click();
  await page.waitForTimeout(1500);
  await choosePassage(page, "Ah! non tardare");
  await page.waitForTimeout(1500);
  expect((await engineState(page)).state).toBe("playing");
  await page.getByTestId("pause").click();
  await page.waitForTimeout(800);
  expect(await voiceCount(page)).toBe(0);

  // a two-bar loop played through several wraps: voices stay bounded and stop cleanly
  await page.getByTestId("select-bars").click();
  await tapMeasure(page, 18);
  await tapMeasure(page, 19);
  await page.getByTestId("loop-selection").click();
  await setTempo(page, 150);
  await page.getByTestId("play").click();
  let maxVoices = 0;
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(400);
    maxVoices = Math.max(maxVoices, await voiceCount(page));
  }
  const st = await engineState(page);
  expect(st.state).toBe("playing");
  expect(maxVoices).toBeLessThan(24);
  await page.getByTestId("stop").click();
  await page.waitForTimeout(900);
  expect(await voiceCount(page)).toBe(0);
  expect(await masterLevel(page)).toBeLessThan(SILENT);
  test.info().annotations.push({ type: "loop", description: `max voices during loop: ${maxVoices}` });
});

test("language content matches the selected phrase, with honest missing assets", async ({ browser }) => {
  const { page } = await userPage(browser, "sofia");
  await page.goto("/practice/cp-fx-aria-lume");
  await waitWorkspace(page);
  await openTab(page, "language");

  await choosePassage(page, "(A), 1st time");
  await expect(page.getByTestId("phrase")).toHaveAttribute("data-phrase-id", "clara-a1-v1");
  await choosePassage(page, "(A), 2nd time");
  await expect(page.getByTestId("phrase")).toHaveAttribute("data-phrase-id", "clara-a1-v2");
  await expect(page.getByTestId("phrase")).toContainText("Vento d'aprile");
  await choosePassage(page, "Ah! non tardare");
  await expect(page.getByTestId("phrase")).toHaveAttribute("data-phrase-id", "clara-b");
  await expect(page.getByTestId("phrase")).toContainText("don't delay");

  // while singing, the highlighted word is the one on the sounding note
  await choosePassage(page, "(A), 1st time");
  await page.getByTestId("play").click();
  await expect(page.getByTestId("word-now").first()).toContainText(/Lume|di|sera/, { timeout: 8000 });
  await page.getByTestId("pause").click();

  // spoken placeholder audio is served and labelled as a placeholder
  const audio = page.waitForResponse((r) => r.url().includes("/audio/clara-a1-v1") && r.status() < 400);
  await page.getByRole("button", { name: "Hear spoken" }).click();
  await audio;
  await expect(page.getByTestId("phrase")).toContainText("Placeholder machine voice");

  // ensemble: another role's phrase, simultaneous texts, and a missing recording shown honestly
  await page.goto("/practice/cp-fx-terzetto-alba");
  await waitWorkspace(page);
  await page.getByLabel("Selected role").selectOption("tenor");
  await openTab(page, "language");
  await choosePassage(page, "Terzetto: Addio");
  await expect(page.getByTestId("phrase")).toHaveAttribute("data-phrase-id", "davide-3");
  await expect(page.getByText("Spoken pronunciation has not been prepared for this phrase yet.")).toBeVisible();
  await expect(page.getByText(/Sung at the same time by Clara and Ettore/)).toBeVisible();
});

test("private notes persist and stay private", async ({ browser }) => {
  const { page } = await userPage(browser, "sofia");
  await page.goto("/practice/cp-fx-aria-lume");
  await waitWorkspace(page);
  await tapMeasure(page, 7);
  await openTab(page, "notes");
  const text = `Breathe early before “scendi” ${Date.now()}`;
  await page.getByTestId("note-input").fill(text);
  await page.getByTestId("note-save").click();
  await expect(page.getByTestId("note-item").filter({ hasText: text })).toBeVisible();

  await page.reload();
  await waitWorkspace(page);
  await openTab(page, "notes");
  await expect(page.getByTestId("note-item").filter({ hasText: text })).toContainText("m. 8");
  await expect(page.locator(".ov-note")).toHaveCount(1);

  const elena = await userPage(browser, "elena");
  await elena.page.goto("/practice/cp-fx-aria-lume");
  await waitWorkspace(elena.page);
  await openTab(elena.page, "notes");
  await expect(elena.page.getByText(text)).toHaveCount(0);
  await expect(elena.page.locator(".ov-note")).toHaveCount(0);
});
