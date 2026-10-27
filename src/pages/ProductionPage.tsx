import { useCallback, useEffect, useMemo, useState } from "react";
import { api, fetchJson } from "../api";
import { useAuth } from "../App";
import { Link, navigate } from "../router";
import { AppHeader, roleNames } from "./LibraryPage";
import type { CompiledEdition, Cut, CutIssue, PassageComment, Permission } from "../../shared/types";

interface Member {
  userId: string;
  displayName: string;
  username?: string;
  permission: Permission;
  roles: string[];
}
interface Invitation {
  id: string;
  permission: Permission;
  roles: string[];
  label: string | null;
  expiresAt: string;
  maxUses: number;
  uses: number;
  revokedAt: string | null;
  createdAt: string;
}
interface ProductionData {
  production: { id: string; name: string; editionId: string; scoreVersionId: string };
  me: { permission: Permission; roles: string[] };
  versions: { number: number; summary: string; publishedAt: string; publishedBy: string }[];
  latestVersion: number;
  members: Member[];
  draft?: { cuts: Cut[]; comments: PassageComment[]; changes: string[] };
  corrections: PassageComment[];
  invitations?: Invitation[];
}
interface SessionSummary {
  id: string;
  versionNumber: number;
  name: string;
  createdBy: string;
  participants: number;
}

const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function ProductionPage({ productionId }: { productionId: string }) {
  const { me } = useAuth();
  const [data, setData] = useState<ProductionData | null>(null);
  const [edition, setEdition] = useState<CompiledEdition | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<ProductionData>(`/api/productions/${productionId}`);
      setData(d);
      setSessions(await api<SessionSummary[]>(`/api/productions/${productionId}/rehearsals`));
      if (!edition || edition.editionId !== d.production.editionId) setEdition(await fetchJson<CompiledEdition>(`/content/${d.production.editionId}/edition.json`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [productionId, edition]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productionId]);

  const isEditor = data?.me.permission === "editor";
  const num = (m: number) => edition?.measures[m]?.number ?? String(m + 1);

  if (error && !data)
    return (
      <div className="page">
        <AppHeader />
        <main className="prod-page">
          <p className="banner error">{error}</p>
          <Link to="/">Back to the library</Link>
        </main>
      </div>
    );
  if (!data || !edition)
    return (
      <div className="page">
        <AppHeader />
        <main className="prod-page">
          <p className="loading">Loading production…</p>
        </main>
      </div>
    );


  return (
    <div className="page">
      <AppHeader>
        <span className="crumb">
          <Link to="/">Library</Link> / {data.production.name}
        </span>
      </AppHeader>
      <main className="prod-page">
        <div className="prod-head">
          <div>
            <h1 className="page-title">{data.production.name}</h1>
            <p className="page-lede">
              {edition.title}, edition {edition.editionVersion}
              {edition.fixture ? " (development fixture)" : ""}. You are {isEditor ? "an editor" : "a performer"}
              {data.me.roles.length ? `: ${roleNames(data.me.roles, edition)}` : ""}.
            </p>
          </div>
          <div className="prod-head-actions">
            {data.latestVersion > 0 && (
              <Link className="btn primary" to={`/p/${productionId}/v/${data.latestVersion}`}>
                Practise version {data.latestVersion}
              </Link>
            )}
            {isEditor && (
              <Link className="btn blue" to={`/p/${productionId}/v/draft`}>
                Edit draft in the score
              </Link>
            )}
          </div>
        </div>
        {error && <p className="banner error">{error}</p>}
        {notice && <p className="banner ok">{notice}</p>}

        <div className="prod-grid">
          <section className="prod-section">
            <h2 className="section-title">Published versions</h2>
            {data.versions.length === 0 && <p className="empty">Nothing is published yet. Performers see the production once its first version is published.</p>}
            <ol className="version-list" reversed>
              {data.versions.map((v) => (
                <li key={v.number} className={v.number === data.latestVersion ? "latest" : ""}>
                  <div>
                    <strong>Version {v.number}</strong>
                    {v.number === data.latestVersion && <span className="tag blue">Latest</span>}
                    <p>{v.summary}</p>
                    <p className="fine">
                      Published by {v.publishedBy}, {fmtDate(v.publishedAt)}. Published versions never change; later edits go into a new draft.
                    </p>
                  </div>
                  <Link className="btn small" to={`/p/${productionId}/v/${v.number}`}>
                    Practise
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <RehearsalsSection
            productionId={productionId}
            versions={data.versions}
            members={data.members}
            sessions={sessions}
            meId={me!.id}
            onError={setError}
          />

          {isEditor && data.draft && (
            <DraftSection
              productionId={productionId}
              edition={edition}
              draft={data.draft}
              nextVersion={data.latestVersion + 1}
              onChanged={load}
              onError={setError}
              onPublished={(n) => {
                setNotice(`Version ${n} published. Rehearsals already in progress keep the version they started with.`);
                load();
              }}
            />
          )}

          <section className="prod-section">
            <h2 className="section-title">{isEditor ? "Correction requests" : "Your correction requests"}</h2>
            <p className="fine">Libretto and notation cannot be edited here. Ask the editorial team for a correction with a comment on the passage.</p>
            {data.corrections.length === 0 && <p className="empty">No correction requests.</p>}
            <ul className="comment-list">
              {data.corrections.map((c) => (
                <li key={c.id} className={c.status === "resolved" ? "resolved" : ""}>
                  <span className="passage">
                    m. {num(c.startM)}
                    {c.endM !== c.startM ? `–${num(c.endM)}` : ""}
                  </span>
                  <p>{c.body}</p>
                  <p className="fine">
                    {c.authorName}, {fmtDate(c.createdAt)}
                    {c.versionNumber ? `, against version ${c.versionNumber}` : ""}. {c.status === "resolved" ? "Resolved." : "Open."}
                  </p>
                  {isEditor && c.status === "open" && (
                    <button
                      className="btn small quiet"
                      onClick={async () => {
                        await api(`/api/productions/${productionId}/comments/${c.id}`, { method: "PATCH", body: { status: "resolved" } });
                        load();
                      }}
                    >
                      Mark resolved
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <PeopleSection productionId={productionId} edition={edition} data={data} onChanged={load} onError={setError} />
        </div>
      </main>
    </div>
  );
}

function RehearsalsSection(props: {
  productionId: string;
  versions: { number: number }[];
  members: Member[];
  sessions: SessionSummary[];
  meId: string;
  onError: (e: string) => void;
}) {
  const [version, setVersion] = useState<number>(props.versions[0]?.number ?? 0);
  const [picked, setPicked] = useState<string[]>(props.members.map((m) => m.userId));
  const [name, setName] = useState("");
  useEffect(() => setVersion(props.versions[0]?.number ?? 0), [props.versions]);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await api<{ id: string }>(`/api/productions/${props.productionId}/rehearsals`, {
        body: { versionNumber: version, participantIds: picked, name: name || undefined },
      });
      navigate(`/p/${props.productionId}/rehearsal/${r.id}`);
    } catch (err) {
      props.onError((err as Error).message);
    }
  };

  return (
    <section className="prod-section">
      <h2 className="section-title">Rehearsals</h2>
      {props.sessions.length > 0 && (
        <ul className="session-list">
          {props.sessions.map((s) => (
            <li key={s.id}>
              <span className="live-dot" aria-hidden /> {s.name}, version {s.versionNumber}, {s.participants} invited, started by {s.createdBy}
              <Link to={`/p/${props.productionId}/rehearsal/${s.id}`} className="btn small red">
                Join
              </Link>
            </li>
          ))}
        </ul>
      )}
      {props.versions.length ? (
        <form className="form compact" onSubmit={start}>
          <p className="fine">A rehearsal session shares one musical position between participants. It stays on the version it starts with.</p>
          <label>
            Version
            <select value={version} onChange={(e) => setVersion(Number(e.target.value))}>
              {props.versions.map((v) => (
                <option key={v.number} value={v.number}>
                  Version {v.number}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>Who can join</legend>
            {props.members.map((m) => (
              <label key={m.userId} className="check">
                <input
                  type="checkbox"
                  checked={picked.includes(m.userId) || m.userId === props.meId}
                  disabled={m.userId === props.meId}
                  onChange={(e) => setPicked(e.target.checked ? [...picked, m.userId] : picked.filter((x) => x !== m.userId))}
                />
                {m.displayName}
              </label>
            ))}
          </fieldset>
          <label>
            Session name (optional)
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coaching with Marco" />
          </label>
          <button className="btn red">Start rehearsal</button>
        </form>
      ) : (
        <p className="empty">Rehearsals become available once a version is published.</p>
      )}
    </section>
  );
}

function IssueList({ issues }: { issues: CutIssue[] }) {
  if (!issues.length) return <p className="fine ok-text">No boundary problems found.</p>;
  return (
    <ul className="issues">
      {issues.map((i, k) => (
        <li key={k} className={i.severity}>
          <strong>{i.severity === "error" ? "Needs correction" : "Check"}:</strong> {i.message}
        </li>
      ))}
    </ul>
  );
}

function DraftSection(props: {
  productionId: string;
  edition: CompiledEdition;
  draft: { cuts: Cut[]; comments: PassageComment[]; changes: string[] };
  nextVersion: number;
  onChanged: () => void;
  onError: (e: string) => void;
  onPublished: (n: number) => void;
}) {
  const ed = props.edition;
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);
  const [preview, setPreview] = useState<{ status: string; issues: CutIssue[] } | null>(null);
  const [comment, setComment] = useState({ startM: 0, endM: 0, body: "" });
  const [summary, setSummary] = useState("");
  const flagged = props.draft.cuts.filter((c) => c.status === "flagged");
  const num = (m: number) => ed.measures[m].number;
  const options = useMemo(() => ed.measures.map((m) => <option key={m.idx} value={m.idx}>{`m. ${m.number}`}</option>), [ed]);

  const check = async (f = from, t = to) => {
    try {
      setPreview(await api(`/api/productions/${props.productionId}/cuts/preview`, { body: { startM: f, endM: t } }));
    } catch (e) {
      props.onError((e as Error).message);
    }
  };

  return (
    <section className="prod-section draft">
      <h2 className="section-title">Draft for version {props.nextVersion}</h2>
      <h3 className="sub-title">Cuts</h3>
      <p className="fine">Whole-measure cuts only. Every part skips a cut in playback. Boundaries the app cannot honour are flagged for editorial correction.</p>
      <ul className="cut-list">
        {props.draft.cuts.map((c) => (
          <li key={c.id} className={c.status}>
            <span className="vide-chip">vi–de</span> m. {num(c.startM)}–{num(c.endM)}
            {c.status === "flagged" && <span className="tag red">Needs correction</span>}
            <IssueList issues={c.issues} />
            <button
              className="btn small quiet"
              onClick={async () => {
                await api(`/api/productions/${props.productionId}/cuts/${c.id}`, { method: "DELETE", body: {} });
                props.onChanged();
              }}
            >
              Remove cut
            </button>
          </li>
        ))}
      </ul>
      <form
        className="form row"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api(`/api/productions/${props.productionId}/cuts`, { body: { startM: from, endM: to } });
            setPreview(null);
            props.onChanged();
          } catch (err) {
            props.onError((err as Error).message);
          }
        }}
      >
        <label>
          From
          <select
            value={from}
            onChange={(e) => {
              const f = Number(e.target.value);
              setFrom(f);
              const t = Math.max(f, to);
              setTo(t);
              check(f, t);
            }}
          >
            {options}
          </select>
        </label>
        <label>
          To
          <select
            value={to}
            onChange={(e) => {
              setTo(Number(e.target.value));
              check(from, Number(e.target.value));
            }}
          >
            {options}
          </select>
        </label>
        <button className="btn blue">Add cut</button>
      </form>
      {preview && <IssueList issues={preview.issues} />}

      <h3 className="sub-title">Shared comments</h3>
      <ul className="comment-list">
        {props.draft.comments.map((c) => (
          <li key={c.id} className={c.status === "resolved" ? "resolved" : ""}>
            <span className="passage">
              m. {num(c.startM)}
              {c.endM !== c.startM ? `–${num(c.endM)}` : ""}
            </span>
            <p>{c.body}</p>
            <p className="fine">{c.status === "resolved" ? "Resolved: left out of the next version." : `${c.authorName}`}</p>
            <button
              className="btn small quiet"
              onClick={async () => {
                await api(`/api/productions/${props.productionId}/comments/${c.id}`, { method: "DELETE", body: {} });
                props.onChanged();
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <form
        className="form row"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api(`/api/productions/${props.productionId}/comments`, { body: { ...comment, kind: "editorial" } });
            setComment({ ...comment, body: "" });
            props.onChanged();
          } catch (err) {
            props.onError((err as Error).message);
          }
        }}
      >
        <label>
          From
          <select value={comment.startM} onChange={(e) => setComment({ ...comment, startM: Number(e.target.value), endM: Math.max(Number(e.target.value), comment.endM) })}>
            {options}
          </select>
        </label>
        <label>
          To
          <select value={comment.endM} onChange={(e) => setComment({ ...comment, endM: Number(e.target.value) })}>
            {options}
          </select>
        </label>
        <label className="grow">
          Comment
          <input value={comment.body} onChange={(e) => setComment({ ...comment, body: e.target.value })} required placeholder="e.g. Take the breath after “mare”" />
        </label>
        <button className="btn blue">Add comment</button>
      </form>

      <h3 className="sub-title">Publish</h3>
      {props.draft.changes.length ? (
        <ul className="changes">
          {props.draft.changes.map((c, i) => (
            <li key={i}>{c.replace(/measures idx (\d+)–(\d+)/, (_, a, b) => `m. ${num(Number(a))}–${num(Number(b))}`)}</li>
          ))}
        </ul>
      ) : (
        <p className="fine">The draft matches the latest published version.</p>
      )}
      <form
        className="form row"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const r = await api<{ number: number }>(`/api/productions/${props.productionId}/publish`, { body: { summary } });
            setSummary("");
            props.onPublished(r.number);
          } catch (err) {
            props.onError((err as Error).message);
          }
        }}
      >
        <label className="grow">
          Change summary
          <input value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={280} required placeholder="e.g. Cut the più mosso, m. 13–16" />
        </label>
        <button className="btn primary" disabled={flagged.length > 0 || (props.nextVersion > 1 && props.draft.changes.length === 0)}>
          Publish version {props.nextVersion}
        </button>
      </form>
      {flagged.length > 0 && (
        <p className="form-error">
          {flagged.length} cut{flagged.length > 1 ? "s need" : " needs"} editorial correction. Remove or adjust {flagged.length > 1 ? "them" : "it"} before publishing.
        </p>
      )}
    </section>
  );
}

function PeopleSection(props: { productionId: string; edition: CompiledEdition; data: ProductionData; onChanged: () => void; onError: (e: string) => void }) {
  const isEditor = props.data.me.permission === "editor";
  const roleOptions = [...props.edition.roles.map((r) => ({ id: r.id, label: `${r.name} (${r.voiceType})` })), { id: "accompanist", label: "Accompanist" }];
  const [inv, setInv] = useState<{ permission: Permission; roles: string[]; maxUses: number; expiresInHours: number; label: string }>({
    permission: "performer",
    roles: [],
    maxUses: 1,
    expiresInHours: 72,
    label: "",
  });
  const [link, setLink] = useState<string | null>(null);

  return (
    <section className="prod-section">
      <h2 className="section-title">People</h2>
      <ul className="member-list">
        {props.data.members.map((m) => (
          <li key={m.userId}>
            <div>
              <strong>{m.displayName}</strong> <span className="fine">{m.permission === "editor" ? "Editor" : "Performer"}</span>
              <p className="fine">{m.roles.length ? roleNames(m.roles, props.edition) : "No role assigned"}</p>
            </div>
            {isEditor && (
              <div className="role-toggles">
                {roleOptions.map((r) => (
                  <label key={r.id} className="check small">
                    <input
                      type="checkbox"
                      checked={m.roles.includes(r.id)}
                      onChange={async (e) => {
                        try {
                          await api(`/api/productions/${props.productionId}/members/${m.userId}`, {
                            method: "PATCH",
                            body: { roles: e.target.checked ? [...m.roles, r.id] : m.roles.filter((x) => x !== r.id) },
                          });
                          props.onChanged();
                        } catch (err) {
                          props.onError((err as Error).message);
                        }
                      }}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      {isEditor && (
        <>
          <h3 className="sub-title">Invite someone</h3>
          <form
            className="form compact"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const r = await api<{ path: string }>(`/api/productions/${props.productionId}/invitations`, { body: inv });
                setLink(`${location.origin}${r.path}`);
                props.onChanged();
              } catch (err) {
                props.onError((err as Error).message);
              }
            }}
          >
            <label>
              Access
              <select value={inv.permission} onChange={(e) => setInv({ ...inv, permission: e.target.value as Permission })}>
                <option value="performer">Performer or accompanist</option>
                <option value="editor">Editor</option>
              </select>
            </label>
            <fieldset>
              <legend>Roles</legend>
              {roleOptions.map((r) => (
                <label key={r.id} className="check">
                  <input
                    type="checkbox"
                    checked={inv.roles.includes(r.id)}
                    onChange={(e) => setInv({ ...inv, roles: e.target.checked ? [...inv.roles, r.id] : inv.roles.filter((x) => x !== r.id) })}
                  />
                  {r.label}
                </label>
              ))}
            </fieldset>
            <label>
              Link works for
              <select value={inv.expiresInHours} onChange={(e) => setInv({ ...inv, expiresInHours: Number(e.target.value) })}>
                <option value={24}>1 day</option>
                <option value={72}>3 days</option>
                <option value={168}>1 week</option>
              </select>
            </label>
            <button className="btn primary">Create invitation link</button>
          </form>
          {link && (
            <div className="invite-link">
              <p>Send this link to the person you are inviting. It works once.</p>
              <code>{link}</code>
              <button className="btn small" onClick={() => navigator.clipboard?.writeText(link)}>
                Copy link
              </button>
            </div>
          )}
          {props.data.invitations && props.data.invitations.length > 0 && (
            <ul className="invite-list">
              {props.data.invitations.map((i) => {
                const state = i.revokedAt ? "Revoked" : i.uses >= i.maxUses ? "Used" : new Date(i.expiresAt) < new Date() ? "Expired" : "Waiting";
                return (
                  <li key={i.id}>
                    {i.permission === "editor" ? "Editor" : "Performer"}
                    {i.roles.length ? `, ${roleNames(i.roles, props.edition)}` : ""} <span className="fine">{state}</span>
                    {state === "Waiting" && (
                      <button
                        className="btn small quiet"
                        onClick={async () => {
                          await api(`/api/productions/${props.productionId}/invitations/${i.id}`, { method: "DELETE", body: {} });
                          props.onChanged();
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
