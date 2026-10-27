import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type DB = DatabaseSync;

const SCHEMA = `
pragma foreign_keys = on;
pragma journal_mode = wal;

create table if not exists users (
  id text primary key,
  username text unique not null,
  display_name text not null,
  password_hash text not null,
  created_at text not null
);

create table if not exists sessions (
  token_hash text primary key,
  user_id text not null references users(id) on delete cascade,
  created_at text not null,
  expires_at text not null
);

create table if not exists productions (
  id text primary key,
  name text not null,
  edition_id text not null,
  score_version_id text not null,
  created_by text not null references users(id),
  created_at text not null
);

create table if not exists production_members (
  production_id text not null references productions(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  permission text not null check (permission in ('editor','performer')),
  roles text not null default '[]',
  joined_at text not null,
  primary key (production_id, user_id)
);

create table if not exists invitations (
  id text primary key,
  token_hash text unique not null,
  production_id text not null references productions(id) on delete cascade,
  permission text not null check (permission in ('editor','performer')),
  roles text not null default '[]',
  label text,
  created_by text not null references users(id),
  created_at text not null,
  expires_at text not null,
  max_uses integer not null,
  uses integer not null default 0,
  revoked_at text
);

-- Draft production changes. Published versions hold immutable copies in their snapshot.
create table if not exists draft_cuts (
  id text primary key,
  production_id text not null references productions(id) on delete cascade,
  start_m integer not null,
  end_m integer not null,
  status text not null check (status in ('ok','flagged')),
  issues text not null,
  created_by text not null references users(id),
  created_at text not null
);

create table if not exists comments (
  id text primary key,
  production_id text not null references productions(id) on delete cascade,
  kind text not null check (kind in ('editorial','correction')),
  start_m integer not null,
  start_q real not null,
  end_m integer not null,
  end_q real not null,
  body text not null,
  author_id text not null references users(id),
  created_at text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  version_number integer
);

create table if not exists production_versions (
  production_id text not null references productions(id),
  number integer not null,
  summary text not null,
  snapshot text not null,
  published_by text not null references users(id),
  published_at text not null,
  primary key (production_id, number)
);

create trigger if not exists production_versions_no_update
before update on production_versions
begin select raise(abort, 'published production versions are immutable'); end;

create trigger if not exists production_versions_no_delete
before delete on production_versions
begin select raise(abort, 'published production versions are immutable'); end;

create table if not exists private_notes (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  edition_id text not null,
  production_id text,
  start_m integer not null,
  start_q real not null,
  end_m integer,
  body text not null,
  created_at text not null,
  updated_at text not null
);
create index if not exists private_notes_owner on private_notes(user_id, edition_id);

create table if not exists rehearsal_sessions (
  id text primary key,
  production_id text not null references productions(id) on delete cascade,
  version_number integer not null,
  name text not null,
  created_by text not null references users(id),
  created_at text not null,
  ended_at text,
  participant_ids text not null,
  state text not null
);
`;

export function openDb(file: string): DB {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

export const now = () => new Date().toISOString();

export function tx<T>(db: DB, fn: () => T): T {
  db.exec("begin immediate");
  try {
    const r = fn();
    db.exec("commit");
    return r;
  } catch (e) {
    db.exec("rollback");
    throw e;
  }
}
