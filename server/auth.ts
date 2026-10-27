import { randomBytes, scryptSync, timingSafeEqual, createHash, randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import type { DB } from "./db";
import { now } from "./db";

export const SESSION_COOKIE = "cp_session";
const SESSION_DAYS = 14;

export interface User {
  id: string;
  username: string;
  displayName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const N = 16384;
  const hash = scryptSync(pw, salt, 32, { N, r: 8, p: 1 });
  return `scrypt$${N}$8$1$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [alg, N, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt") return false;
  const expected = Buffer.from(hash, "base64");
  const got = scryptSync(pw, Buffer.from(salt, "base64"), expected.length, { N: Number(N), r: Number(r), p: Number(p) });
  return timingSafeEqual(expected, got);
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function createUser(db: DB, username: string, displayName: string, password: string): User {
  const id = randomUUID();
  db.prepare("insert into users (id, username, display_name, password_hash, created_at) values (?,?,?,?,?)").run(
    id,
    username.toLowerCase(),
    displayName,
    hashPassword(password),
    now(),
  );
  return { id, username: username.toLowerCase(), displayName };
}

export function createSession(db: DB, userId: string): string {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  db.prepare("insert into sessions (token_hash, user_id, created_at, expires_at) values (?,?,?,?)").run(sha256(token), userId, now(), expires);
  return token;
}

export function userFromToken(db: DB, token: string | undefined): User | undefined {
  if (!token) return undefined;
  const row = db
    .prepare(
      "select u.id, u.username, u.display_name as displayName, s.expires_at as exp from sessions s join users u on u.id = s.user_id where s.token_hash = ?",
    )
    .get(sha256(token)) as { id: string; username: string; displayName: string; exp: string } | undefined;
  if (!row || row.exp < now()) return undefined;
  return { id: row.id, username: row.username, displayName: row.displayName };
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function setSessionCookie(res: Response, token: string, secure: boolean) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: SESSION_DAYS * 864e5,
    path: "/",
  });
}

export function authMiddleware(db: DB) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.user = userFromToken(db, parseCookies(req.headers.cookie)[SESSION_COOKIE]);
    next();
  };
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Sign in required" });
  next();
}

/** Very small fixed-window limiter for sign-in attempts. */
const attempts = new Map<string, { n: number; reset: number }>();
export function allowAttempt(key: string, limit = 8, windowMs = 60_000): boolean {
  const t = Date.now();
  const a = attempts.get(key);
  if (!a || a.reset < t) {
    attempts.set(key, { n: 1, reset: t + windowMs });
    return true;
  }
  a.n++;
  return a.n <= limit;
}
