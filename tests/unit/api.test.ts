import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WebSocket } from "ws";
import { createCounterpartServer, type CounterpartServer } from "../../server/app";
import { createUser } from "../../server/auth";
import { addMember, createProduction, getProduction, publishVersion } from "../../server/productions";

let srv: CounterpartServer;
let base: string;
let dir: string;
const ids: Record<string, string> = {};
let prodId: string;

class Client {
  cookie = "";
  constructor(public name: string) {}
  async req(method: string, path: string, body?: unknown) {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(this.cookie ? { cookie: this.cookie } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get("set-cookie");
    if (set) this.cookie = set.split(";")[0];
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  }
  get = (p: string) => this.req("GET", p);
  post = (p: string, b: unknown = {}) => this.req("POST", p, b);
  async login() {
    const r = await this.post("/api/auth/login", { username: this.name, password: "test-password-123" });
    expect(r.status).toBe(200);
    return this;
  }
  ws(): Promise<{ ws: WebSocket; next: (type: string, pred?: (m: Record<string, unknown>) => boolean) => Promise<Record<string, unknown>> }> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(base.replace("http", "ws") + "/ws", { headers: { cookie: this.cookie } });
      const queue: Record<string, unknown>[] = [];
      const waiters: { type: string; pred?: (m: Record<string, unknown>) => boolean; res: (m: Record<string, unknown>) => void }[] = [];
      ws.on("message", (raw) => {
        const m = JSON.parse(String(raw));
        const w = waiters.findIndex((x) => x.type === m.type && (!x.pred || x.pred(m)));
        if (w >= 0) waiters.splice(w, 1)[0].res(m);
        else queue.push(m);
      });
      ws.on("open", () =>
        resolve({
          ws,
          next: (type, pred) =>
            new Promise((res, rej) => {
              const i = queue.findIndex((m) => m.type === type && (!pred || pred(m)));
              if (i >= 0) return res(queue.splice(i, 1)[0]);
              waiters.push({ type, pred, res });
              setTimeout(() => rej(new Error(`timeout waiting for ${type}`)), 4000);
            }),
        }),
      );
      ws.on("unexpected-response", (_req, res) => reject(new Error(`ws ${res.statusCode}`)));
      ws.on("error", reject);
    });
  }
}

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "cp-api-"));
  srv = createCounterpartServer({ dbFile: join(dir, "t.db"), contentDir: "data/content" });
  await new Promise<void>((r) => srv.server.listen(0, r));
  base = `http://localhost:${(srv.server.address() as { port: number }).port}`;
  for (const u of ["elena", "sofia", "marco", "luca"]) ids[u] = createUser(srv.db, u, u[0].toUpperCase() + u.slice(1), "test-password-123").id;
  const ed = srv.content.edition("cp-fx-aria-lume")!;
  prodId = createProduction(srv.db, "Test production", ed.editionId, ed.scoreVersionId, ids.elena);
  addMember(srv.db, prodId, ids.sofia, "performer", ["clara"]);
  addMember(srv.db, prodId, ids.marco, "performer", ["accompanist"]);
  publishVersion(srv.db, getProduction(srv.db, prodId)!, ids.elena, "v1");
});

afterAll(async () => {
  await srv.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("authentication and access", () => {
  it("rejects anonymous access to the API, content and websocket", async () => {
    const anon = new Client("anon");
    expect((await anon.get("/api/library")).status).toBe(401);
    expect((await anon.get("/content/cp-fx-aria-lume/edition.json")).status).toBe(401);
    await expect(anon.ws()).rejects.toThrow(/401/);
  });

  it("rejects wrong passwords and cross-origin writes", async () => {
    const c = new Client("sofia");
    expect((await c.post("/api/auth/login", { username: "sofia", password: "nope-nope-nope" })).status).toBe(401);
    const res = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://evil.example" },
      body: JSON.stringify({ username: "sofia", password: "test-password-123" }),
    });
    expect(res.status).toBe(403);
  });

  it("uninvited users cannot see the production, its versions, rehearsals or comments", async () => {
    const luca = await new Client("luca").login();
    expect((await luca.get(`/api/productions/${prodId}`)).status).toBe(404);
    expect((await luca.get(`/api/productions/${prodId}/versions/1`)).status).toBe(404);
    expect((await luca.get(`/api/productions/${prodId}/rehearsals`)).status).toBe(404);
    expect((await luca.post(`/api/productions/${prodId}/comments`, { kind: "correction", startM: 1, body: "x" })).status).toBe(404);
    expect((await luca.post(`/api/productions/${prodId}/rehearsals`, { versionNumber: 1 })).status).toBe(404);
    const lib = await luca.get("/api/library");
    expect(lib.body.productions).toHaveLength(0);
  });

  it("performers cannot change production settings", async () => {
    const sofia = await new Client("sofia").login();
    expect((await sofia.post(`/api/productions/${prodId}/cuts`, { startM: 12, endM: 15 })).status).toBe(403);
    expect((await sofia.post(`/api/productions/${prodId}/publish`, { summary: "x" })).status).toBe(403);
    expect((await sofia.post(`/api/productions/${prodId}/invitations`, {})).status).toBe(403);
    expect((await sofia.post(`/api/productions/${prodId}/comments`, { kind: "editorial", startM: 1, body: "x" })).status).toBe(403);
    expect((await sofia.get(`/api/productions/${prodId}/versions/draft`)).status).toBe(403);
    // but they can request a correction
    expect((await sofia.post(`/api/productions/${prodId}/comments`, { kind: "correction", startM: 8, body: "IPA for cuore?", versionNumber: 1 })).status).toBe(201);
  });
});

describe("private notes", () => {
  it("belong only to their author and persist", async () => {
    const sofia = await new Client("sofia").login();
    const elena = await new Client("elena").login();
    const created = await sofia.post("/api/notes", { editionId: "cp-fx-aria-lume", productionId: prodId, startM: 8, startQ: 1, body: "Breathe before scendi" });
    expect(created.status).toBe(201);
    const again = await new Client("sofia").login(); // new session, same user
    const mine = await again.get(`/api/notes?editionId=cp-fx-aria-lume&productionId=${prodId}`);
    expect(mine.body.map((n: { body: string }) => n.body)).toContain("Breathe before scendi");
    const editorView = await elena.get(`/api/notes?editionId=cp-fx-aria-lume&productionId=${prodId}`);
    expect(editorView.body).toHaveLength(0);
    expect((await elena.req("PATCH", `/api/notes/${created.body.id}`, { body: "hijack" })).status).toBe(404);
    expect((await elena.req("DELETE", `/api/notes/${created.body.id}`, {})).status).toBe(404);
    // nothing about notes appears in the production payload editors receive
    const prod = await elena.get(`/api/productions/${prodId}`);
    expect(JSON.stringify(prod.body)).not.toContain("Breathe before scendi");
  });
});

describe("cuts, versions and publishing", () => {
  it("flags unsupported cut boundaries and blocks publishing until fixed", async () => {
    const elena = await new Client("elena").login();
    // m. 12–13 (idx 11–12) crosses the repeat barline
    const bad = await elena.post(`/api/productions/${prodId}/cuts`, { startM: 11, endM: 12 });
    expect(bad.status).toBe(201);
    expect(bad.body.status).toBe("flagged");
    expect(bad.body.issues.map((i: { code: string }) => i.code)).toContain("repeat");
    const pub = await elena.post(`/api/productions/${prodId}/publish`, { summary: "should fail" });
    expect(pub.status).toBe(409);
    expect((await elena.req("DELETE", `/api/productions/${prodId}/cuts/${bad.body.id}`, {})).status).toBe(200);
  });

  it("published versions are immutable; later edits go to the draft", async () => {
    const elena = await new Client("elena").login();
    const good = await elena.post(`/api/productions/${prodId}/cuts`, { startM: 12, endM: 15 });
    expect(good.body.status).toBe("ok");
    expect(good.body.issues.some((i: { code: string }) => i.code === "tempo")).toBe(true);
    const v2 = await elena.post(`/api/productions/${prodId}/publish`, { summary: "Cut the più mosso" });
    expect(v2.status).toBe(201);
    expect(v2.body.number).toBe(2);
    // change the draft after publishing
    await elena.post(`/api/productions/${prodId}/cuts`, { startM: 0, endM: 1 });
    const v2again = await elena.get(`/api/productions/${prodId}/versions/2`);
    expect(v2again.body.cuts).toHaveLength(1);
    expect(v2again.body.cuts[0]).toMatchObject({ startM: 12, endM: 15 });
    const v1 = await elena.get(`/api/productions/${prodId}/versions/1`);
    expect(v1.body.cuts).toHaveLength(0);
    // the database itself refuses to modify a published version
    expect(() => srv.db.prepare("update production_versions set summary = 'x' where production_id = ?").run(prodId)).toThrow(/immutable/);
    expect(() => srv.db.prepare("delete from production_versions where production_id = ?").run(prodId)).toThrow(/immutable/);
  });
});

describe("rehearsal sessions", () => {
  it("pin their version, validate the leader, and are not changed by a new release", async () => {
    const marco = await new Client("marco").login();
    const sofia = await new Client("sofia").login();
    const luca = await new Client("luca").login();
    const elena = await new Client("elena").login();
    const s = await marco.post(`/api/productions/${prodId}/rehearsals`, { versionNumber: 1, participantIds: [ids.sofia] });
    expect(s.status).toBe(201);

    const mw = await marco.ws();
    mw.ws.send(JSON.stringify({ type: "join", sessionId: s.body.id }));
    const welcome = await mw.next("welcome");
    expect((welcome.state as { versionNumber: number; leaderId: string }).versionNumber).toBe(1);
    expect((welcome.state as { leaderId: string }).leaderId).toBe(ids.marco);

    const sw = await sofia.ws();
    sw.ws.send(JSON.stringify({ type: "join", sessionId: s.body.id }));
    await sw.next("welcome");

    // a follower cannot move the shared marker
    sw.ws.send(JSON.stringify({ type: "marker", pos: { m: 3, q: 0 } }));
    expect(String((await sw.next("error")).message)).toMatch(/leader/);

    // the leader can; the follower receives the musical position
    mw.ws.send(JSON.stringify({ type: "marker", pos: { m: 8, q: 2, occ: 2 } }));
    const mk = await sw.next("marker", (m) => (m.marker as { m: number }).m === 8);
    expect(mk.marker).toMatchObject({ m: 8, q: 2, occ: 2 });

    // invalid positions are rejected
    mw.ws.send(JSON.stringify({ type: "marker", pos: { m: 99, q: 0 } }));
    expect(String((await mw.next("error")).message)).toMatch(/Invalid/);

    // an uninvited user cannot join
    const lw = await luca.ws();
    lw.ws.send(JSON.stringify({ type: "join", sessionId: s.body.id }));
    expect((await lw.next("error")).code).toBe("forbidden");
    // a member who is not a participant (Elena was not picked) cannot join either
    const ew = await elena.ws();
    ew.ws.send(JSON.stringify({ type: "join", sessionId: s.body.id }));
    expect((await ew.next("error")).code).toBe("forbidden");

    // publish a new version: participants are notified, the session keeps version 1
    const pub = await elena.post(`/api/productions/${prodId}/publish`, { summary: "Another release" });
    expect(pub.status).toBe(201);
    const notice = await sw.next("notice");
    expect(notice).toMatchObject({ kind: "version-published", versionNumber: pub.body.number });
    mw.ws.send(JSON.stringify({ type: "marker", pos: { m: 13, q: 0 } })); // m. 14 is cut in v2 but not in v1
    const after = await sw.next("marker", (m) => (m.marker as { m: number }).m === 13);
    expect(after.marker).toMatchObject({ m: 13, q: 0 });
    const st = await sofia.get(`/api/rehearsals/${s.body.id}`);
    expect(st.body.versionNumber).toBe(1);

    // hand over control; the old leader can no longer move the marker
    mw.ws.send(JSON.stringify({ type: "transfer", toUserId: ids.sofia }));
    const handed = await sw.next("state", (m) => (m.state as { leaderId: string }).leaderId === ids.sofia);
    expect(handed.audioConnId).toBeTruthy();
    mw.ws.send(JSON.stringify({ type: "marker", pos: { m: 2, q: 0 } }));
    expect(String((await mw.next("error")).message)).toMatch(/leader/);

    // disconnecting is reflected in participant status
    sw.ws.close();
    const st2 = await mw.next("state", (m) => (m.state as { participants: { userId: string; connected: boolean }[] }).participants.some((p) => p.userId === ids.sofia && !p.connected));
    expect((st2.state as { audioDevice: string }).audioDevice).toMatch(/No device/);
    for (const c of [mw, lw, ew]) c.ws.close();
  });

  it("invitation links grant access once", async () => {
    const elena = await new Client("elena").login();
    const inv = await elena.post(`/api/productions/${prodId}/invitations`, { permission: "performer", roles: ["accompanist"], maxUses: 1 });
    expect(inv.status).toBe(201);
    const token = inv.body.token;
    const newbie = new Client("newbie");
    const acc = await newbie.post(`/api/invitations/${token}/accept`, { username: "newbie", displayName: "New Bie", password: "long-enough-pw" });
    expect(acc.status).toBe(200);
    expect((await newbie.get(`/api/productions/${prodId}`)).status).toBe(200);
    const luca = await new Client("luca").login();
    expect((await luca.post(`/api/invitations/${token}/accept`, {})).status).toBe(410);
    expect((await luca.get(`/api/productions/${prodId}`)).status).toBe(404);
  });
});
