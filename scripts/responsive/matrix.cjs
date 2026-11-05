/**
 * Device matrix for the practice app: every main screen on phones and iPads, upright and rotated, with automatic
 * layout checks and a screenshot of each. Run against a local build:
 *   node scripts/responsive/matrix.cjs [baseUrl] [outDir] [only-device-substring] [only-screen-substring]
 * Writes outDir/report.json and outDir/<screen>__<device>.png; exits 1 when a check fails.
 */
const path = require("path");
const fs = require("fs");
const { chromium } = require(process.env.PW || "playwright");

const BASE = process.argv[2] || "http://localhost:8811";
const OUT = process.argv[3] || "/tmp/responsive";
const ONLY_DEV = process.argv[4] || "";
const ONLY_SCR = process.argv[5] || "";
fs.mkdirSync(OUT, { recursive: true });

const PHONE = { isMobile: true, hasTouch: true };
const TABLET = { isMobile: true, hasTouch: true };
const DEVICES = [
  ["iphone-se", 375, 667, PHONE],
  ["iphone-se-rot", 667, 375, PHONE],
  ["iphone-15", 393, 852, PHONE],
  ["iphone-15-rot", 852, 393, PHONE],
  ["android", 412, 915, PHONE],
  ["android-rot", 915, 412, PHONE],
  ["ipad-mini", 744, 1133, TABLET],
  ["ipad-mini-rot", 1133, 744, TABLET],
  ["ipad-air", 820, 1180, TABLET],
  ["ipad-air-rot", 1180, 820, TABLET],
  ["ipad-pro-13", 1024, 1366, TABLET],
  ["ipad-pro-13-rot", 1366, 1024, TABLET],
  ["laptop", 1440, 900, { isMobile: false, hasTouch: false }],
];

const ROLES = [{ opera: "figaro", character: "figaro" }, { opera: "boheme", character: "mimi" }];
const piece = (pc) => ({ screen: "piece", opera: "figaro", character: "figaro", piece: pc });
// [name, place, action after load]
const SCREENS = [
  ["welcome", null, null],
  ["home", { screen: "home" }, null],
  ["search", { screen: "explore", by: "opera" }, null],
  ["opera", { screen: "opera", opera: "figaro" }, null],
  ["role", { screen: "role", opera: "figaro", character: "figaro" }, null],
  ["role-noart", { screen: "role", opera: "boheme", character: "mimi" }, null],
  ["settings", { screen: "profile" }, null],
  ["menu", { screen: "home" }, "menu"],
  ["practice", piece(0), null],
  ["practice-open", piece(0), "openbar"],
  ["practice-page", piece(0), "page"],
  ["practice-words", piece(0), "words"],
  ["practice-tempo", piece(0), "tempo"],
  ["practice-notes", piece(0), "notes"],
  ["practice-playing", piece(0), "play"],
  ["listen", { screen: "listen", opera: "figaro", edition: "mozart-figaro-sinfonia" }, null],
];

async function setup(page, place) {
  await page.goto(BASE + "/");
  await page.evaluate(
    ([place, roles]) => {
      localStorage.clear();
      localStorage.setItem("cp:guide3", "1");
      if (place) {
        localStorage.setItem("cp:onboarded", "true");
        localStorage.setItem("cp:myRoles", JSON.stringify(roles));
        localStorage.setItem("cp:last", JSON.stringify({ screen: "piece", opera: "figaro", character: "figaro", piece: 2 }));
        localStorage.setItem("cp:place", JSON.stringify(place));
      }
    },
    [place, ROLES],
  );
  await page.reload();
  await page.waitForLoadState("load");
  await page.waitForTimeout(place && place.screen === "piece" ? 3500 : place && place.screen === "listen" ? 3500 : 1200);
  // a first-visit tip, if any, out of the way
  await page.getByRole("button", { name: /^(Not now|Got it|Close)$/ }).first().click({ timeout: 500 }).catch(() => {});
}

const click = (page, sel) => page.locator(sel).first().evaluate((e) => e.click());
async function act(page, a) {
  if (!a) return;
  if (a === "menu") {
    const b = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu"], .menu-btn').first();
    if (await b.isVisible().catch(() => false)) await b.click();
  } else if (a === "openbar") {
    const b = page.locator(".bar-more");
    if (await b.isVisible().catch(() => false)) await b.click();
  } else if (a === "page") await click(page, '.view-switch button:has-text("Page"), button[aria-label*="Page" i]');
  else if (a === "words") await click(page, '.view-switch button:has-text("Words"), button[aria-label="Words"]');
  else if (a === "tempo") {
    const chip = page.locator(".tl-speed-chip");
    if (await chip.isVisible().catch(() => false)) await chip.click();
    else await page.locator('.cp-speed [aria-label="Slower"]').first().click();
  } else if (a === "notes") await click(page, ".notes-btn");
  else if (a === "play") {
    await page.waitForSelector('[data-testid="play"]:not([disabled])', { timeout: 30000, state: "attached" }).catch(() => {});
    await click(page, '[data-testid="play"]');
    await page.waitForTimeout(2500);
  }
  await page.waitForTimeout(700);
}

/** layout checks in the page; returns a list of problems */
function inspect(screen) {
  const W = innerWidth, H = innerHeight;
  const out = [];
  const vis = (e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    const cs = getComputedStyle(e);
    if (cs.visibility === "hidden" || cs.opacity === "0") return null;
    for (let p = e; p; p = p.parentElement) if (getComputedStyle(p).display === "none") return null;
    return r;
  };
  const scrollerX = (e) => {
    for (let p = e.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if ((o === "auto" || o === "scroll" || o === "hidden") && p.scrollWidth > p.clientWidth + 1) return p;
    }
    return null;
  };
  const name = (e) => (e.getAttribute("aria-label") || e.textContent || e.className || e.tagName).toString().trim().replace(/\s+/g, " ").slice(0, 40);
  // 1. the page scrolls sideways
  const sw = document.documentElement.scrollWidth;
  if (sw > W + 1) out.push({ kind: "page-wider-than-screen", detail: `${sw}px on ${W}px` });
  // 2. controls past the screen's edges (not inside a strip meant to scroll)
  const ctrls = [...document.querySelectorAll('button, a[href], input, select, [role="button"], [role="tab"]')];
  for (const e of ctrls) {
    const r = vis(e);
    if (!r) continue;
    if (scrollerX(e) || e.closest('[inert], [aria-hidden="true"]')) continue;
    // wholly off the screen is a closed drawer or a strip parked aside; partly off is cut off
    if (r.right <= 0 || r.left >= W) continue;
    if (r.right > W + 1 || r.left < -1) out.push({ kind: "control-off-screen-x", detail: `${name(e)} ${Math.round(r.left)}–${Math.round(r.right)}` });
  }
  // 3. fixed or sticky controls past the bottom/top (they cannot be scrolled to)
  for (const e of ctrls) {
    const r = vis(e);
    if (!r || r.right <= 0 || r.left >= W || e.closest('[inert], [aria-hidden="true"]')) continue;
    let fixed = false;
    for (let p = e; p; p = p.parentElement) {
      const pos = getComputedStyle(p).position;
      if (pos === "fixed" || pos === "sticky") { fixed = true; break; }
    }
    const inApp = e.closest(".practice") && !e.closest(".p-stage, .words-view, .score-scroll, .p-drawer, .mix-pop");
    if ((fixed || inApp) && (r.bottom > H + 1 || r.top < -1)) out.push({ kind: "control-off-screen-y", detail: `${name(e)} ${Math.round(r.top)}–${Math.round(r.bottom)}` });
  }
  // 4. tap targets too small for a finger (touch devices)
  if (matchMedia("(pointer: coarse)").matches) {
    let small = [];
    for (const e of ctrls) {
      const r = vis(e);
      if (!r || r.right <= 0 || r.left >= W || r.bottom <= 0 || r.top >= H || e.closest('[inert], [aria-hidden="true"]')) continue;
      if (e.closest("p, li > span, .story, .legal, .credits, .about-copy")) continue; // links inside running text
      const after = getComputedStyle(e, "::after");
      const grow = after.content !== "none" && after.position === "absolute" ? Math.max(0, -parseFloat(after.top) || 0) * 2 : 0;
      if (r.width < 32 || r.height + grow < 32) small.push(`${name(e)} ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    if (small.length) out.push({ kind: "small-tap-target", detail: small.slice(0, 8).join(" | ") + (small.length > 8 ? ` (+${small.length - 8})` : "") });
  }
  // 5. controls covering each other (siblings that overlap by more than a third)
  const rs = ctrls.map((e) => [e, vis(e)]).filter(([e, r]) => r && r.bottom > 0 && r.top < H && !scrollerX(e));
  const hits = [];
  for (let i = 0; i < rs.length; i++)
    for (let j = i + 1; j < rs.length; j++) {
      const [a, ra] = rs[i], [b, rb] = rs[j];
      if (a.contains(b) || b.contains(a)) continue;
      // a layer meant to float over scrolling content (sticky tip, fixed bar) is not a clash
      const layer = (e) => { for (let p = e; p; p = p.parentElement) { const ps = getComputedStyle(p).position; if (ps === "sticky" || ps === "fixed") return p; } return null; };
      if (layer(a) !== layer(b)) continue;
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (w <= 2 || h <= 2) continue;
      const small = Math.min(ra.width * ra.height, rb.width * rb.height);
      if ((w * h) / small > 0.34) {
        // the one on top is the one a tap reaches; if neither covers the other at the overlap's centre, ignore
        const cx = Math.max(ra.left, rb.left) + w / 2, cy = Math.max(ra.top, rb.top) + h / 2;
        const top = document.elementFromPoint(cx, cy);
        if (top && (a.contains(top) || b.contains(top))) hits.push(`${name(a)} × ${name(b)}`);
      }
    }
  if (hits.length) out.push({ kind: "controls-overlap", detail: hits.slice(0, 6).join(" | ") });
  // 6. text cut off without an ellipsis
  const cut = [];
  for (const e of document.querySelectorAll("h1, h2, h3, p, span, b, button, a, li, div")) {
    if (e.children.length > 3) continue;
    const r = vis(e);
    if (!r || !e.textContent.trim()) continue;
    const cs = getComputedStyle(e);
    if (cs.overflowX !== "hidden" && cs.overflow !== "hidden") continue;
    if (cs.textOverflow === "ellipsis" || cs.webkitLineClamp !== "none" && cs.webkitLineClamp) continue;
    if (e.scrollWidth > e.clientWidth + 3 && cs.whiteSpace !== "normal") cut.push(`${name(e)} (${e.scrollWidth}>${e.clientWidth})`);
  }
  if (cut.length) out.push({ kind: "text-cut", detail: cut.slice(0, 6).join(" | ") });
  // 7. the practice screen keeps a usable score and its transport
  if (document.querySelector(".practice")) {
    const stage = [...document.querySelectorAll(".words-view, .p-stage")].find((e) => vis(e));
    const sr = stage && vis(stage);
    const visibleH = sr ? Math.min(sr.bottom, H) - Math.max(sr.top, 0) : 0;
    if (visibleH < 140) out.push({ kind: "score-area-too-small", detail: `${Math.round(visibleH)}px of music on screen` });
    const play = document.querySelector('[data-testid="play"], [data-testid="pause"]');
    const pr = play && vis(play);
    if (!pr) out.push({ kind: "no-play-button", detail: "" });
    else if (pr.bottom > H + 1) out.push({ kind: "play-button-off-screen", detail: `${Math.round(pr.bottom)} > ${H}` });
    // the drawn score fills its box's width (a stale width after rotating leaves a gap or a crop)
    const svg = document.querySelector(".score-scroll svg");
    const host = document.querySelector(".score-scroll");
    if (svg && host && screen.includes("page")) {
      const a = svg.getBoundingClientRect().width, b = host.clientWidth;
      if (a > b + 40) out.push({ kind: "score-wider-than-box", detail: `${Math.round(a)} > ${b}` });
      if (a < b * 0.6) out.push({ kind: "score-narrower-than-box", detail: `${Math.round(a)} < ${b}` });
    }
  }
  return out;
}

(async () => {
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const report = [];
  for (const [dev, w, h, opts] of DEVICES) {
    if (ONLY_DEV && !dev.includes(ONLY_DEV)) continue;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, ...opts });
    for (const [scr, place, action] of SCREENS) {
      if (ONLY_SCR && !scr.includes(ONLY_SCR)) continue;
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
      try {
        await setup(page, place);
        await act(page, action);
        const problems = await page.evaluate(inspect, scr);
        for (const e of errors) problems.push({ kind: "script-error", detail: e });
        await page.screenshot({ path: path.join(OUT, `${scr}__${dev}.png`) });
        report.push({ device: dev, w, h, screen: scr, problems });
        process.stdout.write(problems.length ? "x" : ".");
      } catch (e) {
        report.push({ device: dev, w, h, screen: scr, problems: [{ kind: "run-failed", detail: String(e).slice(0, 200) }] });
        process.stdout.write("!");
      }
      await page.close();
    }
    // rotation while using it: open practice upright, start playing, turn the device, check, turn it back
    if (!ONLY_SCR || "rotate".includes(ONLY_SCR)) {
      const page = await ctx.newPage();
      try {
        await setup(page, piece(0));
        await click(page, '[data-testid="play"]').catch(() => {});
        await page.waitForTimeout(1200);
        for (const [tag, vw, vh] of [["turned", h, w], ["back", w, h]]) {
          await page.setViewportSize({ width: vw, height: vh });
          await page.waitForTimeout(1500);
          const problems = await page.evaluate(inspect, "rotate");
          const playing = await page.locator('[data-testid="pause"]').count();
          if (!playing) problems.push({ kind: "stopped-on-rotate", detail: "" });
          await page.screenshot({ path: path.join(OUT, `rotate-${tag}__${dev}.png`) });
          report.push({ device: dev, w: vw, h: vh, screen: `rotate-${tag}`, problems });
          process.stdout.write(problems.length ? "x" : ".");
        }
      } catch (e) {
        report.push({ device: dev, w, h, screen: "rotate", problems: [{ kind: "run-failed", detail: String(e).slice(0, 200) }] });
      }
      await page.close();
    }
    await ctx.close();
    process.stdout.write(` ${dev}\n`);
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
  const bad = report.filter((r) => r.problems.length);
  const kinds = {};
  for (const r of bad) for (const p of r.problems) (kinds[p.kind] ??= []).push(`${r.screen}@${r.device}`);
  console.log(`\n${report.length - bad.length}/${report.length} clean`);
  for (const [k, v] of Object.entries(kinds)) console.log(`  ${k}: ${v.length} — ${v.slice(0, 10).join(", ")}${v.length > 10 ? " …" : ""}`);
  process.exit(bad.length ? 1 : 0);
})();
