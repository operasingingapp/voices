/**
 * Provisions test accounts and one private production for local use and demos.
 *
 *   npm run seed            (idempotent; prints the accounts)
 *   CP_SEED_PASSWORD=...    to choose the shared demo password
 */
import { randomUUID } from "node:crypto";
import { openDb, now } from "./db";
import { createUser } from "./auth";
import { ContentStore } from "./content";
import { addMember, createProduction, publishVersion, getProduction, latestVersionNumber } from "./productions";

const db = openDb(process.env.CP_DB ?? "data/counterpart.db");
const content = new ContentStore(process.env.CP_CONTENT ?? "data/content");
const password = process.env.CP_SEED_PASSWORD ?? "counterpart-demo";

const accounts = [
  { username: "elena", displayName: "Elena Ricci", note: "production editor" },
  { username: "sofia", displayName: "Sofia Marin", note: "singer — Clara (soprano)" },
  { username: "marco", displayName: "Marco Bellini", note: "accompanist" },
  { username: "luca", displayName: "Luca Ferri", note: "registered, NOT invited to the production" },
];

const ids: Record<string, string> = {};
for (const a of accounts) {
  const row = db.prepare("select id from users where username = ?").get(a.username) as { id: string } | undefined;
  ids[a.username] = row?.id ?? createUser(db, a.username, a.displayName, password).id;
}

const aria = content.edition("cp-fx-aria-lume")!;
let prod = db.prepare("select id from productions where name = ?").get("Lume di sera — studio production") as { id: string } | undefined;
if (!prod) {
  const id = createProduction(db, "Lume di sera — studio production", aria.editionId, aria.scoreVersionId, ids.elena);
  addMember(db, id, ids.sofia, "performer", ["clara"]);
  addMember(db, id, ids.marco, "performer", ["accompanist"]);
  db.prepare(
    "insert into comments (id, production_id, kind, start_m, start_q, end_m, end_q, body, author_id, created_at, status) values (?,?,?,?,?,?,?,?,?,?,?)",
  ).run(randomUUID(), id, "editorial", 7, 0, 8, 4, "Breathe after “lontano”, not before — carry the line into “scendi”.", ids.elena, now(), "open");
  publishVersion(db, getProduction(db, id)!, ids.elena, "First production version: original edition with a phrasing note.");
  prod = { id };
}

console.log("\nCounterpart test accounts (password for all: %s)\n", password);
for (const a of accounts) console.log(`  ${a.username.padEnd(6)}  ${a.displayName.padEnd(14)}  ${a.note}`);
console.log(`\nProduction “Lume di sera — studio production” (${prod.id}), latest version ${latestVersionNumber(db, prod.id)}\n`);
db.close();
