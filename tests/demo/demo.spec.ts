/**
 * Scripted demonstration: a singer learns a passage on her own, joins her accompanist,
 * follows the shared rehearsal position, and practises the production's approved cut.
 * Produces one video per device plus key screenshots in demo-output/.
 */
import { test, expect, type Page, type Browser } from "@playwright/test";
import { login, openTab, setTempo, tapMeasure, waitWorkspace, choosePassage, productionId } from "../e2e/helpers";

const SIZE = { width: 1180, height: 820 };

async function device(browser: Browser, user: string, label: string) {
  const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: `demo-output/raw/${user}`, size: SIZE } });
  const page = await ctx.newPage();
  return { ctx, page, label, user };
}

async function caption(page: Page, text: string) {
  await page.evaluate((text) => {
    let el = document.getElementById("demo-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-caption";
      el.style.cssText =
        "position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:9999;background:rgba(30,36,48,.92);color:#fff;padding:8px 16px;border-radius:10px;font:600 17px 'Atkinson Hyperlegible Next',sans-serif;pointer-events:none;max-width:90%;text-align:center";
      document.body.appendChild(el);
    }
    el.textContent = text;
  }, text);
}
async function captionAll(pages: Page[], text: string) {
  for (const p of pages) await caption(p, text).catch(() => undefined);
}
async function persistCaption(page: Page, text: string) {
  await page.waitForLoadState("domcontentloaded");
  await caption(page, text);
}

test("Counterpart demonstration", async ({ browser, playwright }) => {
  // both recordings start together so the side-by-side video stays in sync
  const [sofia, marco] = await Promise.all([device(browser, "sofia", "Singer"), device(browser, "marco", "Accompanist")]);
  await Promise.all([login(sofia.page, "sofia"), login(marco.page, "marco")]);
  const pid = await productionId(sofia.page);
  await persistCaption(marco.page, "Marco (accompanist) is waiting while Sofia practises");

  // 1. independent learning
  await sofia.page.goto("/practice/cp-fx-aria-lume");
  await waitWorkspace(sofia.page);
  await persistCaption(sofia.page, "1. Sofia learns the opening phrase on her own");
  await sofia.page.getByRole("button", { name: "Clara only" }).click();
  await sofia.page.waitForTimeout(800);
  await choosePassage(sofia.page, "(A), 1st time");
  await openTab(sofia.page, "language");
  await sofia.page.waitForTimeout(1500);
  await sofia.page.getByRole("button", { name: "Hear slowly" }).click();
  await caption(sofia.page, "1. Libretto, word-by-word gloss, translation and IPA for the phrase she is on");
  await sofia.page.waitForTimeout(3500);
  await sofia.page.getByTestId("select-bars").click();
  await tapMeasure(sofia.page, 4);
  await tapMeasure(sofia.page, 5);
  await sofia.page.getByTestId("loop-selection").click();
  await setTempo(sofia.page, 80);
  await sofia.page.getByRole("button", { name: "Count-in" }).click();
  await caption(sofia.page, "1. Loop m. 5–6 at 80% with a count-in; the highlight follows the audio");
  await sofia.page.getByTestId("play").click();
  await sofia.page.waitForTimeout(7000);
  await sofia.page.screenshot({ path: "demo-output/1-independent-practice.png" });
  await openTab(sofia.page, "mixer");
  await sofia.page.getByTestId("preset-singalong").click();
  await caption(sofia.page, "1. “Sing along” mutes her own line; piano keeps playing");
  await sofia.page.waitForTimeout(6000);
  await sofia.page.getByTestId("pause").click();
  await openTab(sofia.page, "notes");
  await sofia.page.getByTestId("note-input").fill("Open the vowel on “sera”; don’t rush the dotted rhythm.");
  await sofia.page.getByTestId("note-save").click();
  await caption(sofia.page, "1. A private note, attached to the bar. Only Sofia can see it.");
  await sofia.page.waitForTimeout(2500);

  // 2. joining the accompanist
  await marco.page.goto(`/p/${pid}`);
  await persistCaption(marco.page, "2. Marco starts a rehearsal on version 1");
  await marco.page.locator("form").filter({ hasText: "Start rehearsal" }).getByLabel("Version").selectOption({ label: "Version 1" });
  await marco.page.waitForTimeout(1200);
  await marco.page.getByRole("button", { name: "Start rehearsal" }).click();
  await marco.page.waitForURL(/\/rehearsal\//);
  await waitWorkspace(marco.page);
  await sofia.page.goto("/");
  await persistCaption(sofia.page, "2. Sofia sees the live rehearsal and joins");
  await sofia.page.waitForTimeout(1500);
  await sofia.page.getByRole("link", { name: "Join rehearsal" }).first().click();
  await waitWorkspace(sofia.page);
  await captionAll([marco.page, sofia.page], "2. Both are connected: Marco leads; sound comes from his device");
  await sofia.page.waitForTimeout(2500);

  // 3. following the shared position across different layouts
  await captionAll([marco.page, sofia.page], "3. Marco taps m. 9 in the full score; Sofia’s marker lands on m. 9 in her own layout");
  await tapMeasure(marco.page, 8);
  await sofia.page.waitForTimeout(2500);
  await captionAll([marco.page, sofia.page], "3. Marco plays the accompaniment; the red rehearsal marker follows on Sofia’s screen");
  await marco.page.getByTestId("play").click();
  await sofia.page.waitForTimeout(6500);
  await sofia.page.screenshot({ path: "demo-output/3-singer-following.png" });
  await marco.page.screenshot({ path: "demo-output/3-accompanist-leading.png" });
  await marco.page.getByTestId("pause").click();
  await caption(sofia.page, "3. Sofia looks ahead on her own…");
  await tapMeasure(sofia.page, 16);
  await sofia.page.waitForTimeout(2500);
  await caption(sofia.page, "3. …and returns with “Back to rehearsal position”");
  await sofia.page.getByTestId("back-float").click();
  await sofia.page.waitForTimeout(2500);

  // 4. the production's approved cut
  const elena = await playwright.request.newContext({ baseURL: "http://localhost:3100" });
  await elena.post("/api/auth/login", { data: { username: "elena", password: "counterpart-demo" } });
  await elena.post(`/api/productions/${pid}/cuts`, { data: { startM: 12, endM: 15 } });
  await elena.post(`/api/productions/${pid}/publish`, { data: { summary: "Cut the più mosso, m. 13–16" } });
  await elena.dispose();
  await captionAll([marco.page, sofia.page], "4. The editor publishes version 2 with an approved cut. This session stays on version 1.");
  await expect(sofia.page.getByTestId("version-notice")).toBeVisible();
  await sofia.page.waitForTimeout(3500);

  await marco.page.goto(`/p/${pid}`);
  await persistCaption(marco.page, "4. Marco starts a new rehearsal on version 2");
  await marco.page.locator("form").filter({ hasText: "Start rehearsal" }).getByLabel("Version").selectOption({ label: "Version 2" });
  await marco.page.getByRole("button", { name: "Start rehearsal" }).click();
  await marco.page.waitForURL(/\/rehearsal\//);
  await waitWorkspace(marco.page);
  await sofia.page.goto("/");
  await sofia.page.getByRole("link", { name: "Join rehearsal" }).first().click();
  await waitWorkspace(sofia.page);
  await choosePassage(marco.page, "(A), 2nd time");
  await marco.page.waitForTimeout(500);
  await tapMeasure(marco.page, 10);
  await setTempo(marco.page, 120);
  await captionAll([marco.page, sofia.page], "4. Practising the cut: from m. 11 (2nd time) playback goes straight from m. 12 to m. 17");
  await sofia.page.waitForTimeout(1500);
  await marco.page.getByTestId("play").click();
  await sofia.page.waitForTimeout(5500);
  await sofia.page.screenshot({ path: "demo-output/4-singer-after-cut.png" });
  await sofia.page.waitForTimeout(3000);
  await marco.page.getByTestId("pause").click();
  await captionAll([marco.page, sofia.page], "End of demonstration");
  await sofia.page.waitForTimeout(2000);

  await sofia.ctx.close();
  await marco.ctx.close();
});
