/**
 * Production workspace: an editor marks cuts and comments, publishes a numbered version,
 * performers practise it, and people outside the production are kept out.
 */
import { expect, test } from "@playwright/test";
import { choosePassage, openTab, productionId, setTempo, userPage, waitWorkspace } from "./helpers";

test("editor flags an unsupported cut, publishes a clean one, and every part skips it", async ({ browser }) => {
  test.setTimeout(180_000);
  const elena = await userPage(browser, "elena");
  const pid = await productionId(elena.page);
  await elena.page.goto(`/p/${pid}`);
  const draft = elena.page.locator(".prod-section.draft");
  const cutForm = draft.locator("form").first();

  await test.step("a cut across the repeat barline is flagged and blocks publishing", async () => {
    await cutForm.getByLabel("From").selectOption({ label: "m. 12" });
    await cutForm.getByLabel("To").selectOption({ label: "m. 13" });
    await expect(draft.locator(".issues").last()).toContainText("crosses the repeat");
    await cutForm.getByRole("button", { name: "Add cut" }).click();
    await expect(draft.locator(".cut-list li.flagged")).toContainText("Needs correction");
    await expect(draft.getByRole("button", { name: /Publish version/ })).toBeDisabled();
    await expect(draft).toContainText("needs editorial correction");
    // the problem is also filed as a correction request for the team
    await expect(elena.page.locator(".comment-list").last()).toContainText("needs editorial correction");
    await draft.locator(".cut-list li.flagged").getByRole("button", { name: "Remove cut" }).click();
    await expect(draft.locator(".cut-list > li")).toHaveCount(0);
  });

  await test.step("a clean cut and a shared comment are published as version 2", async () => {
    await cutForm.getByLabel("From").selectOption({ label: "m. 13" });
    await cutForm.getByLabel("To").selectOption({ label: "m. 16" });
    await expect(draft.locator(".issues").last()).toContainText("continues at ♩ = 66");
    await cutForm.getByRole("button", { name: "Add cut" }).click();
    await expect(draft.locator(".cut-list > li")).toHaveCount(1);
    const commentForm = draft.locator("form").nth(1);
    await commentForm.getByLabel("From").selectOption({ label: "m. 17" });
    await commentForm.getByLabel("Comment").fill("Tempo I: take time over “Lume”.");
    await commentForm.getByRole("button", { name: "Add comment" }).click();
    await expect(draft.locator(".changes")).toContainText("cut added: m. 13–16");
    await draft.getByLabel("Change summary").fill("Cut the più mosso, m. 13–16");
    await draft.getByRole("button", { name: "Publish version 2" }).click();
    await expect(elena.page.locator(".banner.ok")).toContainText("Version 2 published");
    await expect(elena.page.locator(".version-list")).toContainText("Cut the più mosso, m. 13–16");
  });

  const sofia = await userPage(browser, "sofia");
  await test.step("the performer's version 2 shows the cut and plays straight from m. 12 to m. 17", async () => {
    await sofia.page.goto(`/p/${pid}/v/2`);
    await waitWorkspace(sofia.page);
    await expect(sofia.page.locator(".ov-cut").first()).toContainText("vi–");
    await expect(sofia.page.locator(".ov-cut").last()).toContainText("–de");
    const passages = await sofia.page.getByLabel("Go to passage").locator("option").allTextContents();
    expect(passages.join("|")).not.toContain("Ah! non tardare");
    // the seeded phrasing comment from version 1 plus the new one at m. 17
    await expect(sofia.page.locator(".ov-comment")).toHaveCount(2);
    await expect(sofia.page.locator('.ov-comment[title*="Tempo I"]')).toHaveCount(1);

    await choosePassage(sofia.page, "(A), 2nd time");
    // start two bars before the cut (m. 11, second time through)
    await sofia.page.evaluate(() => {
      const w = window as unknown as { __cp: { perf: { toPerfQ: (p: object) => number } }; __cpEngine: { seek: (q: number) => void; log: unknown[] } };
      w.__cpEngine.seek(w.__cp.perf.toPerfQ({ m: 10, q: 0, occ: 2 }));
      w.__cpEngine.log = [];
    });
    await setTempo(sofia.page, 150);
    await sofia.page.getByTestId("play").click();
    const seen: string[] = [];
    for (let i = 0; i < 45; i++) {
      const n = (await sofia.page.getByTestId("loc-number").textContent())!.trim();
      if (seen[seen.length - 1] !== n) seen.push(n);
      if (n === "18") break;
      await sofia.page.waitForTimeout(150);
    }
    await sofia.page.getByTestId("pause").click();
    expect(seen).toEqual(expect.arrayContaining(["11", "12", "17"]));
    for (const n of ["13", "14", "15", "16"]) expect(seen).not.toContain(n);
    expect(seen.indexOf("17")).toBe(seen.indexOf("12") + 1);

    const parts = await sofia.page.evaluate(() => {
      const w = window as unknown as { __cp: { perf: { locate: (q: number) => { m: number } } }; __cpEngine: { log: { kind: string; q: number; part: string }[] } };
      const ons = w.__cpEngine.log.filter((e) => e.kind === "on");
      const inCut = ons.filter((e) => {
        const m = w.__cp.perf.locate(e.q).m;
        return m >= 12 && m <= 15;
      });
      const at17 = ons.filter((e) => w.__cp.perf.locate(e.q).m === 16).map((e) => e.part);
      return { inCut: inCut.length, partsAt17: [...new Set(at17)].sort() };
    });
    expect(parts.inCut).toBe(0);
    expect(parts.partsAt17).toEqual(["piano", "soprano"]);
    test.info().annotations.push({ type: "measures heard", description: seen.join(" → ") });
  });

  await test.step("version 1 is unchanged after the release", async () => {
    await sofia.page.goto(`/p/${pid}/v/1`);
    await waitWorkspace(sofia.page);
    await expect(sofia.page.locator(".ov-cut")).toHaveCount(0);
    await expect(sofia.page.getByTestId("version-notice")).toContainText("Version 2 has been published");
    expect(await sofia.page.evaluate(() => (window as unknown as { __cp: { perf: { measures: unknown[] } } }).__cp.perf.measures.length)).toBe(28);
  });

  await test.step("a performer requests a correction through a passage comment", async () => {
    await openTab(sofia.page, "comments");
    await sofia.page.getByPlaceholder(/IPA for “cuore”/).fill("Please check the IPA of “cuore” in m. 9.");
    await sofia.page.getByRole("button", { name: "Send request" }).click();
    await expect(sofia.page.getByText("Correction request sent to the editors.")).toBeVisible();
    await elena.page.goto(`/p/${pid}`);
    await expect(elena.page.locator(".comment-list").last()).toContainText("Please check the IPA");
  });
});

test("people outside the production cannot open it; invitation links let new people in", async ({ browser }) => {
  const elena = await userPage(browser, "elena");
  const pid = await productionId(elena.page);

  const luca = await userPage(browser, "luca");
  await luca.page.goto(`/p/${pid}`);
  await expect(luca.page.locator(".banner.error")).toContainText("Production not found");
  await luca.page.goto(`/p/${pid}/v/1`);
  await expect(luca.page.locator(".banner.error")).toContainText("Production not found");
  await luca.page.goto("/");
  await expect(luca.page.getByText("You are not in a production yet")).toBeVisible();

  await elena.page.goto(`/p/${pid}`);
  const inviteForm = elena.page.locator("form").filter({ hasText: "Create invitation link" });
  await inviteForm.getByLabel("Accompanist", { exact: true }).check();
  await inviteForm.getByRole("button", { name: "Create invitation link" }).click();
  const link = (await elena.page.locator(".invite-link code").textContent())!.trim();
  expect(link).toContain("/invite/");

  const guestCtx = await browser.newContext();
  const guest = await guestCtx.newPage();
  await guest.goto(link.replace(/^https?:\/\/[^/]+/, ""));
  await expect(guest.getByText(/invited to/)).toContainText("Lume di sera — studio production");
  await guest.getByLabel("Your name, as others will see it").fill("Giulia Conti");
  await guest.getByLabel("Username").fill("giulia");
  await guest.getByLabel(/^Password/).fill("a-long-password");
  await guest.getByRole("button", { name: "Create account and join" }).click();
  await expect(guest.locator(".page-title")).toHaveText("Lume di sera — studio production");
  await expect(guest.locator(".page-lede")).toContainText("Accompanist");

  // the link cannot be reused
  await luca.page.goto(link.replace(/^https?:\/\/[^/]+/, ""));
  await expect(luca.page.getByText("This invitation has already been used.")).toBeVisible();
});
