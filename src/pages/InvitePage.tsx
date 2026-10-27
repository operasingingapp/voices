import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../App";
import { Link, navigate } from "../router";

interface InvitePreview {
  productionName: string;
  pieceTitle?: string;
  permission: "editor" | "performer";
  roles: string[];
  problem: string | null;
}

export function InvitePage({ token }: { token: string }) {
  const { me, refresh } = useAuth();
  const [inv, setInv] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ displayName: "", username: "", password: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<InvitePreview>(`/api/invitations/${encodeURIComponent(token)}`)
      .then(setInv)
      .catch((e) => setError(e.message));
  }, [token]);

  const accept = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ productionId: string }>(`/api/invitations/${encodeURIComponent(token)}/accept`, { body: me ? {} : form });
      await refresh();
      navigate(`/p/${r.productionId}`, true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const what = inv ? `${inv.permission === "editor" ? "an editor" : inv.roles.length ? inv.roles.join(" and ") : "a performer"}` : "";

  return (
    <main className="login">
      <div className="login-panel wide">
        <h1 className="wordmark">Counterpart</h1>
        {error && !inv && <p className="form-error">{error}</p>}
        {inv && (
          <>
            <p className="invite-lede">
              You have been invited to <strong>{inv.productionName}</strong>
              {inv.pieceTitle ? ` (${inv.pieceTitle})` : ""} as {what}.
            </p>
            {inv.problem ? (
              <p className="form-error">{inv.problem} Ask the production editor for a new link.</p>
            ) : me ? (
              <>
                <p>
                  You are signed in as {me.displayName}. Joining gives you access to this production’s published versions and rehearsals.
                </p>
                {error && <p className="form-error">{error}</p>}
                <button className="btn primary" onClick={() => accept()} disabled={busy}>
                  Join production
                </button>
              </>
            ) : (
              <form className="form" onSubmit={accept}>
                <p>Create your account to join. Already have one?{" "}
                  <Link to={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>Sign in first</Link>.
                </p>
                <label>
                  Your name, as others will see it
                  <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
                </label>
                <label>
                  Username
                  <input autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                </label>
                <label>
                  Password (at least 10 characters)
                  <input type="password" autoComplete="new-password" minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </label>
                {error && <p className="form-error">{error}</p>}
                <button className="btn primary" disabled={busy}>
                  Create account and join
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
