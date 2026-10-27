import { randomUUID, randomBytes } from "node:crypto";
import type { DB } from "./db";
import { now, tx } from "./db";
import { sha256 } from "./auth";
import type { Cut, PassageComment, Permission, ProductionVersion, VersionSnapshot } from "../shared/types";

export interface Membership {
  productionId: string;
  userId: string;
  permission: Permission;
  roles: string[];
}

export interface ProductionRow {
  id: string;
  name: string;
  editionId: string;
  scoreVersionId: string;
  createdBy: string;
  createdAt: string;
}

export function getProduction(db: DB, id: string): ProductionRow | undefined {
  return db
    .prepare(
      "select id, name, edition_id as editionId, score_version_id as scoreVersionId, created_by as createdBy, created_at as createdAt from productions where id = ?",
    )
    .get(id) as ProductionRow | undefined;
}

export function getMembership(db: DB, productionId: string, userId: string): Membership | undefined {
  const row = db
    .prepare("select permission, roles from production_members where production_id = ? and user_id = ?")
    .get(productionId, userId) as { permission: Permission; roles: string } | undefined;
  if (!row) return undefined;
  return { productionId, userId, permission: row.permission, roles: JSON.parse(row.roles) };
}

export function listMemberships(db: DB, userId: string) {
  return (
    db
      .prepare(
        `select p.id, p.name, p.edition_id as editionId, m.permission, m.roles,
          (select max(number) from production_versions v where v.production_id = p.id) as latestVersion
         from production_members m join productions p on p.id = m.production_id where m.user_id = ? order by p.created_at`,
      )
      .all(userId) as { id: string; name: string; editionId: string; permission: Permission; roles: string; latestVersion: number | null }[]
  ).map((r) => ({ ...r, roles: JSON.parse(r.roles) as string[] }));
}

export function listMembers(db: DB, productionId: string) {
  return (
    db
      .prepare(
        `select u.id as userId, u.username, u.display_name as displayName, m.permission, m.roles, m.joined_at as joinedAt
         from production_members m join users u on u.id = m.user_id where m.production_id = ? order by m.permission, u.display_name`,
      )
      .all(productionId) as { userId: string; username: string; displayName: string; permission: Permission; roles: string; joinedAt: string }[]
  ).map((r) => ({ ...r, roles: JSON.parse(r.roles) as string[] }));
}

export function createProduction(db: DB, name: string, editionId: string, scoreVersionId: string, userId: string) {
  const id = randomUUID();
  tx(db, () => {
    db.prepare("insert into productions (id, name, edition_id, score_version_id, created_by, created_at) values (?,?,?,?,?,?)").run(
      id,
      name,
      editionId,
      scoreVersionId,
      userId,
      now(),
    );
    db.prepare("insert into production_members (production_id, user_id, permission, roles, joined_at) values (?,?,?,?,?)").run(
      id,
      userId,
      "editor",
      "[]",
      now(),
    );
  });
  return id;
}

export function addMember(db: DB, productionId: string, userId: string, permission: Permission, roles: string[]) {
  db.prepare(
    `insert into production_members (production_id, user_id, permission, roles, joined_at) values (?,?,?,?,?)
     on conflict(production_id, user_id) do update set permission = excluded.permission, roles = excluded.roles`,
  ).run(productionId, userId, permission, JSON.stringify(roles), now());
}

/* ---------- cuts & comments (draft) ---------- */

export function draftCuts(db: DB, productionId: string): Cut[] {
  return (
    db
      .prepare(
        "select id, start_m as startM, end_m as endM, status, issues, created_by as createdBy, created_at as createdAt from draft_cuts where production_id = ? order by start_m",
      )
      .all(productionId) as (Omit<Cut, "issues"> & { issues: string })[]
  ).map((c) => ({ ...c, issues: JSON.parse(c.issues) }));
}

const commentSelect = `select c.id, c.kind, c.start_m as startM, c.start_q as startQ, c.end_m as endM, c.end_q as endQ, c.body,
  c.author_id as authorId, u.display_name as authorName, c.created_at as createdAt, c.status, c.version_number as versionNumber
  from comments c join users u on u.id = c.author_id`;

export function editorialComments(db: DB, productionId: string): PassageComment[] {
  return db.prepare(`${commentSelect} where c.production_id = ? and c.kind = 'editorial' order by c.start_m, c.start_q`).all(productionId) as unknown as PassageComment[];
}

/** Correction requests are visible to editors and to the person who filed them. */
export function correctionRequests(db: DB, productionId: string, viewer: Membership): PassageComment[] {
  if (viewer.permission === "editor")
    return db.prepare(`${commentSelect} where c.production_id = ? and c.kind = 'correction' order by c.created_at desc`).all(productionId) as unknown as PassageComment[];
  return db
    .prepare(`${commentSelect} where c.production_id = ? and c.kind = 'correction' and c.author_id = ? order by c.created_at desc`)
    .all(productionId, viewer.userId) as unknown as PassageComment[];
}

export function getComment(db: DB, id: string): (PassageComment & { productionId: string }) | undefined {
  return db.prepare(`${commentSelect.replace("select ", "select c.production_id as productionId, ")} where c.id = ?`).get(id) as
    | (PassageComment & { productionId: string })
    | undefined;
}

/* ---------- versions ---------- */

export function listVersions(db: DB, productionId: string) {
  return db
    .prepare(
      `select v.number, v.summary, v.published_at as publishedAt, u.display_name as publishedBy
       from production_versions v join users u on u.id = v.published_by where v.production_id = ? order by v.number desc`,
    )
    .all(productionId) as { number: number; summary: string; publishedAt: string; publishedBy: string }[];
}

export function getVersion(db: DB, productionId: string, n: number): ProductionVersion | undefined {
  const row = db
    .prepare(
      `select v.number, v.summary, v.published_at as publishedAt, u.display_name as publishedBy, v.snapshot
       from production_versions v join users u on u.id = v.published_by where v.production_id = ? and v.number = ?`,
    )
    .get(productionId, n) as (Omit<ProductionVersion, "snapshot"> & { snapshot: string }) | undefined;
  if (!row) return undefined;
  return { ...row, snapshot: JSON.parse(row.snapshot) };
}

export function latestVersionNumber(db: DB, productionId: string): number {
  const r = db.prepare("select max(number) as n from production_versions where production_id = ?").get(productionId) as { n: number | null };
  return r.n ?? 0;
}

export function draftSnapshot(db: DB, p: ProductionRow): VersionSnapshot {
  return {
    editionId: p.editionId,
    scoreVersionId: p.scoreVersionId,
    cuts: draftCuts(db, p.id),
    comments: editorialComments(db, p.id).filter((c) => c.status === "open"),
  };
}

/** Compare the draft with the latest published version (what a publish would change). */
export function draftChanges(db: DB, p: ProductionRow): string[] {
  const latest = latestVersionNumber(db, p.id);
  const prev = latest ? getVersion(db, p.id, latest)!.snapshot : { cuts: [], comments: [] };
  const draft = draftSnapshot(db, p);
  const out: string[] = [];
  const key = (c: Cut) => `${c.startM}-${c.endM}`;
  const prevCuts = new Set(prev.cuts.map(key));
  const draftCutKeys = new Set(draft.cuts.map(key));
  for (const c of draft.cuts) if (!prevCuts.has(key(c))) out.push(`cut added: measures idx ${c.startM}–${c.endM}`);
  for (const c of prev.cuts) if (!draftCutKeys.has(key(c))) out.push(`cut removed: measures idx ${c.startM}–${c.endM}`);
  const prevC = new Map(prev.comments.map((c) => [c.id, c.body]));
  const draftC = new Map(draft.comments.map((c) => [c.id, c.body]));
  for (const [id, body] of draftC) if (!prevC.has(id)) out.push(`comment added`);
  else if (prevC.get(id) !== body) out.push(`comment edited`);
  for (const id of prevC.keys()) if (!draftC.has(id)) out.push(`comment removed or resolved`);
  return out;
}

export function publishVersion(db: DB, p: ProductionRow, userId: string, summary: string): ProductionVersion {
  return tx(db, () => {
    const n = latestVersionNumber(db, p.id) + 1;
    const snapshot = draftSnapshot(db, p);
    const at = now();
    db.prepare("insert into production_versions (production_id, number, summary, snapshot, published_by, published_at) values (?,?,?,?,?,?)").run(
      p.id,
      n,
      summary,
      JSON.stringify(snapshot),
      userId,
      at,
    );
    return { number: n, summary, publishedAt: at, publishedBy: userId, snapshot };
  });
}

/* ---------- invitations ---------- */

export function createInvitation(
  db: DB,
  productionId: string,
  createdBy: string,
  opts: { permission: Permission; roles: string[]; label?: string; expiresInHours: number; maxUses: number },
) {
  const token = randomBytes(24).toString("base64url");
  const id = randomUUID();
  const expires = new Date(Date.now() + opts.expiresInHours * 3600e3).toISOString();
  db.prepare(
    `insert into invitations (id, token_hash, production_id, permission, roles, label, created_by, created_at, expires_at, max_uses)
     values (?,?,?,?,?,?,?,?,?,?)`,
  ).run(id, sha256(token), productionId, opts.permission, JSON.stringify(opts.roles), opts.label ?? null, createdBy, now(), expires, opts.maxUses);
  return { id, token, expiresAt: expires };
}

export interface InvitationRow {
  id: string;
  productionId: string;
  permission: Permission;
  roles: string[];
  label: string | null;
  expiresAt: string;
  maxUses: number;
  uses: number;
  revokedAt: string | null;
  createdAt: string;
}

const invSelect = `select id, production_id as productionId, permission, roles, label, expires_at as expiresAt, max_uses as maxUses,
  uses, revoked_at as revokedAt, created_at as createdAt from invitations`;

export function findInvitation(db: DB, token: string): InvitationRow | undefined {
  const r = db.prepare(`${invSelect} where token_hash = ?`).get(sha256(token)) as (Omit<InvitationRow, "roles"> & { roles: string }) | undefined;
  return r ? { ...r, roles: JSON.parse(r.roles) } : undefined;
}

export function listInvitations(db: DB, productionId: string): InvitationRow[] {
  return (db.prepare(`${invSelect} where production_id = ? order by created_at desc`).all(productionId) as (Omit<InvitationRow, "roles"> & { roles: string })[]).map(
    (r) => ({ ...r, roles: JSON.parse(r.roles) }),
  );
}

export function invitationUsable(inv: InvitationRow): string | null {
  if (inv.revokedAt) return "This invitation has been revoked.";
  if (inv.expiresAt < now()) return "This invitation has expired.";
  if (inv.uses >= inv.maxUses) return "This invitation has already been used.";
  return null;
}

export function acceptInvitation(db: DB, inv: InvitationRow, userId: string) {
  tx(db, () => {
    const r = db.prepare("update invitations set uses = uses + 1 where id = ? and uses < max_uses and revoked_at is null").run(inv.id);
    if (Number(r.changes) !== 1) throw new Error("invitation no longer usable");
    const existing = getMembership(db, inv.productionId, userId);
    // never downgrade an existing editor through an invitation
    const permission = existing?.permission === "editor" ? "editor" : inv.permission;
    const roles = Array.from(new Set([...(existing?.roles ?? []), ...inv.roles]));
    addMember(db, inv.productionId, userId, permission, roles);
  });
}
