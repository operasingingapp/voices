import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../App";
import { Link, navigate } from "../router";
import type { CatalogEntry, Permission, Role } from "../../shared/types";

interface ProdSummary {
  id: string;
  name: string;
  editionId: string;
  permission: Permission;
  roles: string[];
  latestVersion: number | null;
}
interface SessionSummary {
  id: string;
  versionNumber: number;
  name: string;
  createdBy: string;
  participants: number;
}

export const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export function AppHeader(props: { children?: React.ReactNode }) {
  const { me, logout } = useAuth();
  return (
    <header className="app-header">
      <Link to="/" className="wordmark small">
        Counterpart
      </Link>
      <div className="app-header-mid">{props.children}</div>
      <div className="app-header-user">
        <span>{me?.displayName}</span>
        <button className="btn quiet" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}

export function roleNames(roles: string[], piece?: { roles: Role[] }) {
  return roles.map((r) => (r === "accompanist" ? "Accompanist" : piece?.roles.find((x) => x.id === r)?.name ?? r)).join(", ");
}

export function LibraryPage() {
  const [data, setData] = useState<{ pieces: CatalogEntry[]; productions: ProdSummary[] } | null>(null);
  const [sessions, setSessions] = useState<Record<string, SessionSummary[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    api<{ pieces: CatalogEntry[]; productions: ProdSummary[] }>("/api/library")
      .then(async (d) => {
        setData(d);
        const entries = await Promise.all(d.productions.map(async (p) => [p.id, await api<SessionSummary[]>(`/api/productions/${p.id}/rehearsals`)] as const));
        setSessions(Object.fromEntries(entries));
      })
      .catch((e) => setError(e.message));
  }, []);

  const create = async (editionId: string) => {
    try {
      const r = await api<{ id: string }>("/api/productions", { body: { name: newName, editionId } });
      navigate(`/p/${r.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="page">
      <AppHeader />
      <main className="library">
        {error && <p className="banner error">{error}</p>}
        <section aria-labelledby="pieces-h">
          <h1 id="pieces-h" className="page-title">
            Library
          </h1>
          <p className="page-lede">Pieces prepared by the editorial team. Practise any of them on your own, at your own tempo.</p>
          <ol className="indice">
            {data?.pieces.map((p, i) => (
              <li key={p.editionId} className="indice-row">
                <span className="indice-no">No. {i + 1}</span>
                <div className="indice-main">
                  <h2 className="indice-title">{p.title}</h2>
                  <p className="indice-sub">
                    {p.subtitle}. {p.keySignature}, {p.time}, {p.measures} bars, about {fmtDuration(p.durationSec)}
                    {p.hasRepeats ? " with the repeat" : ""} at the marked tempo.
                  </p>
                  <p className="indice-roles">
                    {p.roles.map((r) => (
                      <span key={r.id} className="role-chip">
                        {r.name} <em>{r.voiceType.toLowerCase()}</em>
                      </span>
                    ))}
                  </p>
                  {p.fixture && <p className="fixture-note">{p.fixtureNotice}</p>}
                  <p className="indice-lang">
                    Italian text with gloss, translation and IPA for {p.languageStatus.phrases} phrases. Spoken pronunciation available for {p.languageStatus.withAudio} of{" "}
                    {p.languageStatus.phrases}
                    {p.languageStatus.reviewed < p.languageStatus.phrases ? ", not yet reviewed by a diction coach" : ""}.
                  </p>
                  {creating === p.editionId && (
                    <form
                      className="inline-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        create(p.editionId);
                      }}
                    >
                      <label>
                        Production name
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} required autoFocus placeholder="e.g. Autumn studio showcase" />
                      </label>
                      <button className="btn primary">Create production</button>
                      <button type="button" className="btn quiet" onClick={() => setCreating(null)}>
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
                <div className="indice-actions">
                  <Link to={`/practice/${p.editionId}`} className="btn primary">
                    Practise
                  </Link>
                  <button className="btn quiet" onClick={() => setCreating(p.editionId)}>
                    New production
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="prod-h" className="productions">
          <h2 id="prod-h" className="section-title">
            Your productions
          </h2>
          {data && data.productions.length === 0 && <p className="empty">You are not in a production yet. Ask your production editor for an invitation link.</p>}
          <ul className="prod-list">
            {data?.productions.map((p) => {
              const piece = data.pieces.find((x) => x.editionId === p.editionId);
              const live = sessions[p.id] ?? [];
              return (
                <li key={p.id} className="prod-row">
                  <div>
                    <h3 className="prod-name">{p.name}</h3>
                    <p className="prod-meta">
                      {piece?.title}. You are {p.permission === "editor" ? "an editor" : "a performer"}
                      {p.roles.length ? ` (${roleNames(p.roles, piece)})` : ""}.{" "}
                      {p.latestVersion ? `Version ${p.latestVersion} is the latest.` : "Nothing published yet."}
                    </p>
                    {live.length > 0 && (
                      <ul className="session-list">
                        {live.map((s) => (
                          <li key={s.id}>
                            <span className="live-dot" aria-hidden /> {s.name}, version {s.versionNumber}, started by {s.createdBy}
                            <Link to={`/p/${p.id}/rehearsal/${s.id}`} className="btn small red">
                              Join rehearsal
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="prod-actions">
                    {p.latestVersion ? (
                      <Link to={`/p/${p.id}/v/${p.latestVersion}`} className="btn primary">
                        Practise version {p.latestVersion}
                      </Link>
                    ) : null}
                    <Link to={`/p/${p.id}`} className="btn quiet">
                      {p.permission === "editor" ? "Production settings" : "Production details"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
