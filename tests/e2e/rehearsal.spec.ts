/**
 * Shared rehearsal between an accompanist (Marco, landscape, full vocal score) and a singer
 * (Sofia, portrait, her own line only). Two independent browser sessions.
 */
import { expect, test, type Page, type WebSocketRoute } from "@playwright/test";
import { locationNumber, openTab, productionId, tapMeasure, userPage, waitWorkspace } from "./helpers";

async function markerPlacement(page: Page, m: number) {
  return page.evaluate((m) => {
    const w = window as unknown as {
      __cp: { layout: () => { measures: Map<number, { x: number; w: number }>; systemOf: (m: number) => { top: number } | undefined } };
    };
    const el = document.querySelector(".ov-marker") as HTMLElement;
    const match = /translate\(([\d.-]+)px, ([\d.-]+)px\)/.exec(el.style.transform);
    const box = w.__cp.layout().measures.get(m)!;
    const sys = w.__cp.layout().systemOf(m)!;
    const x = Number(match?.[1]);
    const y = Number(match?.[2]) + 22;
    return { visible: el.style.display !== "none", x, y, boxX: box.x, boxW: box.w, sysTop: sys.top, inside: x >= box.x - 2 && x <= box.x + box.w + 2 && Math.abs(y - sys.top) < 1 };
  }, m);
}

test("singer and accompanist share one musical position across different layouts", async ({ browser, playwright }) => {
  test.setTimeout(240_000);
  const marco = await userPage(browser, "marco");
  const sofia = await userPage(browser, "sofia", { width: 820, height: 1180 });

  // Sofia's realtime connection runs through a switchable relay so we can drop her network.
  let networkDown = false;
  const relays: { client: WebSocketRoute; server: WebSocketRoute }[] = [];
  await sofia.page.routeWebSocket("**/ws", (client) => {
    if (networkDown) {
      client.close();
      return;
    }
    const server = client.connectToServer();
    client.onMessage((m) => !networkDown && server.send(m));
    server.onMessage((m) => !networkDown && client.send(m));
    relays.push({ client, server });
  });

  const pid = await productionId(marco.page);
  let sessionUrl = "";

  await test.step("accompanist starts a rehearsal on version 1; the singer joins from her library", async () => {
    await marco.page.goto(`/p/${pid}`);
    await marco.page.locator("form").filter({ hasText: "Start rehearsal" }).getByLabel("Version").selectOption({ label: "Version 1" });
    await marco.page.getByRole("button", { name: "Start rehearsal" }).click();
    await marco.page.waitForURL(/\/rehearsal\//);
    sessionUrl = new URL(marco.page.url()).pathname;
    await waitWorkspace(marco.page);
    await sofia.page.goto("/");
    await sofia.page.getByRole("link", { name: "Join rehearsal" }).first().click();
    await sofia.page.waitForURL(/\/rehearsal\//);
    await waitWorkspace(sofia.page);
    await expect(sofia.page.getByTestId("connection")).toHaveText(/^Live$/);
    await expect(marco.page.getByTestId("connection")).toHaveText(/^Live$/);
    await expect(sofia.page.getByTestId("leader")).toContainText("Marco");
    await expect(sofia.page.getByTestId("play")).toBeDisabled();
  });

  await test.step("the two clients really have different layouts", async () => {
    const lay = (p: Page) =>
      p.evaluate(() => {
        const l = (window as unknown as { __cp: { layout: () => { systems: unknown[]; measures: Map<number, { x: number; top: number }> } } }).__cp.layout();
        return { systems: l.systems.length, m9x: Math.round(l.measures.get(8)!.x), m9top: Math.round(l.measures.get(8)!.top) };
      });
    const a = await lay(marco.page);
    const b = await lay(sofia.page);
    expect(a).not.toEqual(b);
    test.info().annotations.push({ type: "layouts", description: `Marco ${JSON.stringify(a)} / Sofia ${JSON.stringify(b)}` });
  });

  await test.step("the leader taps m. 9; the singer's marker lands on m. 9 in her own layout", async () => {
    await tapMeasure(marco.page, 8);
    await expect(sofia.page.getByTestId("loc-number")).toHaveText("9");
    await expect.poll(async () => (await markerPlacement(sofia.page, 8)).inside).toBe(true);
    await expect(sofia.page.getByTestId("marker-desc")).toContainText("m. 9, beat 1");
  });

  await test.step("when the leader plays the accompaniment, the shared marker follows playback", async () => {
    await marco.page.getByTestId("play").click();
    await marco.page.waitForTimeout(2500);
    const diffs: number[] = [];
    for (let i = 0; i < 5; i++) {
      const [mq, sq] = await Promise.all([
        marco.page.evaluate(() => (window as unknown as { __cpEngine: { displayQ: () => number } }).__cpEngine.displayQ()),
        sofia.page.evaluate(() => (window as unknown as { __cp: { markerQ: () => { q: number } } }).__cp.markerQ().q),
      ]);
      diffs.push(Math.abs(mq - sq));
      await marco.page.waitForTimeout(300);
    }
    await expect(sofia.page.locator(".marker-label")).toContainText("playing");
    expect(Number(await locationNumber(sofia.page))).toBeGreaterThanOrEqual(10);
    await marco.page.getByTestId("pause").click();
    // followers are close to the leader's audible position (well within a beat)
    expect(Math.max(...diffs)).toBeLessThan(0.75);
    test.info().annotations.push({ type: "follow lag (quarters)", description: diffs.map((d) => d.toFixed(3)).join(", ") });
  });

  await test.step("the singer browses independently and returns to the rehearsal position", async () => {
    const shared = await locationNumber(sofia.page);
    await tapMeasure(sofia.page, 16);
    await expect(sofia.page.getByTestId("loc-number")).toHaveText("17");
    await expect(sofia.page.getByTestId("back-float")).toBeVisible();
    await expect(marco.page.getByTestId("loc-number")).toHaveText(shared); // the leader is unaffected
    await sofia.page.getByTestId("back-float").click();
    await expect(sofia.page.getByTestId("loc-number")).toHaveText(shared);
    await expect(sofia.page.getByTestId("back-float")).toHaveCount(0);
    // scrolling away by hand also detaches; the panel button returns
    const sc = (await sofia.page.locator(".score-scroll").boundingBox())!;
    await sofia.page.mouse.move(sc.x + sc.width / 2, sc.y + sc.height / 2);
    await sofia.page.mouse.wheel(0, 900);
    await expect(sofia.page.getByTestId("back-float")).toBeVisible();
    await openTab(sofia.page, "rehearsal");
    await sofia.page.getByTestId("back-to-rehearsal").click();
    await expect(sofia.page.getByTestId("follow-toggle")).toBeChecked();
  });

  await test.step("the leader sets a loop for everyone", async () => {
    await marco.page.getByTestId("select-bars").click();
    await tapMeasure(marco.page, 4);
    await tapMeasure(marco.page, 5);
    await marco.page.getByRole("button", { name: "Loop for everyone" }).click();
    await expect(sofia.page.locator(".facts")).toContainText("m. 5–6");
    await expect.poll(() => sofia.page.locator(".ov-loop").count()).toBeGreaterThan(0);
    await expect(sofia.page.getByTestId("loop")).toBeDisabled();
  });

  await test.step("a disconnected singer is not shown a live position, and recovers", async () => {
    networkDown = true;
    for (const r of relays) r.server.close();
    await expect(marco.page.locator(".participants")).toContainText(/Sofia Marin.*not connected/, { timeout: 15_000 });
    await expect(sofia.page.getByTestId("conn-strip")).toContainText(/not live/i, { timeout: 15_000 });
    await expect(sofia.page.locator(".ov-marker")).toHaveAttribute("data-live", "false");
    await expect(sofia.page.getByTestId("location")).toHaveClass(/stale/);
    await tapMeasure(marco.page, 1); // the leader keeps working meanwhile
    networkDown = false;
    await expect(sofia.page.getByTestId("connection")).toHaveText(/^Live$/, { timeout: 30_000 });
    await expect(sofia.page.getByTestId("loc-number")).toHaveText("2"); // caught up with the move made while offline
    await expect(marco.page.locator(".participants")).toContainText(/Sofia Marin.*connected/);
  });

  await test.step("a release during the session is announced but does not change it", async () => {
    const elena = await playwright.request.newContext({ baseURL: "http://localhost:3100" });
    expect((await elena.post("/api/auth/login", { data: { username: "elena", password: "counterpart-demo" } })).ok()).toBe(true);
    const draft = await (await elena.get(`/api/productions/${pid}`)).json();
    if (!draft.draft.cuts.some((c: { startM: number }) => c.startM === 12))
      expect((await elena.post(`/api/productions/${pid}/cuts`, { data: { startM: 12, endM: 15 } })).ok()).toBe(true);
    const pub = await elena.post(`/api/productions/${pid}/publish`, { data: { summary: "Cut the più mosso, m. 13–16" } });
    expect(pub.ok()).toBe(true);
    const n = (await pub.json()).number;
    for (const p of [marco.page, sofia.page]) {
      await expect(p.getByTestId("version-notice")).toContainText(`Version ${n} has been published`);
      await expect(p.getByTestId("version-notice")).toContainText("This rehearsal stays on version 1");
      expect(await p.evaluate(() => (window as unknown as { __cp: { perf: { measures: unknown[] } } }).__cp.perf.measures.length)).toBe(28);
    }
    await elena.dispose();
  });

  await test.step("control passes from accompanist to singer", async () => {
    await openTab(marco.page, "rehearsal");
    const sofiaId = await sofia.page.evaluate(async () => (await (await fetch("/api/auth/me")).json()).user.id);
    await marco.page.getByTestId(`handover-${sofiaId}`).click();
    await expect(sofia.page.getByTestId("play")).toBeEnabled();
    await expect(marco.page.getByTestId("play")).toBeDisabled();
    await expect(marco.page.locator(".t-status")).toContainText("Sofia Marin’s device");
    await tapMeasure(sofia.page, 16);
    await expect(marco.page.getByTestId("loc-number")).toHaveText("17");
  });

  expect(marco.errors).toEqual([]);
  expect(sofia.errors).toEqual([]);
  await marco.page.waitForTimeout(1200); // let the follower's smooth auto-scroll settle
  await marco.page.screenshot({ path: "test-results/rehearsal-accompanist.png" });
  await sofia.page.screenshot({ path: "test-results/rehearsal-singer.png" });
  test.info().annotations.push({ type: "session", description: sessionUrl });
});
