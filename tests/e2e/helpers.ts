import { expect, type Browser, type Page } from "@playwright/test";

export const PASSWORD = "counterpart-demo";

export async function login(page: Page, user: string) {
  await page.goto("/login");
  await page.fill("input[autocomplete=username]", user);
  await page.fill("input[type=password]", PASSWORD);
  await page.click('button:has-text("Sign in")');
  await page.waitForSelector(".app-header");
}

export async function userPage(browser: Browser, user: string, viewport = { width: 1180, height: 820 }) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript(() => ((window as unknown as { __cpTest: boolean }).__cpTest = true));
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, user);
  return { ctx, page, errors };
}

/** Wait until the score is engraved, its layout index exists and the synthesiser is loaded. */
export async function waitWorkspace(page: Page) {
  await page.waitForFunction(() => {
    const w = window as unknown as { __cp?: { layout: () => { measures: Map<number, unknown> } | null }; __cpEngine?: unknown };
    return !!w.__cp?.layout?.() && w.__cp.layout()!.measures.size > 0 && !!w.__cpEngine;
  });
  await expect(page.getByTestId("play")).toBeVisible();
}

export async function productionId(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const r = await fetch("/api/library");
    const d = await r.json();
    return d.productions[0].id as string;
  });
}

/** Tap a notated measure (0-based index) in this client's own layout, like a finger on the score. */
export async function tapMeasure(page: Page, m: number, which: "first" | "middle" = "first") {
  const pt = await page.evaluate(
    ({ m, which }) => {
      const w = window as unknown as { __cp: { layout: () => { measures: Map<number, { x: number; w: number; top: number; bottom: number; entries: { x: number }[] }> } } };
      const b = w.__cp.layout().measures.get(m);
      if (!b) return null;
      const sc = document.querySelector(".score-scroll") as HTMLElement;
      const host = document.querySelector(".osmd-host") as HTMLElement;
      sc.style.scrollBehavior = "auto";
      sc.scrollTop = Math.max(0, b.top - 120);
      const r = host.getBoundingClientRect();
      const e = which === "first" ? b.entries[0] : b.entries[Math.floor(b.entries.length / 2)];
      return { x: r.left + (e?.x ?? b.x + b.w / 2) + 2, y: r.top + (b.top + b.bottom) / 2 };
    },
    { m, which },
  );
  if (!pt) throw new Error(`measure ${m} not in layout`);
  await page.mouse.click(pt.x, pt.y);
}

export async function locationNumber(page: Page): Promise<string> {
  return (await page.getByTestId("loc-number").textContent())!.trim();
}

/** Peak RMS of one MIDI channel's synthesised output over a window. */
export async function channelLevel(page: Page, channel: number, ms = 700): Promise<number> {
  return page.evaluate(
    async ({ channel, ms }) => {
      const port = (window as unknown as { __cpPort: { channelAnalyser: (c: number) => AnalyserNode } }).__cpPort;
      const an = port.channelAnalyser(channel);
      const buf = new Float32Array(an.fftSize);
      let peak = 0;
      const end = performance.now() + ms;
      while (performance.now() < end) {
        an.getFloatTimeDomainData(buf);
        let s = 0;
        for (const v of buf) s += v * v;
        peak = Math.max(peak, Math.sqrt(s / buf.length));
        await new Promise((r) => setTimeout(r, 40));
      }
      return peak;
    },
    { channel, ms },
  );
}

export async function masterLevel(page: Page, ms = 300): Promise<number> {
  return page.evaluate(async (ms) => {
    const an = (window as unknown as { __cpPort: { masterAnalyser: AnalyserNode } }).__cpPort.masterAnalyser;
    const buf = new Float32Array(an.fftSize);
    let peak = 0;
    const end = performance.now() + ms;
    while (performance.now() < end) {
      an.getFloatTimeDomainData(buf);
      let s = 0;
      for (const v of buf) s += v * v;
      peak = Math.max(peak, Math.sqrt(s / buf.length));
      await new Promise((r) => setTimeout(r, 30));
    }
    return peak;
  }, ms);
}

export async function voiceCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __cpPort: { voiceCount: () => number } }).__cpPort.voiceCount());
}

export async function choosePassage(page: Page, label: RegExp | string) {
  const sel = page.getByLabel("Go to passage");
  const options = await sel.locator("option").allTextContents();
  const idx = options.findIndex((o) => (typeof label === "string" ? o.includes(label) : label.test(o)));
  if (idx < 0) throw new Error(`passage ${label} not in ${options.join(" | ")}`);
  await sel.selectOption(String(idx));
}

export async function engineState(page: Page) {
  return page.evaluate(() => {
    const e = (window as unknown as { __cpEngine: { state: string; displayQ: () => number; tempo: number } }).__cpEngine;
    return { state: e.state, q: e.displayQ(), tempo: e.tempo };
  });
}

/** Move the tempo slider like a finger would (range inputs cannot be "filled"). */
export async function setTempo(page: Page, pct: number) {
  await page.getByLabel("Tempo, percent of the marked tempo").evaluate((el, v) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, String(v));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, pct);
  await expect(page.getByTestId("tempo")).toContainText(`${pct}%`);
}

/** Open a side-panel tab (clicking an already open tab would collapse the panel). */
export async function openTab(page: Page, key: string) {
  const tab = page.getByTestId(`tab-${key}`);
  if ((await tab.getAttribute("aria-selected")) !== "true") await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
}
