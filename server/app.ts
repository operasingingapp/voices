import express, { type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { existsSync } from "node:fs";
import { join, resolve, normalize } from "node:path";
import { randomUUID } from "node:crypto";
import { openDb, now, type DB } from "./db";
import {
  allowAttempt,
  authMiddleware,
  createSession,
  createUser,
  requireUser,
  setSessionCookie,
  sha256,
  verifyPassword,
  SESSION_COOKIE,
  parseCookies,
} from "./auth";
import { ContentStore } from "./content";
import {
  acceptInvitation,
  correctionRequests,
  createInvitation,
  createProduction,
  draftChanges,
  draftCuts,
  editorialComments,
  findInvitation,
  getComment,
  getMembership,
  getProduction,
  getVersion,
  invitationUsable,
  latestVersionNumber,
  listInvitations,
  listMembers,
  listMemberships,
  listVersions,
  publishVersion,
  type Membership,
  type ProductionRow,
} from "./productions";
import { Realtime, initialRehearsalState } from "./realtime";
import { validateCut } from "../shared/cuts";
import { Performance } from "../shared/timeline";
import type { Permission } from "../shared/types";

export interface AppOptions {
  dbFile: string;
  contentDir: string;
  staticDir?: string;
  secureCookies?: boolean;
}

export interface CounterpartServer {
  app: express.Express;
  server: Server;
  db: DB;
  realtime: Realtime;
  content: ContentStore;
  close: () => Promise<void>;
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const str = (v: unknown, max = 2000): string => {
  if (typeof v !== "string") throw new HttpError(400, "Expected text");
  const s = v.trim();
  if (s.length > max) throw new HttpError(400, `Text is too long (max ${max} characters)`);
  return s;
};
const int = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isInteger(n)) throw new HttpError(400, "Expected a whole number");
  return n;
};
const numIn = (v: unknown, lo: number, hi: number): number => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < lo || n > hi) throw new HttpError(400, "Number out of range");
  return n;
};

export function createCounterpartServer(opts: AppOptions): CounterpartServer {
  const db = openDb(opts.dbFile);
  const content = new ContentStore(opts.contentDir);
  const app = express();
  const server = createServer(app);
  const realtime = new Realtime(db, content);

  app.disable("x-powered-by");
  app.set("trust proxy", "loopback");
  app.use(express.json({ limit: "64kb" }));
  app.use(authMiddleware(db));

  // CSRF hardening: state-changing API calls must be JSON from our own origin.
  app.use("/api", (req, res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      if (!req.is("application/json")) return res.status(415).json({ error: "JSON required" });
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({ error: "Cross-origin request refused" });
    }
    next();
  });

  const wrap = (fn: (req: Request, res: Response) => unknown) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const r = fn(req, res);
      if (r instanceof Promise) r.catch(next);
    } catch (e) {
      next(e);
    }
  };

  /** Load production + membership; unknown production and non-membership are indistinguishable (404). */
  const member = (req: Request): { p: ProductionRow; m: Membership } => {
    const p = getProduction(db, String(req.params.pid));
    const m = p && req.user ? getMembership(db, p.id, req.user.id) : undefined;
    if (!p || !m) throw new HttpError(404, "Production not found");
    return { p, m };
  };
  const editor = (req: Request) => {
    const r = member(req);
    if (r.m.permission !== "editor") throw new HttpError(403, "Only production editors can do that");
    return r;
  };

  /* ---------------- auth ---------------- */

  app.post(
    "/api/auth/login",
    wrap((req, res) => {
      const username = str(req.body?.username, 64).toLowerCase();
      const password = str(req.body?.password, 200);
      if (!allowAttempt(`login:${username}:${req.ip}`)) throw new HttpError(429, "Too many attempts. Wait a minute and try again.");
      const row = db.prepare("select id, password_hash as hash from users where username = ?").get(username) as { id: string; hash: string } | undefined;
      if (!row || !verifyPassword(password, row.hash)) throw new HttpError(401, "Incorrect username or password");
      setSessionCookie(res, createSession(db, row.id), !!opts.secureCookies);
      res.json({ ok: true });
    }),
  );

  app.post(
    "/api/auth/logout",
    wrap((req, res) => {
      const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
      if (token) db.prepare("delete from sessions where token_hash = ?").run(sha256(token));
      res.clearCookie(SESSION_COOKIE, { path: "/" });
      res.json({ ok: true });
    }),
  );

  app.get("/api/auth/me", (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not signed in" });
    res.json({ user: req.user });
  });

  /* ---------------- invitations (public preview, authenticated accept) ---------------- */

  app.get(
    "/api/invitations/:token",
    wrap((req, res) => {
      const inv = findInvitation(db, String(req.params.token));
      if (!inv) throw new HttpError(404, "This invitation link is not valid.");
      const p = getProduction(db, inv.productionId)!;
      const ed = content.edition(p.editionId);
      res.json({
        productionName: p.name,
        pieceTitle: ed?.title,
        permission: inv.permission,
        roles: inv.roles.map((r) => ed?.roles.find((x) => x.id === r)?.name ?? r),
        problem: invitationUsable(inv),
      });
    }),
  );

  app.post(
    "/api/invitations/:token/accept",
    wrap((req, res) => {
      const inv = findInvitation(db, String(req.params.token));
      if (!inv) throw new HttpError(404, "This invitation link is not valid.");
      const problem = invitationUsable(inv);
      if (problem) throw new HttpError(410, problem);
      let userId = req.user?.id;
      if (!userId) {
        // create an account bound to this invitation
        const username = str(req.body?.username, 32).toLowerCase();
        const displayName = str(req.body?.displayName, 60);
        const password = str(req.body?.password, 200);
        if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw new HttpError(400, "Usernames use 3–32 letters, digits, dots, dashes or underscores.");
        if (password.length < 10) throw new HttpError(400, "Use a password of at least 10 characters.");
        if (!displayName) throw new HttpError(400, "Enter the name other participants will see.");
        if (db.prepare("select 1 from users where username = ?").get(username)) throw new HttpError(409, "That username is taken. Sign in instead if it is yours.");
        userId = createUser(db, username, displayName, password).id;
        setSessionCookie(res, createSession(db, userId), !!opts.secureCookies);
      }
      acceptInvitation(db, inv, userId);
      res.json({ productionId: inv.productionId });
    }),
  );

  /* ---------------- everything below needs a signed-in user ---------------- */

  app.use("/api", requireUser);
  app.use("/content", (req, res, next) => (req.user ? next() : res.status(401).json({ error: "Sign in required" })));

  app.get("/api/library", (req, res) => {
    res.json({ pieces: content.catalog, productions: listMemberships(db, req.user!.id) });
  });

  /* ---------------- productions ---------------- */

  app.post(
    "/api/productions",
    wrap((req, res) => {
      const name = str(req.body?.name, 120);
      const editionId = str(req.body?.editionId, 120);
      const ed = content.edition(editionId);
      if (!ed) throw new HttpError(400, "Choose one of the prepared pieces");
      if (!name) throw new HttpError(400, "Give the production a name");
      res.status(201).json({ id: createProduction(db, name, editionId, ed.scoreVersionId, req.user!.id) });
    }),
  );

  app.get(
    "/api/productions/:pid",
    wrap((req, res) => {
      const { p, m } = member(req);
      const isEditor = m.permission === "editor";
      res.json({
        production: p,
        me: m,
        versions: listVersions(db, p.id),
        latestVersion: latestVersionNumber(db, p.id),
        members: listMembers(db, p.id).map((x) => (isEditor ? x : { userId: x.userId, displayName: x.displayName, permission: x.permission, roles: x.roles })),
        draft: isEditor
          ? { cuts: draftCuts(db, p.id), comments: editorialComments(db, p.id), changes: draftChanges(db, p) }
          : undefined,
        corrections: correctionRequests(db, p.id, m),
        invitations: isEditor ? listInvitations(db, p.id) : undefined,
      });
    }),
  );

  /** Everything the practice workspace needs for one production version (or the editor's draft). */
  app.get(
    "/api/productions/:pid/versions/:v",
    wrap((req, res) => {
      const { p, m } = member(req);
      if (req.params.v === "draft") {
        if (m.permission !== "editor") throw new HttpError(403, "Only editors can open the draft");
        return res.json({
          production: { id: p.id, name: p.name, editionId: p.editionId },
          version: { number: null, label: "Draft", summary: "Unpublished changes", publishedAt: null },
          cuts: draftCuts(db, p.id),
          comments: editorialComments(db, p.id),
          corrections: correctionRequests(db, p.id, m),
          me: m,
          latestVersion: latestVersionNumber(db, p.id),
        });
      }
      const n = int(req.params.v);
      const v = getVersion(db, p.id, n);
      if (!v) throw new HttpError(404, "Version not found");
      res.json({
        production: { id: p.id, name: p.name, editionId: p.editionId },
        version: { number: v.number, label: `Version ${v.number}`, summary: v.summary, publishedAt: v.publishedAt },
        cuts: v.snapshot.cuts,
        comments: v.snapshot.comments,
        corrections: correctionRequests(db, p.id, m),
        me: m,
        latestVersion: latestVersionNumber(db, p.id),
      });
    }),
  );

  app.post(
    "/api/productions/:pid/cuts",
    wrap((req, res) => {
      const { p } = editor(req);
      const ed = content.edition(p.editionId)!;
      const cut = { startM: int(req.body?.startM), endM: int(req.body?.endM) };
      const existing = draftCuts(db, p.id);
      const result = validateCut(ed, existing, cut, content.language(p.editionId)?.phrases);
      if (result.issues.some((i) => i.code === "range" || i.code === "overlap" || i.code === "everything"))
        throw new HttpError(400, result.issues.map((i) => i.message).join(" "));
      const id = randomUUID();
      db.prepare("insert into draft_cuts (id, production_id, start_m, end_m, status, issues, created_by, created_at) values (?,?,?,?,?,?,?,?)").run(
        id,
        p.id,
        cut.startM,
        cut.endM,
        result.status,
        JSON.stringify(result.issues),
        req.user!.id,
        now(),
      );
      if (result.status === "flagged") {
        // record an editorial correction request so the problem is visible to the team
        db.prepare(
          "insert into comments (id, production_id, kind, start_m, start_q, end_m, end_q, body, author_id, created_at, status, version_number) values (?,?,?,?,?,?,?,?,?,?,?,?)",
        ).run(
          randomUUID(),
          p.id,
          "correction",
          cut.startM,
          0,
          cut.endM,
          ed.measures[cut.endM].durQ,
          `Cut m. ${ed.measures[cut.startM].number}–${ed.measures[cut.endM].number} needs editorial correction: ${result.issues
            .filter((i) => i.severity === "error")
            .map((i) => i.message)
            .join(" ")}`,
          req.user!.id,
          now(),
          "open",
          null,
        );
      }
      res.status(201).json({ id, ...cut, ...result });
    }),
  );

  app.post(
    "/api/productions/:pid/cuts/preview",
    wrap((req, res) => {
      const { p } = editor(req);
      const ed = content.edition(p.editionId)!;
      res.json(validateCut(ed, draftCuts(db, p.id), { startM: int(req.body?.startM), endM: int(req.body?.endM) }, content.language(p.editionId)?.phrases));
    }),
  );

  app.delete(
    "/api/productions/:pid/cuts/:cid",
    wrap((req, res) => {
      const { p } = editor(req);
      const r = db.prepare("delete from draft_cuts where id = ? and production_id = ?").run(String(req.params.cid), p.id);
      if (!Number(r.changes)) throw new HttpError(404, "Cut not found");
      res.json({ ok: true });
    }),
  );

  app.post(
    "/api/productions/:pid/comments",
    wrap((req, res) => {
      const { p, m } = member(req);
      const ed = content.edition(p.editionId)!;
      const kind = req.body?.kind === "editorial" ? "editorial" : "correction";
      if (kind === "editorial" && m.permission !== "editor") throw new HttpError(403, "Only editors add shared editorial comments; performers can request a correction");
      const startM = int(req.body?.startM);
      const endM = int(req.body?.endM ?? startM);
      if (startM < 0 || endM >= ed.measures.length || endM < startM) throw new HttpError(400, "Comment must be attached to measures in this edition");
      const startQ = numIn(req.body?.startQ ?? 0, 0, ed.measures[startM].durQ);
      const endQ = numIn(req.body?.endQ ?? ed.measures[endM].durQ, 0, ed.measures[endM].durQ);
      const body = str(req.body?.body, 2000);
      if (!body) throw new HttpError(400, "Write a comment first");
      const versionNumber = req.body?.versionNumber == null ? null : int(req.body.versionNumber);
      const id = randomUUID();
      db.prepare(
        "insert into comments (id, production_id, kind, start_m, start_q, end_m, end_q, body, author_id, created_at, status, version_number) values (?,?,?,?,?,?,?,?,?,?,?,?)",
      ).run(id, p.id, kind, startM, startQ, endM, endQ, body, req.user!.id, now(), "open", versionNumber);
      res.status(201).json(getComment(db, id));
    }),
  );

  app.patch(
    "/api/productions/:pid/comments/:cid",
    wrap((req, res) => {
      const { p, m } = member(req);
      const c = getComment(db, String(req.params.cid));
      if (!c || c.productionId !== p.id) throw new HttpError(404, "Comment not found");
      if (c.kind === "correction" && m.permission !== "editor" && c.authorId !== req.user!.id) throw new HttpError(404, "Comment not found");
      if (m.permission !== "editor") throw new HttpError(403, "Only editors can change shared comments");
      if (req.body?.status) db.prepare("update comments set status = ? where id = ?").run(req.body.status === "resolved" ? "resolved" : "open", c.id);
      if (typeof req.body?.body === "string" && c.kind === "editorial") db.prepare("update comments set body = ? where id = ?").run(str(req.body.body), c.id);
      res.json(getComment(db, c.id));
    }),
  );

  app.delete(
    "/api/productions/:pid/comments/:cid",
    wrap((req, res) => {
      const { p } = editor(req);
      const r = db.prepare("delete from comments where id = ? and production_id = ?").run(String(req.params.cid), p.id);
      if (!Number(r.changes)) throw new HttpError(404, "Comment not found");
      res.json({ ok: true });
    }),
  );

  app.post(
    "/api/productions/:pid/publish",
    wrap((req, res) => {
      const { p } = editor(req);
      const summary = str(req.body?.summary, 280);
      if (!summary) throw new HttpError(400, "Add a short change summary");
      const flagged = draftCuts(db, p.id).filter((c) => c.status === "flagged");
      if (flagged.length)
        throw new HttpError(
          409,
          `${flagged.length} cut${flagged.length > 1 ? "s need" : " needs"} editorial correction before publishing. Remove or adjust ${flagged.length > 1 ? "them" : "it"} first.`,
        );
      const v = publishVersion(db, p, req.user!.id, summary);
      realtime.notifyProduction(p.id, { kind: "version-published", versionNumber: v.number, summary, publishedBy: req.user!.displayName });
      res.status(201).json({ number: v.number, summary: v.summary, publishedAt: v.publishedAt });
    }),
  );

  /* ---------------- members & invitations ---------------- */

  app.post(
    "/api/productions/:pid/invitations",
    wrap((req, res) => {
      const { p } = editor(req);
      const ed = content.edition(p.editionId)!;
      const permission: Permission = req.body?.permission === "editor" ? "editor" : "performer";
      const roles: string[] = Array.isArray(req.body?.roles) ? req.body.roles.map(String) : [];
      for (const r of roles) if (!ed.roles.some((x) => x.id === r) && r !== "accompanist") throw new HttpError(400, `Unknown role ${r}`);
      const inv = createInvitation(db, p.id, req.user!.id, {
        permission,
        roles,
        label: req.body?.label ? str(req.body.label, 80) : undefined,
        expiresInHours: numIn(req.body?.expiresInHours ?? 72, 1, 24 * 30),
        maxUses: int(req.body?.maxUses ?? 1),
      });
      res.status(201).json({ ...inv, path: `/invite/${inv.token}` });
    }),
  );

  app.delete(
    "/api/productions/:pid/invitations/:iid",
    wrap((req, res) => {
      const { p } = editor(req);
      db.prepare("update invitations set revoked_at = ? where id = ? and production_id = ?").run(now(), String(req.params.iid), p.id);
      res.json({ ok: true });
    }),
  );

  app.patch(
    "/api/productions/:pid/members/:uid",
    wrap((req, res) => {
      const { p } = editor(req);
      const uid = String(req.params.uid);
      const target = getMembership(db, p.id, uid);
      if (!target) throw new HttpError(404, "Member not found");
      const ed = content.edition(p.editionId)!;
      const roles: string[] = Array.isArray(req.body?.roles) ? req.body.roles.map(String) : target.roles;
      for (const r of roles) if (!ed.roles.some((x) => x.id === r) && r !== "accompanist") throw new HttpError(400, `Unknown role ${r}`);
      const permission: Permission = req.body?.permission === "editor" ? "editor" : req.body?.permission === "performer" ? "performer" : target.permission;
      if (target.permission === "editor" && permission !== "editor") {
        const editors = listMembers(db, p.id).filter((x) => x.permission === "editor").length;
        if (editors <= 1) throw new HttpError(409, "A production needs at least one editor");
      }
      db.prepare("update production_members set roles = ?, permission = ? where production_id = ? and user_id = ?").run(JSON.stringify(roles), permission, p.id, uid);
      res.json(getMembership(db, p.id, uid));
    }),
  );

  app.delete(
    "/api/productions/:pid/members/:uid",
    wrap((req, res) => {
      const { p } = editor(req);
      const uid = String(req.params.uid);
      const target = getMembership(db, p.id, uid);
      if (!target) throw new HttpError(404, "Member not found");
      if (target.permission === "editor" && listMembers(db, p.id).filter((x) => x.permission === "editor").length <= 1)
        throw new HttpError(409, "A production needs at least one editor");
      db.prepare("delete from production_members where production_id = ? and user_id = ?").run(p.id, uid);
      realtime.revoke(p.id, uid);
      res.json({ ok: true });
    }),
  );

  /* ---------------- rehearsal sessions ---------------- */

  app.post(
    "/api/productions/:pid/rehearsals",
    wrap((req, res) => {
      const { p } = member(req);
      const versionNumber = int(req.body?.versionNumber);
      const v = getVersion(db, p.id, versionNumber);
      if (!v) throw new HttpError(400, "Rehearsals use a published version");
      const members = listMembers(db, p.id);
      const requested: string[] = Array.isArray(req.body?.participantIds) ? req.body.participantIds.map(String) : members.map((x) => x.userId);
      const participantIds = Array.from(new Set([req.user!.id, ...requested]));
      for (const id of participantIds) if (!members.some((x) => x.userId === id)) throw new HttpError(400, "Participants must be members of the production");
      const id = randomUUID();
      const name = req.body?.name ? str(req.body.name, 80) : `Rehearsal ${new Date().toLocaleDateString("en-GB")}`;
      const state = initialRehearsalState({ sessionId: id, productionId: p.id, versionNumber, name, leaderId: req.user!.id, leaderName: req.user!.displayName });
      const perf = new Performance(content.edition(p.editionId)!, v.snapshot.cuts);
      const first = perf.measures[0];
      state.marker = { m: first.m, q: 0, occ: 1 };
      state.playback.pos = state.marker;
      db.prepare(
        "insert into rehearsal_sessions (id, production_id, version_number, name, created_by, created_at, participant_ids, state) values (?,?,?,?,?,?,?,?)",
      ).run(id, p.id, versionNumber, name, req.user!.id, now(), JSON.stringify(participantIds), JSON.stringify(state));
      res.status(201).json({ id, versionNumber, name });
    }),
  );

  app.get(
    "/api/productions/:pid/rehearsals",
    wrap((req, res) => {
      const { p } = member(req);
      const rows = db
        .prepare(
          `select r.id, r.version_number as versionNumber, r.name, r.created_at as createdAt, r.participant_ids as participantIds, u.display_name as createdBy
           from rehearsal_sessions r join users u on u.id = r.created_by where r.production_id = ? and r.ended_at is null order by r.created_at desc`,
        )
        .all(p.id) as { id: string; versionNumber: number; name: string; createdAt: string; participantIds: string; createdBy: string }[];
      res.json(
        rows
          .filter((r) => (JSON.parse(r.participantIds) as string[]).includes(req.user!.id))
          .map(({ participantIds, ...r }) => ({ ...r, participants: (JSON.parse(participantIds) as string[]).length })),
      );
    }),
  );

  app.get(
    "/api/rehearsals/:sid",
    wrap((req, res) => {
      const row = db
        .prepare("select id, production_id as productionId, version_number as versionNumber, name, ended_at as endedAt, participant_ids as participantIds, created_by as createdBy from rehearsal_sessions where id = ?")
        .get(String(req.params.sid)) as { id: string; productionId: string; versionNumber: number; name: string; endedAt: string | null; participantIds: string; createdBy: string } | undefined;
      if (!row || !(JSON.parse(row.participantIds) as string[]).includes(req.user!.id) || !getMembership(db, row.productionId, req.user!.id))
        throw new HttpError(404, "Rehearsal session not found");
      res.json({ id: row.id, productionId: row.productionId, versionNumber: row.versionNumber, name: row.name, endedAt: row.endedAt, createdBy: row.createdBy });
    }),
  );

  app.post(
    "/api/rehearsals/:sid/end",
    wrap((req, res) => {
      const row = db.prepare("select production_id as productionId, created_by as createdBy from rehearsal_sessions where id = ?").get(String(req.params.sid)) as
        | { productionId: string; createdBy: string }
        | undefined;
      const m = row ? getMembership(db, row.productionId, req.user!.id) : undefined;
      if (!row || !m) throw new HttpError(404, "Rehearsal session not found");
      if (row.createdBy !== req.user!.id && m.permission !== "editor") throw new HttpError(403, "Only the session's creator or an editor can end it");
      db.prepare("update rehearsal_sessions set ended_at = ? where id = ?").run(now(), String(req.params.sid));
      realtime.endSession(String(req.params.sid));
      res.json({ ok: true });
    }),
  );

  /* ---------------- private notes (owner only) ---------------- */

  app.get(
    "/api/notes",
    wrap((req, res) => {
      const editionId = str(req.query.editionId, 120);
      const productionId = typeof req.query.productionId === "string" ? req.query.productionId : null;
      const rows = db
        .prepare(
          `select id, edition_id as editionId, production_id as productionId, start_m as startM, start_q as startQ, end_m as endM, body, created_at as createdAt, updated_at as updatedAt
           from private_notes where user_id = ? and edition_id = ? and (production_id is null or production_id = ?) order by start_m, start_q`,
        )
        .all(req.user!.id, editionId, productionId);
      res.json(rows);
    }),
  );

  app.post(
    "/api/notes",
    wrap((req, res) => {
      const editionId = str(req.body?.editionId, 120);
      const ed = content.edition(editionId);
      if (!ed) throw new HttpError(400, "Unknown piece");
      const productionId = req.body?.productionId ? str(req.body.productionId, 64) : null;
      if (productionId && !getMembership(db, productionId, req.user!.id)) throw new HttpError(404, "Production not found");
      const startM = int(req.body?.startM);
      if (startM < 0 || startM >= ed.measures.length) throw new HttpError(400, "Note must be attached to a measure");
      const startQ = numIn(req.body?.startQ ?? 0, 0, ed.measures[startM].durQ);
      const body = str(req.body?.body, 4000);
      if (!body) throw new HttpError(400, "Write a note first");
      const id = randomUUID();
      const t = now();
      db.prepare(
        "insert into private_notes (id, user_id, edition_id, production_id, start_m, start_q, end_m, body, created_at, updated_at) values (?,?,?,?,?,?,?,?,?,?)",
      ).run(id, req.user!.id, editionId, productionId, startM, startQ, null, body, t, t);
      res.status(201).json({ id, editionId, productionId, startM, startQ, endM: null, body, createdAt: t, updatedAt: t });
    }),
  );

  app.patch(
    "/api/notes/:id",
    wrap((req, res) => {
      const body = str(req.body?.body, 4000);
      const r = db.prepare("update private_notes set body = ?, updated_at = ? where id = ? and user_id = ?").run(body, now(), String(req.params.id), req.user!.id);
      if (!Number(r.changes)) throw new HttpError(404, "Note not found");
      res.json({ ok: true });
    }),
  );

  app.delete(
    "/api/notes/:id",
    wrap((req, res) => {
      const r = db.prepare("delete from private_notes where id = ? and user_id = ?").run(String(req.params.id), req.user!.id);
      if (!Number(r.changes)) throw new HttpError(404, "Note not found");
      res.json({ ok: true });
    }),
  );

  /* ---------------- content (signed-in users only) ---------------- */

  app.get("/content/:edition/{*rest}", (req, res) => {
    const base = resolve(opts.contentDir);
    const rest = (req.params as unknown as { rest: string[] }).rest;
    const file = normalize(join(base, String(req.params.edition), ...(Array.isArray(rest) ? rest : [String(rest)])));
    if (!file.startsWith(base + "/") || !existsSync(file)) return res.status(404).end();
    res.setHeader("Cache-Control", "private, max-age=300");
    res.sendFile(file);
  });

  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  /* ---------------- built client ---------------- */
  if (opts.staticDir && existsSync(opts.staticDir)) {
    app.use(express.static(opts.staticDir, { index: false, maxAge: "1h" }));
    app.get("/{*any}", (_req, res) => res.sendFile(resolve(opts.staticDir!, "index.html")));
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Something went wrong on the server" });
  });

  server.on("upgrade", (req, socket, head) => {
    if (new URL(req.url ?? "/", "http://x").pathname === "/ws") realtime.handleUpgrade(req, socket, head);
    else socket.destroy();
  });

  return {
    app,
    server,
    db,
    realtime,
    content,
    close: () =>
      new Promise<void>((r) => {
        realtime.close();
        server.close(() => {
          db.close();
          r();
        });
        server.closeAllConnections?.();
      }),
  };
}
